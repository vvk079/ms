// pages/ForgotPassword.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Step 1 of the password-reset flow. Renders INSIDE MainLayout, so we only paint
// a centered auth card.
//
// Flow:
//   • email field → authApi.forgot({ email }).
//   • On success we toast the server message. In development the API also returns
//     a `token` (and/or resetUrl), so we surface an inline "Reset your password →"
//     link to /reset-password/:token for convenience.
//   • Errors surface via toast(err.message).
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import useSEO from '../hooks/useSEO.js';
import { authApi } from '../services/endpoints.js';

export default function ForgotPassword() {
  useSEO({ title: 'Forgot Password', description: 'Reset your RICHBAYY account password.' });

  const [submitting, setSubmitting] = useState(false);
  // Dev-only reset token returned by the API so we can show a shortcut link.
  const [devToken, setDevToken] = useState('');
  // Once submitted successfully we flip to a "check your inbox" confirmation.
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ email }) => {
    setSubmitting(true);
    try {
      const res = await authApi.forgot({ email });
      toast.success(res?.message || 'If that email exists, a reset link is on its way.');
      setSent(true);
      // In dev the backend hands back the raw token — expose a quick link.
      if (res?.token) setDevToken(res.token);
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
        className="mx-auto w-full max-w-md rounded-2xl border border-stone bg-paper p-8 shadow-card sm:p-10"
      >
        <h1 className="heading text-[24px]">Forgot password?</h1>
        <p className="mt-1.5 text-[13.5px] text-muted">
          Enter the email linked to your account and we&apos;ll send you a reset link.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="field"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
              })}
            />
            {errors.email && <p className="mt-1 text-[12px] text-[#c0392b]">{errors.email.message}</p>}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>

        {/* Confirmation + dev shortcut */}
        {sent && (
          <div className="mt-5 rounded-lg border border-[#cdeadd] bg-[#eefaf3] px-4 py-3 text-[13px] leading-relaxed text-success">
            Check your inbox for the reset link.
            {devToken && (
              <div className="mt-2">
                <Link to={`/reset-password/${devToken}`} className="font-semibold text-ink underline">
                  Reset your password →
                </Link>
                <span className="ml-1 text-[11px] text-muted">(dev shortcut)</span>
              </div>
            )}
          </div>
        )}

        {/* Back to login */}
        <p className="mt-6 text-center text-[13.5px] text-muted">
          Remembered it?{' '}
          <Link to="/staff-login" className="font-semibold text-ink underline">Back to sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
