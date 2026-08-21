'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/lib/auth-store';
import { useToastStore } from '@/lib/toast-store';
import Link from 'next/link';
import api from '@/lib/api-client';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================
const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const registrationSchema = z
  .object({
    displayName: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be under 50 characters')
      .trim(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    agreeToTerms: z.boolean().refine((val) => val === true, 'You must agree to the terms and privacy policy'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type EmailForm = z.infer<typeof emailSchema>;
type OtpForm = z.infer<typeof otpSchema>;
type RegistrationForm = z.infer<typeof registrationSchema>;

// ============================================================================
// PASSWORD STRENGTH & VALIDATION RULES
// ============================================================================
interface PasswordRequirements {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

function evaluatePassword(password: string) {
  const reqs: PasswordRequirements = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  let score = 0;
  if (reqs.minLength) score += 1;
  if (reqs.hasUpper) score += 1;
  if (reqs.hasLower) score += 1;
  if (reqs.hasNumber) score += 1;
  if (reqs.hasSpecial) score += 1;
  if (password.length >= 12) score += 1;

  if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600', reqs };
  if (score <= 4) return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600', reqs };
  if (score === 5) return { score: 3, label: 'Good', color: 'bg-blue-600', text: 'text-blue-600', reqs };
  return { score: 4, label: 'Strong', color: 'bg-emerald-600', text: 'text-emerald-600', reqs };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, loginWithGoogle, isAuthenticated } = useAuthStore();
  const { success, error: showError } = useToastStore();

  // Steps: 1 = Email, 2 = OTP, 3 = Account Details
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) router.push('/listings');
  }, [isAuthenticated, router]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Form hooks
  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    mode: 'onBlur',
    defaultValues: { email: '' },
  });

  const regForm = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    mode: 'onChange',
    defaultValues: { displayName: '', password: '', confirmPassword: '', agreeToTerms: false },
  });

  const passwordValue = regForm.watch('password') || '';
  const passwordStats = useMemo(() => evaluatePassword(passwordValue), [passwordValue]);

  // ========================================================================
  // STEP 1: SEND OTP
  // ========================================================================
  const handleSendOtp = async (data: EmailForm) => {
    setLoading(true);
    setError(null);
    try {
      const normalizedEmail = data.email.trim().toLowerCase();
      const response = await api.post('/auth/send-otp', { email: normalizedEmail });
      if (response.data.success) {
        setEmail(normalizedEmail);
        setStep(2);
        setResendCooldown(60);
        setOtpValues(['', '', '', '', '', '']);
        success('Verification code sent to your email.');
      } else {
        setError(response.data.message || 'Failed to send code');
        showError(response.data.message || 'Failed to send code');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to send verification code. Please try again.';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Google sign up
  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign-up failed');
      showError(err.message || 'Google sign-up failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  // ========================================================================
  // STEP 2: OTP VERIFICATION
  // ========================================================================
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newValues = [...otpValues];
    newValues[index] = value.slice(-1);
    setOtpValues(newValues);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (newValues.every((v) => v !== '') && newValues.join('').length === 6) {
      handleVerifyOtp(newValues.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const chars = pasted.split('');
      setOtpValues(chars);
      otpInputRefs.current[5]?.focus();
      handleVerifyOtp(pasted);
    }
  };

  const handleVerifyOtp = async (otpCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/verify-otp', { email, otp: otpCode });
      if (response.data.verified) {
        setStep(3);
        success('Email verified successfully.');
      } else {
        const msg = response.data.message || 'Invalid verification code';
        setError(msg);
        showError(msg);
        setOtpValues(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Verification failed. Code may have expired.';
      setError(msg);
      showError(msg);
      setOtpValues(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/send-otp', { email });
      setResendCooldown(60);
      success('A fresh verification code was sent.');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // STEP 3: COMPLETE REGISTRATION
  // ========================================================================
  const handleRegister = async (data: RegistrationForm) => {
    setLoading(true);
    setError(null);
    try {
      await registerUser({
        email,
        displayName: data.displayName.trim(),
        password: data.password,
      });
      success('Account created successfully! Welcome to BarterWave.');
      router.push('/listings');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6">
      {/* Subtle modern background grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="max-w-[440px] w-full relative z-10">
        {/* Main Card with sharp modern borders */}
        <div className="bg-white border border-slate-200/90 rounded-lg shadow-xl shadow-slate-900/5 p-7 sm:p-9 relative">
          
          {/* Brand Logo & Header */}
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
              {step === 1 && 'Create your account'}
              {step === 2 && 'Verify your email'}
              {step === 3 && 'Complete your profile'}
            </h1>
            <p className="mt-1.5 text-xs text-slate-500">
              {step === 1 && (
                <>
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                    Sign in
                  </Link>
                </>
              )}
              {step === 2 && 'Enter the 6-digit code sent to your inbox'}
              {step === 3 && 'Set your display name and password to get started'}
            </p>
          </div>

          {/* Stepper Indicator */}
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              <div className={`h-1.5 rounded-sm transition-all duration-300 ${step >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
              <div className={`h-1.5 rounded-sm transition-all duration-300 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
              <div className={`h-1.5 rounded-sm transition-all duration-300 ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`} />
            </div>
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 px-0.5">
              <span className={step >= 1 ? 'text-blue-600 font-semibold' : ''}>1. Email</span>
              <span className={step >= 2 ? 'text-blue-600 font-semibold' : ''}>2. Code</span>
              <span className={step >= 3 ? 'text-blue-600 font-semibold' : ''}>3. Account</span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 1: EMAIL ENTRY */}
          {/* ================================================================ */}
          {step === 1 && (
            <form onSubmit={emailForm.handleSubmit(handleSendOtp)} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    {...emailForm.register('email')}
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                  />
                </div>
                {emailForm.formState.errors.email && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {emailForm.formState.errors.email.message}
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
                    <span>Sending code...</span>
                  </>
                ) : (
                  <span>Continue with Email</span>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                  <span className="px-3 bg-white text-slate-400 font-medium">Or continue with</span>
                </div>
              </div>

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={googleLoading || loading}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-medium rounded-md shadow-sm transition-colors flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                <span>Sign up with Google</span>
              </button>
            </form>
          )}

          {/* ================================================================ */}
          {/* STEP 2: OTP VERIFICATION */}
          {/* ================================================================ */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Destination info pill */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-center">
                <p className="text-xs text-slate-500">
                  Verification code sent to{' '}
                  <span className="font-semibold text-slate-900 break-all">{email}</span>
                </p>
              </div>

              {/* 6-digit OTP Inputs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider text-center mb-2.5">
                  6-Digit Verification Code
                </label>
                <div className="flex justify-between gap-1.5 sm:gap-2" onPaste={handleOtpPaste}>
                  {otpValues.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                    />
                  ))}
                </div>
              </div>

              {/* Verify Button */}
              <button
                onClick={() => handleVerifyOtp(otpValues.join(''))}
                disabled={loading || otpValues.some((v) => !v)}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold rounded-md shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying code...</span>
                  </>
                ) : (
                  <span>Verify Code</span>
                )}
              </button>

              {/* Resend Actions */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 font-medium transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Change email
                </button>

                {resendCooldown > 0 ? (
                  <span className="text-slate-400 font-medium">Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Resend code
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 3: REGISTRATION DETAILS (REDESIGNED) */}
          {/* ================================================================ */}
          {step === 3 && (
            <form onSubmit={regForm.handleSubmit(handleRegister)} className="space-y-4" noValidate>
              {/* Verified Email Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Verified Email
                </label>
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm">
                  <span className="font-medium text-slate-900 truncate">{email}</span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 flex-shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    Verified
                  </span>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label htmlFor="displayName" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Display Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    {...regForm.register('displayName')}
                    id="displayName"
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Shawn Tech"
                    className={`block w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                      regForm.formState.errors.displayName
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
                    }`}
                  />
                </div>
                {regForm.formState.errors.displayName && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {regForm.formState.errors.displayName.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    {...regForm.register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    className={`block w-full pl-10 pr-10 py-2.5 text-sm bg-white border rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                      regForm.formState.errors.password
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

                {/* Password Strength Meter */}
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

                    {/* Requirements checklist */}
                    <div className="grid grid-cols-2 gap-1 pt-1 text-[11px]">
                      <span className={`flex items-center gap-1 font-medium ${passwordStats.reqs.minLength ? 'text-emerald-700' : 'text-slate-400'}`}>
                        <Check className={`w-3 h-3 ${passwordStats.reqs.minLength ? 'text-emerald-600' : 'text-slate-300'}`} />
                        8+ characters
                      </span>
                      <span className={`flex items-center gap-1 font-medium ${passwordStats.reqs.hasUpper ? 'text-emerald-700' : 'text-slate-400'}`}>
                        <Check className={`w-3 h-3 ${passwordStats.reqs.hasUpper ? 'text-emerald-600' : 'text-slate-300'}`} />
                        1 uppercase letter
                      </span>
                      <span className={`flex items-center gap-1 font-medium ${passwordStats.reqs.hasLower ? 'text-emerald-700' : 'text-slate-400'}`}>
                        <Check className={`w-3 h-3 ${passwordStats.reqs.hasLower ? 'text-emerald-600' : 'text-slate-300'}`} />
                        1 lowercase letter
                      </span>
                      <span className={`flex items-center gap-1 font-medium ${passwordStats.reqs.hasNumber ? 'text-emerald-700' : 'text-slate-400'}`}>
                        <Check className={`w-3 h-3 ${passwordStats.reqs.hasNumber ? 'text-emerald-600' : 'text-slate-300'}`} />
                        1 number
                      </span>
                    </div>
                  </div>
                )}

                {regForm.formState.errors.password && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {regForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    {...regForm.register('confirmPassword')}
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    className={`block w-full pl-10 pr-10 py-2.5 text-sm bg-white border rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                      regForm.formState.errors.confirmPassword
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
                {regForm.formState.errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {regForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Terms & Privacy */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    {...regForm.register('agreeToTerms')}
                    type="checkbox"
                    className="h-4 w-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 leading-snug">
                    I agree to the{' '}
                    <Link href="/terms" target="_blank" className="font-semibold text-blue-600 hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" target="_blank" className="font-semibold text-blue-600 hover:underline">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {regForm.formState.errors.agreeToTerms && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {regForm.formState.errors.agreeToTerms.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold rounded-md shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
