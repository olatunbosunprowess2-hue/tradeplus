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
        <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] relative overflow-hidden">
            {/* Abstract background shapes */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen pointer-events-none" />

            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="backdrop-blur-2xl bg-white/5 border border-white/10 p-10 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden relative">
                    {/* Glowing border top */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />

                    <div className="text-center relative z-20">
                        {status === 'processing' && (
                            <div className="flex flex-col items-center animate-in fade-in duration-700">
                                <div className="relative w-28 h-28 mb-10 flex items-center justify-center">
                                    {/* Pulsing glow rings */}
                                    <div className="absolute inset-0 bg-blue-500 rounded-full animate-[ping_3s_ease-in-out_infinite] opacity-20" />
                                    <div className="absolute inset-2 bg-indigo-500 rounded-full animate-[ping_3s_ease-in-out_infinite_1s] opacity-30" />
                                    <div className="relative w-20 h-20 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.5)]">
                                        <div className="w-12 h-12 relative">
                                            <Image src="/logo-transparent.png" alt="BarterWave Logo" fill className="object-contain animate-pulse" priority />
                                        </div>
                                    </div>
                                </div>
                                <h1 className="text-3xl font-display font-bold text-white mb-4 tracking-tight">
                                    Verifying session
                                </h1>
                                <div className="flex items-center gap-3 text-blue-200 bg-blue-500/10 px-6 py-2.5 rounded-full border border-blue-500/20">
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span className="font-medium tracking-wide text-sm">Waiting for Google...</span>
                                </div>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
                                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(16,185,129,0.4)] border border-emerald-300/30">
                                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-display font-bold text-white mb-3 tracking-tight">
                                    Welcome Back
                                </h2>
                                <p className="text-emerald-200/80 font-medium">
                                    Redirecting you securely...
                                </p>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-500">
                                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-rose-500 to-red-600 rounded-full flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(244,63,94,0.4)] border border-rose-400/30">
                                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-display font-bold text-white mb-4 tracking-tight">
                                    Authentication Failed
                                </h2>
                                <p className="text-rose-200/90 mb-8 max-w-[280px] mx-auto text-sm">
                                    {errorMessage}
                                </p>
                                <div className="flex flex-col w-full gap-3">
                                    <Link
                                        href="/login"
                                        className="w-full py-4 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] active:scale-[0.98] uppercase tracking-widest"
                                    >
                                        Try Again
                                    </Link>
                                    <Link
                                        href="/"
                                        className="w-full py-4 text-sm text-gray-400 font-bold hover:text-white hover:bg-white/5 rounded-2xl transition-all uppercase tracking-widest"
                                    >
                                        Return Home
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
