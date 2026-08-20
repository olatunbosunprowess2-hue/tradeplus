'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/lib/auth-store';
import { useToastStore } from '@/lib/toast-store';
import Link from 'next/link';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

// ============================================================================
// RATE LIMITING & RETRY LOGIC
// ============================================================================
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_ATTEMPTS_PER_WINDOW = 5;
const MAX_RETRY_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 1000;

interface RateLimitState {
  attempts: number;
  windowStart: number;
}

function isRateLimited(state: RateLimitState): boolean {
  const now = Date.now();
  if (now - state.windowStart > RATE_LIMIT_WINDOW_MS) {
    return false;
  }
  return state.attempts >= MAX_ATTEMPTS_PER_WINDOW;
}

function getRemainingCooldown(state: RateLimitState): number {
  const elapsed = Date.now() - state.windowStart;
  return Math.max(0, Math.ceil((RATE_LIMIT_WINDOW_MS - elapsed) / 1000));
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isNetworkError(error: any): boolean {
  return (
    error?.message === 'Network Error' ||
    error?.code === 'ERR_NETWORK' ||
    error?.code === 'ECONNABORTED' ||
    !navigator.onLine
  );
}

function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().slice(0, 254);
}

function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '').trim();
}

// ============================================================================
// LOGIN PAGE COMPONENT
// ============================================================================
export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, isAuthenticated } = useAuthStore();
  const { success, error: showError } = useToastStore();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/listings');
    }
  }, [isAuthenticated, router]);

  // UI State
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginState, setLoginState] = useState<'idle' | 'authenticating' | 'redirecting'>('idle');

  // Rate limiting state
  const rateLimitRef = useRef<RateLimitState>({
    attempts: 0,
    windowStart: Date.now(),
  });
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Form setup with validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  // ========================================================================
  // LOGIN EXECUTION
  // ========================================================================
  const executeLoginWithRetry = useCallback(
    async (email: string, password: string, rememberMe: boolean = false, retryCount = 0): Promise<void> => {
      try {
        await login(email, password, rememberMe);
      } catch (err: any) {
        if (isNetworkError(err) && retryCount < MAX_RETRY_ATTEMPTS) {
          const delay = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
          await sleep(delay);
          return executeLoginWithRetry(email, password, rememberMe, retryCount + 1);
        }
        throw err;
      }
    },
    [login]
  );

  const onSubmit = async (data: LoginForm) => {
    const now = Date.now();
    if (now - rateLimitRef.current.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitRef.current = { attempts: 0, windowStart: now };
    }

    if (isRateLimited(rateLimitRef.current)) {
      const remaining = getRemainingCooldown(rateLimitRef.current);
      setCooldownSeconds(remaining);
      showError(`Too many attempts. Please wait ${remaining} seconds.`);
      return;
    }

    rateLimitRef.current.attempts++;

    const sanitizedEmail = sanitizeEmail(data.email);
    const sanitizedPassword = sanitizeInput(data.password);

    setLoading(true);
    setError(null);
    setLoginState('authenticating');

    try {
      await executeLoginWithRetry(sanitizedEmail, sanitizedPassword, data.rememberMe || false);

      if (data.rememberMe && typeof window !== 'undefined') {
        localStorage.setItem('rememberedEmail', sanitizedEmail);
      } else if (typeof window !== 'undefined') {
        localStorage.removeItem('rememberedEmail');
      }

      setLoginState('redirecting');
      success('Welcome back! Redirecting...');

      await sleep(300);

      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectUrl);
      } else {
        router.push('/listings');
      }
    } catch (err: any) {
      setLoginState('idle');

      let errorMsg = 'Login failed. Please check your credentials.';
      if (isNetworkError(err)) {
        errorMsg = 'Unable to connect. Please check your internet connection.';
      } else if (err.response?.status === 401) {
        errorMsg = 'Invalid email or password.';
      } else if (err.response?.status === 429) {
        errorMsg = 'Too many login attempts. Please try again later.';
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }

      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      await loginWithGoogle();
    } catch (err: any) {
      const errorMsg = err.message || 'Google sign-in failed.';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const isButtonDisabled = loading || googleLoading || cooldownSeconds > 0;
  const buttonText =
    cooldownSeconds > 0
      ? `Wait ${cooldownSeconds}s`
      : loginState === 'authenticating'
      ? 'Signing in...'
      : loginState === 'redirecting'
      ? 'Redirecting...'
      : 'Sign in';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6">
      {/* Subtle modern background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="max-w-[440px] w-full relative z-10">
        {/* Main Card with sharp modern borders */}
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

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
            <p className="mt-1.5 text-xs text-slate-500">
              Don't have an account?{' '}
              <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Create one for free
              </Link>
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email */}
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

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
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
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs text-slate-600">Remember me on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isButtonDisabled}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold rounded-md shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{buttonText}</span>
                </>
              ) : (
                <>
                  <span>{buttonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="px-3 bg-white text-slate-400 font-medium">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
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
            <span>Sign in with Google</span>
          </button>

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
