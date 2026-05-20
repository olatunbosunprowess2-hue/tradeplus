'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useToastStore } from '@/lib/toast-store';
import Link from 'next/link';
import Image from 'next/image';

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
                // Redirect immediately
                const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
                if (redirectUrl) {
                    sessionStorage.removeItem('redirectAfterLogin');
                    router.push(redirectUrl);
                } else {
                    router.push('/listings');
                }
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
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 text-center border border-white/40 relative overflow-hidden">
                {status === 'processing' && (
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-50 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-500 animate-loading-bar" />
                    </div>
                )}

                {status === 'processing' && (
                    <div className="flex flex-col items-center animate-in fade-in duration-500">
                        <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                            <div className="relative w-16 h-16 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-sm border border-gray-100">
                                <div className="w-10 h-10 relative">
                                    <Image src="/logo-transparent.png" alt="BarterWave Logo" fill className="object-contain" priority />
                                </div>
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-3">
                            Verifying session
                        </h1>
                        <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-5 py-2.5 rounded-xl border border-gray-100">
                            <span className="font-medium text-sm">Securing session</span>
                            <span className="flex items-center gap-1 ml-1.5">
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-dot-1" />
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-dot-2" />
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-dot-3" />
                            </span>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
                        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Welcome Back
                        </h2>
                        <p className="text-gray-500 font-medium">
                            Redirecting you securely...
                        </p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-500">
                        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-rose-500 to-red-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-rose-500/20">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">
                            Authentication Failed
                        </h2>
                        <p className="text-gray-600 mb-8 max-w-[280px] mx-auto text-sm">
                            {errorMessage}
                        </p>
                        <div className="flex flex-col w-full gap-3">
                            <Link
                                href="/login"
                                className="w-full py-3.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md active:scale-[0.98] uppercase tracking-wider"
                            >
                                Try Again
                            </Link>
                            <Link
                                href="/"
                                className="w-full py-3.5 text-sm text-gray-500 font-bold hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all uppercase tracking-wider"
                            >
                                Return Home
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
