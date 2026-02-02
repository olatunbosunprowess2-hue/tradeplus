'use client';

interface PremiumBadgeProps {
    size?: 'xs' | 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    className?: string;
}

/**
 * Premium Badge Component
 * Twitter/Instagram-style verified badge for premium subscribers
 */
export default function PremiumBadge({
    size = 'sm',
    showLabel = false,
    className = ''
}: PremiumBadgeProps) {
    const sizeClasses = {
        xs: 'w-3.5 h-3.5',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };

    const labelSizeClasses = {
        xs: 'text-[10px]',
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
    };

    return (
        <span
            className={`inline-flex items-center gap-1 ${className}`}
            title="Premium Seller"
        >
            {/* Gold Verified Badge - Twitter/Instagram Style */}
            <span className={`${sizeClasses[size]} relative flex-shrink-0`}>
                {/* Outer glow effect */}
                <span className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 blur-[2px] opacity-50" />

                {/* Badge circle */}
                <svg
                    viewBox="0 0 24 24"
                    className="relative w-full h-full"
                    fill="none"
                >
                    {/* Gold gradient background */}
                    <defs>
                        <linearGradient id="premiumGold" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#F59E0B" />
                            <stop offset="50%" stopColor="#FBBF24" />
                            <stop offset="100%" stopColor="#F59E0B" />
                        </linearGradient>
                    </defs>

                    {/* Check badge shape (like Twitter Blue) */}
                    <path
                        d="M9.75 11.25L12 13.5L16.5 9M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                        fill="url(#premiumGold)"
                        stroke="#854D0E"
                        strokeWidth="0.5"
                    />

                    {/* White checkmark */}
                    <path
                        d="M8 12L11 15L16 9"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </span>

            {showLabel && (
                <span className={`${labelSizeClasses[size]} font-bold bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent`}>
                    Premium
                </span>
            )}
        </span>
    );
}
