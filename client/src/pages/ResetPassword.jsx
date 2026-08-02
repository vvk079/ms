// pages/ResetPassword.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Step 2 of the password-reset flow. Reached via /reset-password/:token. Renders
// INSIDE MainLayout, so we only paint a centered auth card.
//
// Flow:
//   • Read `token` from the URL (useParams).
//   • password + confirm fields (confirm must match).
//   • Submit → authApi.reset(token, { password }).
//   • On success → toast + navigate('/staff-login'); errors surface via toast.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import useSEO from '../hooks/useSEO.js';
import { authApi } from '../services/endpoints.js';

export default function ResetPassword() {
  useSEO({ title: 'Reset Password', description: 'Choose a new password for your RICHBAYY account.' });

  const { token } = useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const passwordValue = watch('password');

  const onSubmit = async ({ password }) => {
    setSubmitting(true);
    try {
      await authApi.reset(token, { password });
      toast.success('Password updated. Please sign in.');
      navigate('/staff-login', { replace: true });
    } catch (err) {
      toast.error(err?.message || 'This reset link is invalid or has expired.');
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
        <h1 className="heading text-[24px]">Set a new password</h1>
        <p className="mt-1.5 text-[13.5px] text-muted">Choose a strong password you don&apos;t use elsewhere.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
          {/* New password */}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium">New password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              className="field"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
            />
            {errors.password && <p className="mt-1 text-[12px] text-[#c0392b]">{errors.password.message}</p>}
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-[13px] font-medium">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              className="field"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (v) => v === passwordValue || 'Passwords do not match',
              })}
            />
            {errors.confirmPassword && <p className="mt-1 text-[12px] text-[#c0392b]">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Updating…' : 'Reset Password'}
          </button>
        </form>

        <p className="mt-6 text-center text-[13.5px] text-muted">
          <Link to="/staff-login" className="font-semibold text-ink underline">Back to sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
