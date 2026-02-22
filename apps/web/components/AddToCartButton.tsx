'use client';

import { useCartStore } from '@/lib/cart-store';
import { useAuthStore } from '@/lib/auth-store';
import { useState } from 'react';

interface AddToCartButtonProps {
    listing: {
        id: string;
        title: string;
        priceCents?: number;
        currency?: string;
        images?: { url: string }[];
        sellerId: string;
        sellerName?: string;
        sellerAvatar?: string;
        allowCash: boolean;
        allowBarter?: boolean;
        quantity: number;
    };
    className?: string;
    iconOnly?: boolean;
}

export default function AddToCartButton({ listing, className = '', iconOnly = false }: AddToCartButtonProps) {
    const { addItem } = useCartStore();
    const { user } = useAuthStore();
    const [isAdded, setIsAdded] = useState(false);

    const isOwner = user?.id === listing.sellerId;
    const canAddToCart = (listing.allowCash || listing.allowBarter) && !isOwner;

    if (!canAddToCart) return null;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        addItem({
            id: listing.id,
            title: listing.title,
            price: (listing.priceCents || 0) / 100,
            currency: listing.currency || 'NGN',
            image: listing.images?.[0]?.url || '',
            sellerId: listing.sellerId,
            sellerName: listing.sellerName || 'Unknown Seller',
            sellerAvatar: listing.sellerAvatar,
            maxQuantity: listing.quantity,
        });

        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    if (iconOnly) {
        return (
            <button
                onClick={handleAddToCart}
                className={`flex items-center justify-center transition-all ${isAdded
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                    } ${className}`}
                aria-label={isAdded ? 'Added to cart' : 'Add to cart'}
            >
                {isAdded ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                )}
            </button>
        );
    }

    return (
        <button
            onClick={handleAddToCart}
            className={`flex items-center justify-center gap-2 transition-all duration-300 ${isAdded
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-white border focus:ring-4 focus:ring-blue-500/10 border-blue-600 text-blue-600 hover:bg-blue-50'
                } px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm active:scale-95 ${className}`}
        >
            {isAdded ? (
                <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Added
                </>
            ) : (
                <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add to Cart
                </>
            )}
        </button>
    );
}
