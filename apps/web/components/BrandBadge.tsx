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
            bg-amber-50 text-amber-600 
            shadow-sm border border-amber-200/60
            whitespace-nowrap`}
            title="Official Brand — Verified by BarterWave"
        >
            <svg
                className={`${iconSizes[size]} drop-shadow-sm text-yellow-500`}
                viewBox="0 0 20 20"
                fill="currentColor"
            >
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Brand</span>
        </span>
    );
}
