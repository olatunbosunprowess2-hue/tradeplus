'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/lib/auth-store';
import { useToastStore } from '@/lib/toast-store';
import Link from 'next/link';
import api from '@/lib/api-client';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================
const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const registrationSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine(val => val, 'You must agree to the terms'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type EmailForm = z.infer<typeof emailSchema>;
type OtpForm = z.infer<typeof otpSchema>;
type RegistrationForm = z.infer<typeof registrationSchema>;

// ============================================================================
// PASSWORD STRENGTH
// ============================================================================
function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-500' };
  return { score, label: 'Strong', color: 'bg-green-500' };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, loginWithGoogle, isAuthenticated } = useAuthStore();
  const { success, error: showError } = useToastStore();

  // Step state: 1 = Email, 2 = OTP, 3 = Registration details
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
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
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Form setups
  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });
  const regForm = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { displayName: '', password: '', confirmPassword: '', agreeToTerms: false },
  });

  const passwordValue = regForm.watch('password') || '';
  const passwordStrength = getPasswordStrength(passwordValue);

  // ========================================================================
  // STEP 1: SEND OTP
  // ========================================================================
  const handleSendOtp = async (data: EmailForm) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/send-otp', { email: data.email });
      if (response.data.success) {
        setEmail(data.email);
        setStep(2);
        setResendCooldown(60);
        success('Verification code sent to your email!');
      } else {
        setError(response.data.message);
        showError(response.data.message);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to send verification code';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // STEP 2: VERIFY OTP
  // ========================================================================
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newValues = [...otpValues];
    newValues[index] = value.slice(-1);
    setOtpValues(newValues);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newValues.every(v => v) && newValues.join('').length === 6) {
      handleVerifyOtp(newValues.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      if (response.data.verified) {
        setStep(3);
        success('Email verified! Complete your registration.');
      } else {
        setError(response.data.message);
        showError(response.data.message);
        setOtpValues(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Verification failed';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email });
      setResendCooldown(60);
      success('New verification code sent!');
    } catch (err: any) {
      showError('Failed to resend code');
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
        displayName: data.displayName,
        password: data.password,
      });
      success('Account created successfully! Welcome to BarterWave!');
      router.push('/listings');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/10 p-8 border border-white/50">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
              <img src="/logo-transparent.png" alt="BarterWave" className="w-12 h-12 object-contain" />
              <span className="text-xl font-bold">
                <span className="text-blue-600">Barter</span>
                <span className="text-gray-900">Wave</span>
              </span>
            </Link>

            <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
            <p className="mt-2 text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">Sign in</Link>
            </p>
          </div>

          {/* Step Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${step >= s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                  }`}>
                  {step > s ? '✓' : s}
                </div>
                {s < 3 && <div className={`w-12 h-1 mx-1 rounded ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* STEP 1: Email Input */}
          {step === 1 && (
            <form onSubmit={emailForm.handleSubmit(handleSendOtp)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                <input
                  {...emailForm.register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900"
                />
                {emailForm.formState.errors.email && (
                  <p className="mt-2 text-sm text-red-600">{emailForm.formState.errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Google Sign Up */}
              <button
                type="button"
                onClick={() => loginWithGoogle()}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign up with Google
              </button>
            </form>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Check your email</h2>
                <p className="text-gray-600 mt-1">
                  We sent a code to <span className="font-medium text-gray-900">{email}</span>
                </p>
              </div>

              {/* OTP Input Boxes */}
              <div className="flex justify-center gap-2">
                {otpValues.map((value, index) => (
                  <input
                    key={index}
                    ref={el => { otpInputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value}
                    onChange={e => handleOtpChange(index, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900"
                  />
                ))}
              </div>

              <button
                onClick={() => handleVerifyOtp(otpValues.join(''))}
                disabled={loading || otpValues.some(v => !v)}
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              <div className="text-center text-sm">
                <span className="text-gray-600">Didn't receive the code? </span>
                {resendCooldown > 0 ? (
                  <span className="text-gray-500">Resend in {resendCooldown}s</span>
                ) : (
                  <button onClick={handleResendOtp} disabled={loading} className="text-blue-600 hover:text-blue-700 font-medium">
                    Resend
                  </button>
                )}
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full py-2 text-gray-600 hover:text-gray-900 text-sm"
              >
                ← Change email
              </button>
            </div>
          )}

          {/* STEP 3: Registration Details */}
          {step === 3 && (
            <form onSubmit={regForm.handleSubmit(handleRegister)} className="space-y-5">
              <div className="text-center mb-4">
                <div className="w-12 h-12 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-green-600 font-medium">Email verified: {email}</p>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                <input
                  {...regForm.register('displayName')}
                  type="text"
                  placeholder="John Doe"
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900"
                />
                {regForm.formState.errors.displayName && (
                  <p className="mt-2 text-sm text-red-600">{regForm.formState.errors.displayName.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    {...regForm.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="block w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {passwordValue && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${passwordStrength.color} transition-all`} style={{ width: `${(passwordStrength.score / 6) * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{passwordStrength.label}</span>
                  </div>
                )}
                {regForm.formState.errors.password && (
                  <p className="mt-2 text-sm text-red-600">{regForm.formState.errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    {...regForm.register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="block w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {regForm.formState.errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">{regForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2">
                <input
                  {...regForm.register('agreeToTerms')}
                  type="checkbox"
                  className="h-4 w-4 mt-1 text-blue-600 border-gray-300 rounded"
                />
                <label className="text-sm text-gray-700">
                  I agree to the <Link href="/terms" className="text-blue-600">Terms</Link> and <Link href="/privacy" className="text-blue-600">Privacy Policy</Link>
                </label>
              </div>
              {regForm.formState.errors.agreeToTerms && (
                <p className="text-sm text-red-600">{regForm.formState.errors.agreeToTerms.message}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
