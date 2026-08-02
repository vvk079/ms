// pages/StaffLogin.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Email + password sign-in for staff/admin accounts only. Customers never see
// this page — they sign in with phone + OTP at /login. Admin accounts are
// provisioned by the seed script (there is no self sign-up anywhere in the app).
//
// Kept deliberately plain and noindex'd: it exists to reach /admin, nothing more.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import useSEO from '../hooks/useSEO.js';
import { useAuth } from '../context/AuthContext.jsx';
import { BRAND } from '../utils/constants.js';

export default function StaffLogin() {
  useSEO({ title: 'Staff Sign In', description: 'RICHBAYY staff access.' });

  // Keep this page out of search results.
  useEffect(() => {
    let el = document.head.querySelector('meta[name="robots"]');
    const created = !el;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', 'robots');
      document.head.appendChild(el);
    }
    const previous = el.getAttribute('content');
    el.setAttribute('content', 'noindex, nofollow');
    return () => {
      if (created) el.remove();
      else if (previous) el.setAttribute('content', previous);
    };
  }, []);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/admin';

  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ email, password }) => {
    setSubmitting(true);
    try {
      const user = await login({ email, password });
      toast.success(`Signed in as ${user?.name || 'staff'}`);
      navigate(user?.role === 'admin' ? redirectTo : '/', { replace: true });
    } catch (err) {
      toast.error(err?.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-5 py-14 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
        className="mx-auto w-full max-w-md rounded-2xl border border-stone bg-paper p-8 shadow-card sm:p-10"
      >
        <div className="text-[11px] uppercase tracking-[3px] text-muted">{BRAND}</div>
        <h1 className="heading mt-1 text-[24px]">Staff sign in</h1>
        <p className="mt-1.5 text-[13.5px] text-muted">
          Team access only. Shopping with us?{' '}
          <Link to="/login" className="font-semibold text-ink underline">Sign in with your phone</Link>.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@richbayy.com"
              className="field"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
              })}
            />
            {errors.email && <p className="mt-1 text-[12px] text-[#c0392b]">{errors.email.message}</p>}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="text-[13px] font-medium">Password</label>
              <Link to="/forgot-password" className="text-[12.5px] text-muted underline hover:text-ink">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="field"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
            />
            {errors.password && <p className="mt-1 text-[12px] text-[#c0392b]">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Seeded admin hint — development only; never exposed in production. */}
        {import.meta.env.DEV && (
          <div className="mt-5 rounded-lg border border-dashed border-stone bg-sand px-4 py-3 text-[12px] leading-relaxed text-muted">
            <span className="font-semibold text-ink">Admin:</span> admin@richbayy.com / Admin@12345
          </div>
        )}
      </motion.div>
    </div>
  );
}
