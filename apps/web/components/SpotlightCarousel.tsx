'use client';

import Link from 'next/link';
import Image from 'next/image';
import { sanitizeUrl } from '@/lib/utils';
import { useRef } from 'react';
import DistressBadge from './DistressBadge';

interface SpotlightListing {
    id: string;
    title: string;
    priceCents?: number;
    currencyCode?: string;
    images?: { url: string }[];
    isDistressSale?: boolean;
    isFeatured?: boolean;
    spotlightExpiry?: string;
    seller?: {
        isVerified?: boolean;
        profile?: {
            displayName?: string;
        };
    };
}

interface SpotlightCarouselProps {
    listings: SpotlightListing[];
}

export default function SpotlightCarousel({ listings }: SpotlightCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Filter to only show spotlight/featured items with active expiry
    const spotlightItems = listings.filter(l => {
        if (!l.isFeatured && !l.spotlightExpiry) return false;
        if (l.spotlightExpiry) {
            return new Date(l.spotlightExpiry) > new Date();
        }
        return l.isFeatured;
    });

    if (spotlightItems.length === 0) return null;

    const formatPrice = (cents?: number, currencyCode?: string) => {
        if (!cents) return 'N/A';
        const currency = currencyCode || 'NGN';
        if (currency === 'USD') {
            return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        }
        return `₦${(cents / 100).toLocaleString('en-NG')}`;
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    return (
        <section className="mb-6">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">⭐</span>
                        <h2 className="text-lg font-bold text-gray-900">Spotlight Deals</h2>
                    </div>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                        Featured
                    </span>
                </div>

                {/* Navigation Arrows - Desktop */}
                <div className="hidden md:flex gap-2">
                    <button
                        onClick={() => scroll('left')}
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Horizontal Scrolling Carousel */}
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {spotlightItems.map((listing) => (
                    <Link
                        key={listing.id}
                        href={`/listings/${listing.id}`}
                        className="flex-shrink-0 w-64 snap-start group"
                    >
                        <div className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-amber-200 hover:border-amber-400 hover:shadow-xl transition-all duration-300 relative">
                            {/* Spotlight Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-100/20 to-transparent pointer-events-none" />

                            {/* Featured Badge */}
                            <div className="absolute top-2 right-2 z-10 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                                <span className="text-xs">⭐</span> Spotlight
                            </div>

                            {/* Distress Badge if applicable */}
                            {listing.isDistressSale && (
                                <div className="absolute top-2 left-2 z-10">
                                    <DistressBadge size="sm" />
                                </div>
                            )}

                            {/* Image */}
                            <div className="relative h-40 bg-gray-100">
                                {listing.images?.[0] ? (
                                    <Image
                                        src={sanitizeUrl(listing.images[0].url)}
                                        alt={listing.title}
                                        fill
                                        unoptimized
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-4xl">📦</span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-3">
                                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">
                                    {listing.title}
                                </h3>
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold text-green-600">
                                        {formatPrice(listing.priceCents, listing.currencyCode)}
                                    </span>
                                    {listing.seller?.isVerified && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                            ✓ Verified
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
