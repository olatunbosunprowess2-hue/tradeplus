'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToastStore } from '@/lib/toast-store';
import apiClient from '@/lib/api-client';
import Link from 'next/link';
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Check,
} from 'lucide-react';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function evaluatePassword(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (password.length >= 12) score += 1;

  if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600' };
  if (score <= 4) return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600' };
  if (score === 5) return { score: 3, label: 'Good', color: 'bg-blue-600', text: 'text-blue-600' };
  return { score: 4, label: 'Strong', color: 'bg-emerald-600', text: 'text-emerald-600' };
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: showError } = useToastStore();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetComplete, setResetComplete] = useState(false);

  const token = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  });

  const passwordValue = watch('password') || '';
  const passwordStats = useMemo(() => evaluatePassword(passwordValue), [passwordValue]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword: data.password,
      });

      setResetComplete(true);
      success('Password reset successfully.');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to reset password. The link may have expired.';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6">
      {/* Subtle modern background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="max-w-[440px] w-full relative z-10">
        <div className="bg-white border border-slate-200/90 rounded-lg shadow-xl shadow-slate-900/5 p-7 sm:p-9 relative">
          {/* Header */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
              <img
                src="/logo-transparent.png"
                alt="BarterWave"
                className="w-9 h-9 object-contain group-hover:scale-105 transition-transform"
              />
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Barter<span className="text-blue-600">Wave</span>
              </span>
            </Link>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {resetComplete ? 'Password updated' : 'Create new password'}
            </h1>
            <p className="mt-1.5 text-xs text-slate-500">
              {resetComplete
                ? 'Your password has been changed successfully'
                : 'Choose a strong password with at least 8 characters'}
            </p>
          </div>

          {/* Success complete screen */}
          {resetComplete ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-md flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-800 space-y-1">
                  <p className="font-semibold">Password updated successfully</p>
                  <p className="text-emerald-700 leading-relaxed">
                    You can now sign in to your BarterWave account with your new credentials.
                  </p>
                </div>
              </div>

              <Link
                href="/login"
                className="block w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold text-center rounded-md shadow-sm transition-colors"
              >
                Sign in with New Password
              </Link>
            </div>
          ) : !token ? (
            /* Missing or invalid token */
            <div className="space-y-4">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-rose-800 space-y-1">
                  <p className="font-semibold">Invalid or expired link</p>
                  <p className="text-rose-700 leading-relaxed">
                    This password reset link is invalid or has expired. Please request a fresh reset link.
                  </p>
                </div>
              </div>

              <Link
                href="/forgot-password"
                className="block w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold text-center rounded-md shadow-sm transition-colors"
              >
                Request New Link
              </Link>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-700 font-medium">{error}</p>
                </div>
              )}

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    {...register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    className={`block w-full pl-10 pr-10 py-2.5 text-sm bg-white border rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                      errors.password
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {passwordValue.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Strength:</span>
                      <span className={`font-semibold ${passwordStats.text}`}>{passwordStats.label}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-1.5">
                      <div className={`h-full rounded-sm ${passwordStats.score >= 1 ? passwordStats.color : 'bg-slate-200'}`} />
                      <div className={`h-full rounded-sm ${passwordStats.score >= 2 ? passwordStats.color : 'bg-slate-200'}`} />
                      <div className={`h-full rounded-sm ${passwordStats.score >= 3 ? passwordStats.color : 'bg-slate-200'}`} />
                      <div className={`h-full rounded-sm ${passwordStats.score >= 4 ? passwordStats.color : 'bg-slate-200'}`} />
                    </div>
                  </div>
                )}

                {errors.password && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    {...register('confirmPassword')}
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    className={`block w-full pl-10 pr-10 py-2.5 text-sm bg-white border rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                      errors.confirmPassword
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold rounded-md shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Resetting password...</span>
                  </>
                ) : (
                  <span>Reset Password</span>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
