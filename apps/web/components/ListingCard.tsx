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
import PremiumBadge from './PremiumBadge';
import BrandBadge from './BrandBadge';
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
            tier?: string; // 'free' or 'premium'
            brandVerificationStatus?: string;
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
        isAvailable?: boolean; // Service availability
        status?: string; // Listing status
        downpaymentCents?: number;
    };
}

export default function ListingCard({ listing: initialListing }: ListingCardProps) {
    // Sanitize listing URLs to enforce HTTPS in production
    // Also handle fallback if API URL was localhost in production
    const sanitizeUrl = (url?: string): string => {
        if (!url) return '';

        // Handle Cloudinary URLs - Upgrade to HTTPS
        if (url.includes('cloudinary.com')) {
            return url.replace('http:', 'https:');
        }

        // PROXY MODE: In production, rewrite localhost absolute URLs to relative paths
        if (process.env.NODE_ENV === 'production' && url.includes('localhost:3333')) {
            // Priority: /api prefix
            if (url.includes('/api/')) {
                return url.split('/api/')[1] ? `/api/${url.split('/api/')[1]}` : '/api';
            }
            // Handle /uploads and /private-uploads
            if (url.includes('/uploads/')) {
                return url.split('/uploads/')[1] ? `/uploads/${url.split('/uploads/')[1]}` : '/uploads';
            }
            if (url.includes('/private-uploads/')) {
                return url.split('/private-uploads/')[1] ? `/private-uploads/${url.split('/private-uploads/')[1]}` : '/private-uploads';
            }
            // Fallback: If it's just http://localhost:3333/some-path
            const relativePart = url.replace('http://localhost:3333', '');
            return relativePart.startsWith('/') ? relativePart : `/${relativePart}`;
        }

        // Force HTTPS for other non-localhost absolute URLs
        if (url.startsWith('http:') && !url.includes('localhost')) {
            return url.replace('http:', 'https:');
        }

        return url;
    };

    const listing = {
        ...initialListing,
        images: initialListing.images?.map(img => ({
            ...img,
            url: sanitizeUrl(img.url)
        })) || []
    };

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

    // Extract city from address and pair with state/region
    const extractLocationDisplay = (address?: string, stateName?: string) => {
        if (!address) return stateName || null;
        const parts = address.split(',').map(p => p.trim());
        const city = parts[0];
        // If we have a state name, use "City, State" format
        if (stateName) {
            return `${city}, ${stateName}`;
        }
        // Fallback: if address has multiple parts, try "City, State" from address
        if (parts.length >= 2) {
            // Assume format is "City, State, Country" - return "City, State"
            const state = parts.length >= 3 ? parts[1] : parts[1];
            return `${city}, ${state}`;
        }
        return city || null;
    };

    // Get location display - prioritize region/state, then extract from address
    const getLocationDisplay = () => {
        // First check listing's region (state)
        const listingState = listing.region?.name;
        if (listingState) {
            // Try to get city from seller's address
            const sellerAddress = listing.seller?.locationAddress;
            if (sellerAddress) {
                const city = sellerAddress.split(',')[0]?.trim();
                if (city && city !== listingState) {
                    return `${city}, ${listingState}`;
                }
            }
            return listingState;
        }
        // Then check seller's profile region
        const sellerState = listing.seller?.profile?.region?.name;
        if (sellerState) {
            const sellerAddress = listing.seller?.locationAddress;
            if (sellerAddress) {
                const city = sellerAddress.split(',')[0]?.trim();
                if (city && city !== sellerState) {
                    return `${city}, ${sellerState}`;
                }
            }
            return sellerState;
        }
        // Fallback: extract from address with state detection
        const location = extractLocationDisplay(listing.seller?.locationAddress);
        if (location) {
            return location;
        }
        return null;
    };

    const locationDisplay = getLocationDisplay();

    // Determine if this is an urgent/distress item that needs special styling
    const isUrgentItem = listing.isDistressSale;

    // Safeguard against undefined/missing IDs
    const isValidId = listing.id && listing.id !== 'undefined';

    if (!isValidId) {
        console.warn('[ListingCard] Rendering listing with missing or invalid ID:', listing.title);
    }

    return (
        <div className={`rounded-2xl shadow-md overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group relative ${isUrgentItem
            ? 'bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-400 ring-2 ring-red-200 animate-pulse-subtle'
            : 'bg-white border border-gray-100'
            }`}>
            {/* Gradient accent on hover - Red for distress, purple for normal */}
            <div className={`absolute inset-x-0 top-0 h-1 ${isUrgentItem
                ? 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500 opacity-100'
                : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100'
                } transition-opacity`} />

            {/* Discount Badge - Show if originalPriceCents exists */}
            {listing.originalPriceCents && listing.priceCents && listing.originalPriceCents > listing.priceCents && (
                <DiscountBadge
                    percentage={Math.round(((listing.originalPriceCents - listing.priceCents) / listing.originalPriceCents) * 100)}
                />
            )}

            {/* Badges Container - Top Left */}
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
                {/* Distress Sale Badge */}
                {listing.isDistressSale && (
                    <DistressBadge size="sm" />
                )}

                {/* Verified Seller Badge */}
                {(listing.seller?.verified || listing.seller?.isVerified) && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm text-blue-700 text-[10px] font-bold shadow-sm border border-blue-100">
                        <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified ID
                    </span>
                )}

                {/* Verified Brand Badge */}
                {listing.seller?.brandVerificationStatus === 'VERIFIED_BRAND' && (
                    <BrandBadge size="xs" />
                )}

                {/* Fully Booked Badge for Services */}
                {listing.type === 'SERVICE' && listing.isAvailable === false && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold shadow-sm">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        Fully Booked
                    </span>
                )}

                {/* Sold Out Badge for Products */}
                {listing.type === 'PHYSICAL' && (listing.quantity === 0 || listing.status === 'traded') && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-700/90 backdrop-blur-sm text-white text-[10px] font-bold shadow-sm">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        Sold Out
                    </span>
                )}
            </div>

            {/* Bookmark Button */}
            <div
                className="absolute top-2 right-2 z-10"
                onClick={(e) => e.preventDefault()}
            >
                <BookmarkButton listing={bookmarkData} />
            </div>

            {/* Link Wrapper or Div if ID invalid */}
            {isValidId ? (
                <Link href={`/listings/${listing.id}`} className="block h-full">
                    {renderCardContent()}
                </Link>
            ) : (
                <div className="block cursor-not-allowed opacity-75 h-full">
                    {renderCardContent()}
                </div>
            )}
        </div>
    );

    function renderCardContent() {
        return (
            <>
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

                    {/* Quick Access Actions Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center z-20">
                        <div onClick={(e) => e.preventDefault()}>
                            <ShareButton
                                url={typeof window !== 'undefined' ? `${window.location.origin}/listings/${listing.id}` : `https://barterwave.com/listings/${listing.id}`}
                                title={listing.title}
                                description={listing.description || listing.title}
                                imageUrl={listing.images?.[0]?.url}
                                price={listing.priceCents !== undefined ? `₦${(listing.priceCents / 100).toLocaleString()}` : 'N/A'}
                                allowCash={listing.allowCash}
                                allowBarter={listing.allowBarter}
                                className="bg-white/90 text-gray-700 p-2 rounded-full hover:bg-white transition shadow-sm"
                                iconOnly
                            />
                        </div>
                        <div onClick={(e) => e.preventDefault()}>
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
                                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition shadow-sm"
                                iconOnly
                            />
                        </div>
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
                                isBarterFriendly={listing.allowBarter}
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
                        {listing.seller?.tier === 'premium' && (
                            <PremiumBadge size="sm" />
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
            </>
        );
    }
}
