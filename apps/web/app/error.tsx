'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-white flex flex-col justify-center items-center px-4">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="relative">
                    <h1 className="text-9xl font-extrabold text-red-500 opacity-20">500</h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white px-4">
                            <svg className="w-24 h-24 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-gray-900">Something went wrong</h2>
                    <p className="text-gray-500">
                        We've encountered an unexpected error on our end.
                        Our team has been notified and is looking into it.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => reset()}
                        className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-200"
                    >
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="w-full sm:w-auto px-8 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
                    >
                        Go Home
                    </Link>
                </div>

                <div className="pt-8">
                    <p className="text-sm text-gray-400">
                        Error ID: <span className="font-mono bg-gray-50 px-2 py-1 rounded">{error.digest || 'Internal Server Error'}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
