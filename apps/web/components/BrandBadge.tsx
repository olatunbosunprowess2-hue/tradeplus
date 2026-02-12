'use client';

/**
 * BrandBadge — Premium Gold "Official Brand ✦" badge for verified brand sellers.
 * Two-Badge System: Gold = Official Brand, Blue = Verified User (standard).
 */
export default function BrandBadge({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' }) {
    const sizeClasses = {
        xs: 'text-[10px] px-2 py-0.5 gap-1',
        sm: 'text-xs px-2.5 py-1 gap-1',
        md: 'text-sm px-3 py-1.5 gap-1.5',
    };

    const iconSizes = {
        xs: 'w-3 h-3',
        sm: 'w-3.5 h-3.5',
        md: 'w-4 h-4',
    };

    return (
        <span
            className={`${sizeClasses[size]} inline-flex items-center font-bold rounded-full 
            bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-white 
            shadow-md shadow-amber-200/50 border border-amber-300/50
            whitespace-nowrap animate-shimmer`}
            style={{
                backgroundSize: '200% 100%',
            }}
            title="Official Brand — Verified by BarterWave"
        >
            <svg
                className={`${iconSizes[size]} drop-shadow-sm`}
                viewBox="0 0 24 24"
                fill="currentColor"
            >
                <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z" />
            </svg>
            <span className="drop-shadow-sm">Official Brand</span>
        </span>
    );
}
