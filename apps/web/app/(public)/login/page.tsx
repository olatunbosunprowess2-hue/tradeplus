'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/lib/auth-store';
import { useToastStore } from '@/lib/toast-store';
import Link from 'next/link';
import Image from 'next/image';

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
        return false; // Window expired
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

// ============================================================================
// INPUT SANITIZATION
// ============================================================================
function sanitizeEmail(email: string): string {
    return email.trim().toLowerCase().slice(0, 254);
}

function sanitizeInput(input: string): string {
    return input
        .replace(/[<>]/g, '') // Remove potential XSS vectors
        .trim();
}

// ============================================================================
// LOGIN PAGE COMPONENT
// ============================================================================
export default function LoginPage() {
    const router = useRouter();
    const { login, loginWithGoogle, isAuthenticated } = useAuthStore();
    const { success, error: showError, warning } = useToastStore();

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
        formState: { errors, isValid, isDirty },
        watch,
        setFocus,
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        mode: 'onChange',
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false,
        },
    });

    const emailValue = watch('email');
    const passwordValue = watch('password');

    // Focus email field on mount
    useEffect(() => {
        setFocus('email');
    }, [setFocus]);

    // Cooldown timer
    useEffect(() => {
        if (cooldownSeconds > 0) {
            const timer = setTimeout(() => {
                setCooldownSeconds((prev) => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldownSeconds]);

    // ========================================================================
    // LOGIN WITH RETRY LOGIC
    // ========================================================================
    const executeLoginWithRetry = useCallback(
        async (email: string, password: string, retryCount = 0): Promise<void> => {
            try {
                await login(email, password);
            } catch (err: any) {
                // Check if it's a network error and we have retries left
                if (isNetworkError(err) && retryCount < MAX_RETRY_ATTEMPTS) {
                    const delay = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
                    console.log(`Network error, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
                    await sleep(delay);
                    return executeLoginWithRetry(email, password, retryCount + 1);
                }
                throw err;
            }
        },
        [login]
    );

    // ========================================================================
    // FORM SUBMISSION HANDLER
    // ========================================================================
    const onSubmit = async (data: LoginForm) => {
        // Check rate limiting
        const now = Date.now();
        if (now - rateLimitRef.current.windowStart > RATE_LIMIT_WINDOW_MS) {
            // Reset window
            rateLimitRef.current = { attempts: 0, windowStart: now };
        }

        if (isRateLimited(rateLimitRef.current)) {
            const remaining = getRemainingCooldown(rateLimitRef.current);
            setCooldownSeconds(remaining);
            showError(`Too many attempts. Please wait ${remaining} seconds.`);
            return;
        }

        // Increment attempt counter
        rateLimitRef.current.attempts++;

        // Sanitize inputs
        const sanitizedEmail = sanitizeEmail(data.email);
        const sanitizedPassword = sanitizeInput(data.password);

        setLoading(true);
        setError(null);
        setLoginState('authenticating');

        try {
            await executeLoginWithRetry(sanitizedEmail, sanitizedPassword);

            // Handle "Remember Me"
            if (data.rememberMe && typeof window !== 'undefined') {
                localStorage.setItem('rememberedEmail', sanitizedEmail);
            } else if (typeof window !== 'undefined') {
                localStorage.removeItem('rememberedEmail');
            }

            setLoginState('redirecting');
            success('Welcome back! Redirecting...');

            // Brief delay for user feedback
            await sleep(500);

            // Redirect
            const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
            if (redirectUrl) {
                sessionStorage.removeItem('redirectAfterLogin');
                router.push(redirectUrl);
            } else {
                router.push('/listings');
            }
        } catch (err: any) {
            setLoginState('idle');

            let errorMsg = 'Login failed. Please try again.';

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

    // ========================================================================
    // GOOGLE SIGN-IN HANDLER
    // ========================================================================
    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setError(null);

        try {
            await loginWithGoogle();
            // The loginWithGoogle function will handle the redirect
        } catch (err: any) {
            const errorMsg = err.message || 'Google sign-in failed.';
            setError(errorMsg);
            showError(errorMsg);
        } finally {
            setGoogleLoading(false);
        }
    };

    // Remember email on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const rememberedEmail = localStorage.getItem('rememberedEmail');
            if (rememberedEmail) {
                // Use setValue from useForm in a safe way
            }
        }
    }, []);

    // Determine button state
    const isButtonDisabled = loading || googleLoading || cooldownSeconds > 0;
    const buttonText = cooldownSeconds > 0
        ? `Wait ${cooldownSeconds}s`
        : loginState === 'authenticating'
            ? 'Signing in...'
            : loginState === 'redirecting'
                ? 'Redirecting...'
                : 'Sign in';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl" />
            </div>

            <div className="max-w-md w-full relative z-10">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/10 p-8 border border-white/50">
                    {/* Header */}
                    <div className="text-center mb-8">
                        {/* Logo */}
                        <div className="mx-auto w-20 h-20 mb-4">
                            <Image
                                src="/logo-transparent.png"
                                alt="BarterWave"
                                width={80}
                                height={80}
                                className="object-contain"
                                priority
                            />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            Welcome Back
                        </h1>
                        <p className="mt-2 text-gray-600">
                            Don't have an account?{' '}
                            <Link
                                href="/register"
                                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                Sign up for free
                            </Link>
                        </p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div
                            role="alert"
                            aria-live="polite"
                            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
                        >
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                        {/* Email Field */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Email address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <input
                                    {...register('email')}
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    aria-invalid={errors.email ? 'true' : 'false'}
                                    aria-describedby={errors.email ? 'email-error' : undefined}
                                    className={`block w-full pl-10 pr-4 py-3 border-2 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 transition-colors ${errors.email
                                        ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                                        : 'border-gray-200 focus:border-blue-500 bg-white'
                                        }`}
                                    placeholder="you@example.com"
                                />
                            </div>
                            {errors.email && (
                                <p id="email-error" className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                                    </svg>
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Password
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    {...register('password')}
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    aria-invalid={errors.password ? 'true' : 'false'}
                                    aria-describedby={errors.password ? 'password-error' : undefined}
                                    className={`block w-full pl-10 pr-12 py-3 border-2 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 transition-colors ${errors.password
                                        ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                                        : 'border-gray-200 focus:border-blue-500 bg-white'
                                        }`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p id="password-error" className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                                    </svg>
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Remember Me Checkbox */}
                        <div className="flex items-center">
                            <input
                                {...register('rememberMe')}
                                id="rememberMe"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                            />
                            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                                Remember me
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isButtonDisabled}
                            aria-busy={loading}
                            className={`w-full flex items-center justify-center py-3.5 px-4 rounded-xl font-semibold text-white transition-all duration-200 ${isButtonDisabled
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 active:scale-[0.98]'
                                }`}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    {buttonText}
                                </span>
                            ) : (
                                buttonText
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="mt-6 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    {/* Google Sign-In Button */}
                    <div className="mt-6">
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={googleLoading || loading}
                            type="button"
                            aria-busy={googleLoading}
                            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border-2 border-gray-200 rounded-xl text-gray-700 font-medium bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            {googleLoading ? (
                                <svg className="animate-spin h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                            <span>{googleLoading ? 'Connecting...' : 'Sign in with Google'}</span>
                        </button>
                    </div>

                    {/* Footer */}
                    <p className="mt-8 text-center text-xs text-gray-500">
                        By signing in, you agree to our{' '}
                        <Link href="/terms" className="text-blue-600 hover:text-blue-700">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
