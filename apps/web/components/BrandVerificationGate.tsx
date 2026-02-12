'use client';

import Link from 'next/link';

interface BrandVerificationGateProps {
    children: React.ReactNode;
    /** Whether the current user is a verified brand */
    isVerifiedBrand: boolean;
    /** Optional custom message */
    message?: string;
    /** Whether to show as a full overlay or inline lock */
    variant?: 'overlay' | 'inline';
}

/**
 * BrandVerificationGate — wraps features that require brand verification.
 * If user is not a verified brand, the children are shown grayed-out/locked 
 * with a prompt to apply for brand verification.
 */
export default function BrandVerificationGate({
    children,
    isVerifiedBrand,
    message = 'This premium feature is available exclusively to Verified Brands.',
    variant = 'inline',
}: BrandVerificationGateProps) {
    if (isVerifiedBrand) {
        return <>{children}</>;
    }

    if (variant === 'overlay') {
        return (
            <div className="relative">
                <div className="pointer-events-none opacity-30 blur-[1px] select-none">
                    {children}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[2px] rounded-xl">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-sm mx-4 text-center">
                        <div className="text-3xl mb-3">🔒</div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                            Verified Brands Only
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                            {message}
                        </p>
                        <Link
                            href="/brand-apply"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-white font-semibold rounded-lg shadow hover:shadow-md transition-all text-sm"
                        >
                            <span>✦</span> Apply for Verification
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Inline variant — smaller, shows lock icon + link
    return (
        <div className="relative group">
            <div className="pointer-events-none opacity-40 select-none">
                {children}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
                <Link
                    href="/brand-apply"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-amber-700 dark:text-amber-300 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                >
                    🔒 <span>Verified Brands Only</span>
                </Link>
            </div>
        </div>
    );
}
