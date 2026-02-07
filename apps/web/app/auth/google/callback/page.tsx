'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useToastStore } from '@/lib/toast-store';
import Link from 'next/link';

export default function GoogleCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { handleGoogleCallback } = useAuthStore();
    const { success, error: showError } = useToastStore();
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [errorMessage, setErrorMessage] = useState('');

    // Prevent double execution in React Strict Mode
    const processedRef = useRef(false);

    useEffect(() => {
        const handleCallback = async () => {
            // Prevent double execution
            if (processedRef.current) return;

            const code = searchParams.get('code');
            const error = searchParams.get('error');

            if (error) {
                processedRef.current = true;
                setStatus('error');
                setErrorMessage('Google sign-in was canceled or failed.');
                showError('Sign in failed');
                return;
            }

            if (!code) {
                processedRef.current = true;
                setStatus('error');
                setErrorMessage('No authorization code received.');
                return;
            }

            try {
                processedRef.current = true;
                await handleGoogleCallback(code);

                setStatus('success');
                success('Successfully signed in with Google!');

                // Redirect after brief delay
                setTimeout(() => {
                    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
                    if (redirectUrl) {
                        sessionStorage.removeItem('redirectAfterLogin');
                        router.push(redirectUrl);
                    } else {
                        router.push('/listings');
                    }
                }, 1000);
            } catch (err: any) {
                console.error('Google callback error:', err);
                setStatus('error');
                setErrorMessage(err.message || 'Failed to complete Google sign-in.');
                showError(err.message || 'Sign in failed');
            }
        };

        handleCallback();
    }, [searchParams, router, handleGoogleCallback, success, showError]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
                {status === 'processing' && (
                    <>
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Verifying with Google...
                        </h2>
                        <p className="text-gray-600">
                            Please wait while we complete your sign in.
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Welcome Back!
                        </h2>
                        <p className="text-gray-600">
                            Redirecting you to the app...
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Sign In Failed
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {errorMessage}
                        </p>
                        <div className="flex flex-col gap-3">
                            <Link
                                href="/login"
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors"
                            >
                                Return to Login
                            </Link>
                            <Link
                                href="/"
                                className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
                            >
                                Go Home
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
