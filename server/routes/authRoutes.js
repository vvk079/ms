// routes/authRoutes.js
import express from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  login, logout, getMe, changePassword, forgotPassword, resetPassword,
  requestOtp, verifyOtp, firebaseLogin, getAuthProviders,
} from '../controllers/authController.js';

const router = express.Router();

// Which verification path can this server complete? (see getAuthProviders)
router.get('/providers', getAuthProviders);

// ── Phone sign-in — the only way a customer signs up or signs in ─
// There is intentionally no public /register: an account is created the first
// time a phone number is verified.
//
// Primary path: Firebase verifies the SMS in the browser and we exchange its
// signed ID token for our session cookie.
router.post(
  '/firebase',
  authLimiter,
  [body('idToken').trim().notEmpty().withMessage('Sign-in token is required')],
  validate,
  firebaseLogin
);

// Fallback path: our own OTP (used when Firebase keys aren't set — e.g. local
// development, or if you move back to an Indian SMS gateway).
router.post(
  '/otp/request',
  authLimiter,
  [body('phone').trim().notEmpty().withMessage('Phone number is required')],
  validate,
  requestOtp
);
router.post(
  '/otp/verify',
  authLimiter,
  [
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('Enter the 6-digit code'),
  ],
  validate,
  verifyOtp
);

// ── Staff / admin sign-in (email + password) ─────────────────
// Admin accounts are provisioned by the seed script; there is no self sign-up.
router.post(
  '/login',
  authLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  login
);

router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put(
  '/password',
  protect,
  authLimiter,
  [body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')],
  validate,
  changePassword
);
router.post('/forgot-password', authLimiter, [body('email').isEmail().normalizeEmail()], validate, forgotPassword);
router.post('/reset-password/:token', authLimiter, [body('password').isLength({ min: 6 })], validate, resetPassword);

export default router;
