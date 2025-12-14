'use client';

import Link from 'next/link';
import Image from 'next/image';
import BookmarkButton from './BookmarkButton';
import AddToCartButton from './AddToCartButton';
import ShareButton from './ShareButton';
import DiscountBadge from './DiscountBadge';
import DistressBadge from './DistressBadge';
import StarRating from './StarRating';
import PriceDisplay from './PriceDisplay';
import type { BookmarkedListing } from '@/lib/bookmarks-store';

interface ListingCardProps {
    listing: {
        id: string;
        title: string;
        description?: string;
        priceCents?: number;
        originalPriceCents?: number; // For showing discounts
        currencyCode?: string;
        images?: { url: string }[];
        seller?: {
            profile?: {
                displayName?: string;
                region?: {
                    name?: string;
                };
            };
            email?: string;
            verified?: boolean;
            isVerified?: boolean;
            locationAddress?: string;
        };
        sellerId: string;
        region?: {
            name?: string;
        };
        allowCash?: boolean;
        allowBarter?: boolean;
        quantity?: number;
        type?: 'PHYSICAL' | 'SERVICE';
        condition?: 'new' | 'used';
        rating?: number; // 0-5 star rating
        reviewCount?: number;
        isDistressSale?: boolean; // Urgent/distress sale
    };
}

export default function ListingCard({ listing }: ListingCardProps) {
    const bookmarkData: BookmarkedListing = {
        id: listing.id,
        title: listing.title,
        priceCents: listing.priceCents,
        currencyCode: listing.currencyCode || 'NGN',
        images: listing.images || [],
        sellerId: listing.sellerId,
        sellerName: listing.seller?.profile?.displayName || listing.seller?.email || 'Unknown',
        location: listing.region?.name || '',
        bookmarkedAt: new Date().toISOString(),
    };

    // Extract city from address (format: "123 Street, City, State, Country")
    const extractCity = (address?: string) => {
        if (!address) return null;
        const parts = address.split(',').map(p => p.trim());
        // Typically: [street, city, state, country] - get second to last for city/state
        if (parts.length >= 3) {
            return parts[parts.length - 3]; // City
        } else if (parts.length >= 2) {
            return parts[parts.length - 2];
        }
        return parts[0] || null;
    };

    // Get location display - prioritize region, then extract from address
    const getLocationDisplay = () => {
        // First check listing's region
        if (listing.region?.name) {
            return listing.region.name;
        }
        // Then check seller's profile region
        if (listing.seller?.profile?.region?.name) {
            return listing.seller.profile.region.name;
        }
        // Finally try to extract from locationAddress
        const city = extractCity(listing.seller?.locationAddress);
        if (city) {
            return city;
        }
        return null;
    };

    const locationDisplay = getLocationDisplay();

    return (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 group relative">
            {/* Gradient accent on hover */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />

            <Link href={`/listings/${listing.id}`} className="block">
                {/* Image Section */}
                <div className="relative">
                    {listing.images?.[0] ? (
                        <Image
                            src={listing.images[0].url}
                            alt={listing.title}
                            width={400}
                            height={400}
                            className="w-full h-48 object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                            <span className="text-6xl">📦</span>
                        </div>
                    )}

                    {/* Discount Badge - Show if originalPriceCents exists */}
                    {listing.originalPriceCents && listing.priceCents && listing.originalPriceCents > listing.priceCents && (
                        <DiscountBadge
                            percentage={Math.round(((listing.originalPriceCents - listing.priceCents) / listing.originalPriceCents) * 100)}
                        />
                    )}

                    {/* Distress Sale Badge - Top left */}
                    {listing.isDistressSale && (
                        <div className="absolute top-2 left-2 z-10">
                            <DistressBadge size="sm" />
                        </div>
                    )}

                    {/* Bookmark Button - Always visible, top-right */}
                    <div
                        className="absolute top-2 right-2 z-10"
                        onClick={(e) => e.preventDefault()}
                    >
                        <BookmarkButton listing={bookmarkData} />
                    </div>

                    {/* Share Button - Always visible on mobile, hover on desktop, bottom-left */}
                    <div
                        className="absolute bottom-2 left-2 z-10 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.preventDefault()}
                    >
                        <ShareButton
                            url={typeof window !== 'undefined' ? `${window.location.origin}/listings/${listing.id}` : `https://barterwave.com/listings/${listing.id}`}
                            title={listing.title}
                            description={listing.description || listing.title}
                            imageUrl={listing.images?.[0]?.url}
                            price={listing.priceCents !== undefined ? `₦${(listing.priceCents / 100).toLocaleString()}` : 'N/A'}
                            allowCash={listing.allowCash}
                            allowBarter={listing.allowBarter}
                            className="bg-white text-gray-700 p-2.5 rounded-full hover:bg-gray-100 transition shadow-lg"
                            iconOnly
                        />
                    </div>

                    {/* Cart Icon - Always visible on mobile, hover on desktop, bottom-right */}
                    <div
                        className="absolute bottom-2 right-2 z-10 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.preventDefault()}
                    >
                        <AddToCartButton
                            listing={{
                                id: listing.id,
                                title: listing.title,
                                priceCents: listing.priceCents,
                                currency: listing.currencyCode || 'NGN',
                                images: listing.images || [],
                                sellerId: listing.sellerId,
                                sellerName: listing.seller?.profile?.displayName || listing.seller?.email || 'Unknown',
                                allowCash: listing.allowCash ?? true,
                                quantity: listing.quantity || 1,
                            }}
                            className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition shadow-lg"
                            iconOnly
                        />
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900">
                        {listing.title}
                    </h3>

                    {listing.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {listing.description}
                        </p>
                    )}

                    {listing.priceCents !== undefined && (
                        <div className="mb-3">
                            <PriceDisplay
                                priceCents={listing.priceCents}
                                originalPriceCents={listing.originalPriceCents}
                                size="md"
                            />
                        </div>
                    )}

                    {/* Star Rating */}
                    {listing.rating !== undefined && listing.rating > 0 && (
                        <div className="mb-3">
                            <StarRating
                                rating={listing.rating}
                                showNumber={false}
                                size="sm"
                            />
                            {listing.reviewCount && listing.reviewCount > 0 && (
                                <span className="text-xs text-gray-500 ml-1">
                                    ({listing.reviewCount})
                                </span>
                            )}
                        </div>
                    )}

                    {/* Location Info */}
                    <div className="flex items-center gap-2 mb-2 text-gray-600 min-h-[24px]">
                        <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium truncate">
                            {locationDisplay || 'Location not set'}
                        </span>
                        {(listing.seller?.verified || listing.seller?.isVerified) && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium flex-shrink-0">
                                ✓ Verified
                            </span>
                        )}
                    </div>

                    {/* Trade Options */}
                    <div className="flex gap-2 flex-wrap">
                        {listing.allowCash && (
                            <span className="text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-semibold">
                                💵 Cash
                            </span>
                        )}
                        {listing.allowBarter && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7H4m0 0l4-4m-4 4l4 4m0 6h12m0 0l-4 4m4-4l-4-4" />
                                </svg>
                                Barter
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
}
