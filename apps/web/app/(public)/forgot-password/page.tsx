'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToastStore } from '@/lib/toast-store';
import apiClient from '@/lib/api-client';
import Link from 'next/link';
import {
  Mail,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { success } = useToastStore();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    const email = data.email.trim().toLowerCase();

    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSubmittedEmail(data.email);
      setSubmitted(true);
      success('Password reset instructions sent.');
    } catch (err: any) {
      // Always show success to prevent email enumeration
      setSubmittedEmail(data.email);
      setSubmitted(true);
      success('If an account exists with this email, you will receive password reset instructions.');
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
              {submitted ? 'Check your email' : 'Reset your password'}
            </h1>
            <p className="mt-1.5 text-xs text-slate-500">
              {submitted
                ? `We sent reset instructions to ${submittedEmail}`
                : "Enter your email address and we'll send you a recovery link"}
            </p>
          </div>

          {submitted ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-md flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-800 space-y-1">
                  <p className="font-semibold">Reset instructions dispatched</p>
                  <p className="text-emerald-700 leading-relaxed">
                    If an account is associated with <strong className="font-semibold">{submittedEmail}</strong>, you will receive an email shortly.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-500 leading-relaxed">
                Didn't receive the email? Please check your spam or junk folder, or wait a few minutes.
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setSubmittedEmail('');
                  }}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-medium rounded-md shadow-sm transition-colors"
                >
                  Try another email
                </button>
                <Link
                  href="/login"
                  className="block w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold text-center rounded-md shadow-sm transition-colors"
                >
                  Back to Sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    {...register('email')}
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    className={`block w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                      errors.email
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.email.message}
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
                    <span>Sending instructions...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
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

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              Secured with 256-bit encryption & escrow protection
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
