// pages/Login.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The one and only customer entry point: phone number + OTP. There is no
// separate "register" page — verifying a number that has never been used here
// creates the account, so signing in and signing up are the same three taps.
//
// Flow:
//   1. 'phone' → enter the number, we text a 6-digit code
//   2. 'otp'   → enter the code; verifying sets the session cookie
//   3. 'name'  → shown ONLY for brand-new accounts, to personalise the account
//
// The server never reveals whether a number already has an account (step 1 is
// identical either way); the "new customer" branch is decided after the code is
// verified, so the page can't be used to probe who shops here.
//
// Two delivery paths sit behind the same three steps:
//   • Firebase Phone Auth (default) — Google sends and verifies the SMS in the
//     browser; we exchange its signed ID token for our session cookie.
//   • In-house OTP (fallback) — our server generates, texts and verifies the
//     code. Used automatically whenever VITE_FB_API_KEY isn't set.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import useSEO from '../hooks/useSEO.js';
import { useAuth } from '../context/AuthContext.jsx';
import { userApi } from '../services/endpoints.js';
import {
  resolveAuthMode, sendVerificationCode, confirmCode, clearVerifier, firebaseAuthMessage,
  preloadFirebase,
} from '../services/firebase.js';
import { BRAND } from '../utils/constants.js';

// Firebase needs a full E.164 number; the field only collects the local part.
const toE164 = (input) => {
  const d = String(input).replace(/\D/g, '');
  if (String(input).trim().startsWith('+')) return `+${d}`;
  return d.length > 10 ? `+${d}` : `+91${d}`;
};

// Display helper: +919876543210 → +91 98765 43210
const prettyPhone = (p) => {
  const d = String(p).replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  return p;
};

export default function Login() {
  useSEO({
    title: 'Sign In',
    description: 'Sign in to RICHBAYY with your phone number — no password needed.',
  });

  const { requestOtp, verifyOtp, firebaseLogin, patchUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Where to send the customer once they're in (set by ProtectedRoute).
  const redirectTo = location.state?.from || '/';

  const [step, setStep] = useState('phone');   // 'phone' | 'otp' | 'name'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);  // resend countdown (seconds)

  const otpRef = useRef(null);
  const nameRef = useRef(null);
  const autoSubmitted = useRef(false); // guards the auto-verify on the 6th digit
  const confirmation = useRef(null);   // Firebase handle returned by step 1
  // Which path actually sent the code — pinned at send time so verification
  // always matches, even if the resolution changes underneath us.
  const usedFirebase = useRef(false);

  // Fetch the Firebase chunk while they're typing; drop the invisible reCAPTCHA
  // if they navigate away mid-flow.
  useEffect(() => {
    preloadFirebase();
    return () => clearVerifier();
  }, []);

  // Resend countdown tick.
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Focus the field that matters for the current step.
  useEffect(() => {
    if (step === 'otp') otpRef.current?.focus();
    if (step === 'name') nameRef.current?.focus();
  }, [step]);

  // ── Step 1: send the code ──────────────────────────────────
  const sendCode = async (e) => {
    e?.preventDefault();
    if (phone.replace(/\D/g, '').length < 10) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    setBusy(true);
    // Ask (once) which path this deployment can actually complete.
    const useFirebase = (await resolveAuthMode()) === 'firebase';
    usedFirebase.current = useFirebase;
    try {
      if (useFirebase) {
        // Firebase sends the SMS itself (invisible reCAPTCHA runs here).
        confirmation.current = await sendVerificationCode(toE164(phone));
        toast.success(`Code sent to ${prettyPhone(phone)}`);
        setCooldown(60);
      } else {
        const res = await requestOtp({ phone });
        setCooldown(res?.resendInSec || 60);
        // Without an SMS gateway configured, the dev server hands back the code
        // so the flow is testable locally. Never returned in production.
        if (res?.devCode) toast.success(`Dev code: ${res.devCode}`, { duration: 10000 });
        else toast.success(`Code sent to ${prettyPhone(phone)}`);
      }
      setOtp('');
      autoSubmitted.current = false;
      setStep('otp');
    } catch (err) {
      toast.error(
        useFirebase
          ? firebaseAuthMessage(err)
          : err?.message || 'Could not send the code. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  // ── Step 2: verify the code ────────────────────────────────
  const verify = async (e, codeArg) => {
    e?.preventDefault();
    const code = codeArg ?? otp;
    if (!/^\d{6}$/.test(code)) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setBusy(true);
    try {
      let result;
      if (usedFirebase.current) {
        if (!confirmation.current) throw new Error('Please request a new code.');
        // Firebase checks the code, then our API turns its token into a session.
        const idToken = await confirmCode(confirmation.current, code);
        result = await firebaseLogin(idToken);
        confirmation.current = null;
      } else {
        result = await verifyOtp({ phone, otp: code });
      }

      const { user, isNew } = result;
      if (isNew) {
        // Brand-new account — ask what to call them before dropping them in.
        setStep('name');
      } else {
        toast.success(`Welcome back, ${user?.name?.split(' ')[0] || 'friend'}!`);
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      autoSubmitted.current = false; // let them retry by editing the code
      toast.error(
        usedFirebase.current && err?.code
          ? firebaseAuthMessage(err)
          : err?.message || 'Verification failed. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  // Auto-verify the moment a full 6-digit code is typed or pasted.
  const onOtpChange = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setOtp(digits);
    if (digits.length === 6 && !autoSubmitted.current && !busy) {
      autoSubmitted.current = true;
      verify(null, digits);
    }
  };

  // ── Step 3: name (new accounts only) ───────────────────────
  const saveName = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error('Please enter your name');
      return;
    }
    setBusy(true);
    try {
      const res = await userApi.updateProfile({ name: trimmed });
      patchUser(res?.user || res);
      toast.success(`Welcome to ${BRAND}, ${trimmed.split(' ')[0]}!`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err?.message || 'Could not save your name.');
    } finally {
      setBusy(false);
    }
  };

  // Already signed in at this point — skipping just keeps the placeholder name.
  const skipName = () => {
    toast.success(`Welcome to ${BRAND}!`);
    navigate(redirectTo, { replace: true });
  };

  const headings = {
    phone: ['Sign in or sign up', 'Enter your mobile number — we’ll text you a one-time code.'],
    otp: ['Verify your number', `Enter the 6-digit code sent to ${prettyPhone(phone)}.`],
    name: ['Almost there', 'What should we call you?'],
  }[step];

  return (
    <div className="px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border border-stone bg-paper shadow-card lg:grid-cols-2">

        {/* ── Brand panel (left, lg+) ─────────────────────────────── */}
        <div className="relative hidden flex-col justify-between bg-ink p-10 text-white lg:flex">
          <div>
            <div className="text-[13px] tracking-[4px] text-white/70">{BRAND}</div>
            <div className="mt-1 text-[12px] tracking-[3px] text-white/40">PREMIUM MENSWEAR</div>
          </div>
          <div>
            <h2 className="text-[30px] font-semibold leading-tight">
              Elevate your<br />everyday wardrobe.
            </h2>
            <p className="mt-3 max-w-xs text-[13.5px] leading-relaxed text-white/60">
              One number, no password. Track your orders, save your favourite fits and check out in seconds.
            </p>
          </div>
          <div className="h-[3px] w-16 rounded-full bg-gold" />
        </div>

        {/* ── Form panel (right) ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
          className="mx-auto w-full max-w-md p-8 sm:p-10"
        >
          {/* Step indicator */}
          <div className="mb-6 flex items-center gap-2">
            {['phone', 'otp', 'name'].map((s, i) => {
              const order = { phone: 0, otp: 1, name: 2 };
              const done = order[step] > i;
              const active = order[step] === i;
              return (
                <span
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    done ? 'bg-gold' : active ? 'bg-ink' : 'bg-mist'
                  }`}
                />
              );
            })}
          </div>

          <h1 className="heading text-[24px]">{headings[0]}</h1>
          <p className="mt-1.5 text-[13.5px] text-muted">{headings[1]}</p>

          <AnimatePresence mode="wait">
            {/* ── Step 1: phone ─────────────────────────────────── */}
            {step === 'phone' && (
              <motion.form
                key="phone"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22 }}
                onSubmit={sendCode}
                className="mt-7 space-y-4"
                noValidate
              >
                <div>
                  <label htmlFor="phone" className="mb-1.5 block text-[13px] font-medium">Mobile number</label>
                  <div className="flex items-stretch overflow-hidden rounded-lg border border-stone focus-within:border-ink">
                    <span className="grid place-items-center border-r border-stone bg-mist px-3 text-[13.5px] text-muted">+91</span>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      autoFocus
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s]/g, '').slice(0, 15))}
                      className="w-full bg-paper px-3.5 py-2.5 text-[14px] outline-none"
                    />
                  </div>
                  <p className="mt-1.5 text-[12px] text-muted">
                    New here? Verifying your number creates your account — no password to remember.
                  </p>
                </div>

                <button type="submit" disabled={busy} className="btn-primary w-full">
                  {busy ? 'Sending…' : 'Send Code'}
                </button>
              </motion.form>
            )}

            {/* ── Step 2: OTP ───────────────────────────────────── */}
            {step === 'otp' && (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22 }}
                onSubmit={verify}
                className="mt-7 space-y-4"
              >
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="otp" className="text-[13px] font-medium">Verification code</label>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('phone');
                        setOtp('');
                        autoSubmitted.current = false;
                        confirmation.current = null;
                        clearVerifier();
                      }}
                      className="text-[12.5px] text-muted underline hover:text-ink"
                    >
                      Change number
                    </button>
                  </div>
                  <input
                    id="otp"
                    ref={otpRef}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="······"
                    value={otp}
                    onChange={(e) => onOtpChange(e.target.value)}
                    className="field text-center text-[22px] font-semibold tracking-[10px]"
                  />
                </div>

                <button type="submit" disabled={busy} className="btn-primary w-full">
                  {busy ? 'Verifying…' : 'Verify & Continue'}
                </button>

                <button
                  type="button"
                  disabled={cooldown > 0 || busy}
                  onClick={sendCode}
                  className="w-full text-center text-[13px] text-muted underline disabled:no-underline disabled:opacity-60"
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                </button>
              </motion.form>
            )}

            {/* ── Step 3: name (new accounts only) ──────────────── */}
            {step === 'name' && (
              <motion.form
                key="name"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22 }}
                onSubmit={saveName}
                className="mt-7 space-y-4"
              >
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-[13px] font-medium">Your name</label>
                  <input
                    id="name"
                    ref={nameRef}
                    autoComplete="name"
                    placeholder="e.g. Arjun Mehta"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="field"
                  />
                  <p className="mt-1.5 text-[12px] text-muted">
                    We’ll use this on your orders. You can change it anytime in your account.
                  </p>
                </div>

                <button type="submit" disabled={busy} className="btn-primary w-full">
                  {busy ? 'Saving…' : 'Continue'}
                </button>
                <button
                  type="button"
                  onClick={skipName}
                  className="w-full text-center text-[13px] text-muted underline hover:text-ink"
                >
                  Skip for now
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Legal + staff entrance */}
          <p className="mt-7 text-center text-[12px] leading-relaxed text-muted">
            By continuing you agree to {BRAND}’s Terms of Service and Privacy Policy.
          </p>
          <p className="mt-3 text-center text-[12px] text-muted">
            <Link to="/staff-login" className="underline hover:text-ink">Staff sign-in</Link>
          </p>

          {/* Firebase mounts its invisible reCAPTCHA here. Must stay in the DOM
              for the whole flow — removing it breaks resend. */}
          <div id="recaptcha-container" />
        </motion.div>
      </div>
    </div>
  );
}
