'use client';

interface DiscountBadgeProps {
    percentage: number;
    className?: string;
}

export default function DiscountBadge({ percentage, className = '' }: DiscountBadgeProps) {
    return (
        <div
            className={`absolute top-2 left-2 px-2 py-1 rounded text-white font-bold text-sm shadow-md z-10 ${className}`}
            style={{ backgroundColor: '#FF6B35' }}
        >
            -{percentage}%
        </div>
    );
}
