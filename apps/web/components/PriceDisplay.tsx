'use client';

import { formatPriceSimple, getCurrencyByCode } from '@/lib/currencies';

interface PriceDisplayProps {
    priceCents: number;
    currencyCode?: string;
    originalPriceCents?: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    isBarterFriendly?: boolean;
}

export default function PriceDisplay({
    priceCents,
    currencyCode = 'NGN',
    originalPriceCents,
    size = 'md',
    className = '',
    isBarterFriendly = false
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

    const price = formatPriceSimple(priceCents, currencyCode);
    const originalPrice = originalPriceCents
        ? formatPriceSimple(originalPriceCents, currencyCode)
        : null;
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
        <div className={`${className}`}>
            <span className="text-xs text-gray-500 block mb-0.5">Seller valued at</span>
            <div className="flex items-center gap-2">
                <span className={`font-bold ${sizeClasses[size]} text-gray-900`}>
                    {price}
                </span>
                {originalPrice && (
                    <>
                        <span className={`text-gray-400 line-through ${smallSizeClasses[size]}`}>
                            {originalPrice}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${smallSizeClasses[size]}`}
                            style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                            -{discount}%
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}
