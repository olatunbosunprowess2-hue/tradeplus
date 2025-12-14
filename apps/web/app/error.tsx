'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to console (in production, send to error reporting service like Sentry)
        console.error('Page error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="text-center max-w-lg">
                <div className="text-8xl mb-6">🚧</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">Oops! Something broke</h1>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    We encountered an unexpected error while loading this page.
                    Our team has been notified and we're working on a fix.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={reset}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
                    >
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                    >
                        Go Home
                    </Link>
                </div>

                {/* Show error digest in development */}
                {process.env.NODE_ENV === 'development' && error.digest && (
                    <p className="mt-8 text-xs text-gray-400 font-mono">
                        Error ID: {error.digest}
                    </p>
                )}
            </div>
        </div>
    );
}
