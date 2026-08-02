// controllers/authController.js
// Registration, login, logout, session (me), password change & reset.
import crypto from 'crypto';
import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { sendTokenCookie, clearTokenCookie } from '../utils/generateToken.js';
import { sendMail, isMailEnabled } from '../utils/mailer.js';
import { sendSms, isSmsEnabled } from '../utils/sms.js';
import { verifyPhoneIdToken, isFirebaseEnabled } from '../config/firebaseAdmin.js';
import normalizePhone from '../utils/normalizePhone.js';

const OTP_TTL_MS = 5 * 60 * 1000;    // codes valid for 5 minutes
const OTP_RESEND_MS = 60 * 1000;     // min gap between sends to one number
const OTP_MAX_ATTEMPTS = 5;          // wrong-code guesses before the code is burned
const hashOtp = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');

// Shape the user object returned to the client (never expose password/tokens).
const publicUser = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  dob: u.dob,
  gender: u.gender,
  role: u.role,
  avatar: u.avatar,
  addresses: u.addresses,
  // Lets the UI hide password controls from OTP-only customers.
  hasPassword: Boolean(u.hasPassword),
});

// NOTE: Customer accounts are created and accessed ONLY through phone + OTP
// (requestOtp → verifyOtp below). There is no public email/password sign-up.
// The email+password `login` further down is retained for staff/admin accounts,
// which are provisioned by the seed script rather than self-registration.

// @route  POST /api/auth/otp/request   body: { phone }
// Generates a 6-digit code, stores it hashed with a 5-min expiry, and sends it by
// SMS. One active code per number, throttled to one send per minute.
//
// Deliberately reveals nothing about whether the number already has an account —
// the response is identical for new and returning customers.
export const requestOtp = asyncHandler(async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  if (!phone) {
    res.status(400);
    throw new Error('Please enter a valid phone number');
  }

  // Resend throttle — reuses the existing (unexpired) record's timing.
  const existing = await Otp.findOne({ phone });
  if (existing && Date.now() - new Date(existing.lastSentAt).getTime() < OTP_RESEND_MS) {
    res.status(429);
    throw new Error('Please wait a moment before requesting another code');
  }

  const code = crypto.randomInt(100000, 1000000); // 6 digits, 100000–999999
  const record = await Otp.findOneAndUpdate(
    { phone },
    {
      phone,
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      attempts: 0,
      lastSentAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    await sendSms({
      to: phone,
      code,
      body: `${code} is your RICHBAYY verification code. It expires in 5 minutes. Never share this code with anyone.`,
    });
  } catch (err) {
    // Gateway rejected the send — drop the code so the customer can retry at once
    // instead of being stuck behind the 60s resend throttle.
    await Otp.deleteOne({ _id: record._id });
    console.error('SMS send failed:', err.message);
    res.status(502);
    throw new Error("We couldn't send the code right now. Please try again in a moment.");
  }

  res.json({
    message: 'Verification code sent',
    expiresInSec: OTP_TTL_MS / 1000,
    resendInSec: OTP_RESEND_MS / 1000,
    // In dev without an SMS provider, return the code so the flow is testable.
    ...(process.env.NODE_ENV !== 'production' && !isSmsEnabled() && { devCode: String(code) }),
  });
});

// @route  POST /api/auth/otp/verify   body: { phone, otp }
// Verifies the code and logs the user in — creating a phone-only account on first
// use (find-or-create by phone). `isNew` tells the client to collect a name.
export const verifyOtp = asyncHandler(async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const otp = String(req.body.otp || '').trim();
  if (!phone || !/^\d{6}$/.test(otp)) {
    res.status(400);
    throw new Error('Enter the 6-digit code sent to your phone');
  }

  const record = await Otp.findOne({ phone });
  if (!record || record.expiresAt.getTime() < Date.now()) {
    res.status(400);
    throw new Error('Code is invalid or has expired. Please request a new one');
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await Otp.deleteOne({ _id: record._id });
    res.status(429);
    throw new Error('Too many incorrect attempts. Please request a new code');
  }

  if (record.codeHash !== hashOtp(otp)) {
    record.attempts += 1;
    await record.save();
    res.status(400);
    throw new Error('Incorrect code. Please try again');
  }

  // Success — the code is single-use.
  await Otp.deleteOne({ _id: record._id });

  const { user, isNew } = await signInVerifiedPhone(res, phone);
  res.json({ user: publicUser(user), isNew });
});

// Find-or-create the account behind a phone number we have PROVEN belongs to the
// caller, and open a session. Shared by both verification paths (Firebase and the
// in-house OTP fallback) so account handling can never drift between them.
async function signInVerifiedPhone(res, phone) {
  let user = await User.findOne({ phone });
  let isNew = false;

  if (!user) {
    // First time on this number → create the account. The name is collected right
    // after verification (client asks for it), so start with a neutral placeholder.
    isNew = true;
    user = await User.create({ name: 'Customer', phone, phoneVerified: true });
  } else if (!user.phoneVerified) {
    user.phoneVerified = true;
    await user.save();
  }

  sendTokenCookie(res, user._id);
  return { user, isNew };
}

// @route  GET /api/auth/providers   (public)
// Tells the client which phone-verification path this server can actually
// complete. The client only drives Firebase if BOTH sides are configured —
// otherwise it silently falls back to the in-house OTP. Without this handshake,
// deploying the frontend with Firebase keys but forgetting the backend service
// account would break sign-in for everyone with no obvious cause.
export const getAuthProviders = asyncHandler(async (_req, res) => {
  res.json({ firebase: isFirebaseEnabled() });
});

// @route  POST /api/auth/firebase   body: { idToken }
// Primary customer sign-in: Firebase sent and verified the SMS code in the
// browser; we verify its signed ID token here and mint our own session cookie.
// The phone number is read out of the VERIFIED token, never from the request
// body, so a client can't claim to be someone else's number.
export const firebaseLogin = asyncHandler(async (req, res) => {
  if (!isFirebaseEnabled()) {
    res.status(503);
    throw new Error('Firebase sign-in is not configured on this server');
  }

  let phoneFromToken;
  try {
    phoneFromToken = await verifyPhoneIdToken(req.body.idToken);
  } catch (err) {
    // Separate "this token is bad" (the customer's problem — 401) from "this
    // server is misconfigured" (our problem — 500), so a broken service-account
    // key doesn't show up in the logs as a wave of failed sign-ins.
    const badToken = err.status === 401 || String(err.code || '').startsWith('auth/');
    if (!badToken) {
      console.error('Firebase verification failed (server config?):', err.message);
      res.status(500);
      throw new Error('Sign-in is temporarily unavailable. Please try again shortly.');
    }
    res.status(401);
    throw new Error(err.status ? err.message : 'Could not verify your sign-in. Please try again.');
  }

  const phone = normalizePhone(phoneFromToken);
  if (!phone) {
    res.status(400);
    throw new Error('That phone number could not be read. Please try again.');
  }

  const { user, isNew } = await signInVerifiedPhone(res, phone);
  res.json({ user: publicUser(user), isNew });
});

// @route  POST /api/auth/login   (staff/admin only — customers use phone + OTP)
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Need the password field explicitly (select:false on the schema).
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  sendTokenCookie(res, user._id);
  res.json({ user: publicUser(user) });
});

// @route  POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  clearTokenCookie(res);
  res.json({ message: 'Logged out successfully' });
});

// @route  GET /api/auth/me   (protected)
export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// @route  PUT /api/auth/password   (protected) — change while logged in
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  // OTP-only customers have no password to change — say so plainly.
  if (!user.password) {
    res.status(400);
    throw new Error('This account signs in with a one-time code sent to your phone, so there is no password to change.');
  }

  if (!(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated successfully' });
});

// @route  POST /api/auth/forgot-password
// Generates a reset token. In production you'd email the link; here we return it
// (dev-friendly) so the flow is fully testable without an SMTP provider.
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond 200 to avoid leaking which emails exist.
  if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.resetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.resetTokenExpiry = Date.now() + 30 * 60 * 1000; // 30 min
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
  // Best-effort email (real send when SMTP is configured, logged otherwise).
  await sendMail({
    to: user.email,
    subject: 'Reset your RICHBAYY password',
    text: `We received a request to reset your password.\n\nReset it here (valid for 30 minutes):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
    html: `<p>We received a request to reset your password.</p>
           <p><a href="${resetUrl}" style="background:#111;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;display:inline-block">Reset Password</a></p>
           <p style="color:#666;font-size:13px">This link is valid for 30 minutes. If you didn't request it, you can ignore this email.</p>`,
  });

  res.json({
    message: 'If that email exists, a reset link has been sent.',
    // Only surface the link directly when email delivery isn't configured (dev),
    // so the flow stays testable without an SMTP provider. Never in production
    // with mail enabled.
    ...(process.env.NODE_ENV !== 'production' && !isMailEnabled() && { resetUrl, token: rawToken }),
  });
});

// @route  POST /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    resetToken: hashed,
    resetTokenExpiry: { $gt: Date.now() },
  }).select('+resetToken +resetTokenExpiry');

  if (!user) {
    res.status(400);
    throw new Error('Reset token is invalid or has expired');
  }

  user.password = req.body.password;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();
  res.json({ message: 'Password has been reset. You can now log in.' });
});
