'use client';

interface PriceDisplayProps {
    priceCents: number;
    originalPriceCents?: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function PriceDisplay({
    priceCents,
    originalPriceCents,
    size = 'md',
    className = ''
}: PriceDisplayProps) {
    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
    };

    const smallSizeClasses = {
        sm: 'text-xs',
        md: 'text-xs',
        lg: 'text-sm',
    };

    const price = (priceCents / 100).toLocaleString();
    const originalPrice = originalPriceCents ? (originalPriceCents / 100).toLocaleString() : null;
    const discount = originalPriceCents
        ? Math.round(((originalPriceCents - priceCents) / originalPriceCents) * 100)
        : 0;

    if (priceCents === 0) {
        return (
            <div className={`font-bold ${className}`}>
                <span className={`${sizeClasses[size]} text-gray-900`}>
                    Free
                </span>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <span className={`font-bold ${sizeClasses[size]} text-gray-900`}>
                ₦{price}
            </span>
            {originalPrice && (
                <>
                    <span className={`text-gray-400 line-through ${smallSizeClasses[size]}`}>
                        ₦{originalPrice}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${smallSizeClasses[size]}`}
                        style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                        -{discount}%
                    </span>
                </>
            )}
        </div>
    );
}
