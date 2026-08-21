'use client';

import Link from 'next/link';
import Image from 'next/image';
import BookmarkButton from './BookmarkButton';
import AddToCartButton from './AddToCartButton';
import ShareButton from './ShareButton';
import DistressBadge from './DistressBadge';
import StarRating from './StarRating';
import PriceDisplay from './PriceDisplay';
import PremiumBadge from './PremiumBadge';
import BrandBadge from './BrandBadge';
import { sanitizeUrl } from '@/lib/utils';
import type { Listing } from '@/lib/types';
import type { BookmarkedListing } from '@/lib/bookmarks-store';
import { MapPin, Repeat, Check, ShieldCheck } from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing: initialListing }: ListingCardProps) {
  const listing = {
    ...initialListing,
    images:
      initialListing.images?.map((img) => ({
        ...img,
        url: sanitizeUrl(img.url),
      })) || [],
  };

  const bookmarkData: BookmarkedListing = {
    id: listing.id,
    title: listing.title,
    priceCents: listing.priceCents,
    currencyCode: listing.currencyCode || 'NGN',
    images: listing.images || [],
    sellerId: listing.sellerId,
    sellerName: listing.seller?.profile?.displayName || listing.seller?.email || 'Unknown',
    location: listing.seller?.profile?.region?.name || '',
    bookmarkedAt: new Date().toISOString(),
  };

  const extractLocationDisplay = (address?: string, stateName?: string) => {
    if (!address) return stateName || null;
    const parts = address.split(',').map((p) => p.trim());
    const city = parts[0];
    if (stateName) {
      return `${city}, ${stateName}`;
    }
    if (parts.length >= 2) {
      const state = parts[1];
      return `${city}, ${state}`;
    }
    return city || null;
  };

  const getLocationDisplay = () => {
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
    const location = extractLocationDisplay(listing.seller?.locationAddress);
    if (location) {
      return location;
    }
    return null;
  };

  const locationDisplay = getLocationDisplay();
  const isUrgentItem = listing.isDistressSale;
  const isValidId = listing.id && listing.id !== 'undefined';

  return (
    <div
      className={`rounded-lg border bg-white shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group relative overflow-hidden flex flex-col justify-between ${
        isUrgentItem ? 'border-orange-300 ring-1 ring-orange-200' : 'border-slate-200'
      }`}
    >
      {/* Top Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start pointer-events-none">
        {listing.isDistressSale && <DistressBadge size="sm" />}

        {listing.seller?.isVerified && (
          <div
            className="bg-blue-600 text-white rounded p-1 shadow-xs flex items-center justify-center"
            title="Verified Seller"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        )}

        {listing.seller?.brandVerificationStatus === 'VERIFIED_BRAND' && (
          <BrandBadge size="xs" />
        )}

        {listing.type === 'SERVICE' && listing.isAvailable === false && (
          <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold uppercase tracking-wider shadow-xs">
            Fully Booked
          </span>
        )}

        {listing.type === 'PHYSICAL' &&
          (listing.quantity === 0 || listing.status === 'traded') && (
            <span className="px-2 py-0.5 rounded bg-slate-800 text-white text-[9px] font-bold uppercase tracking-wider shadow-xs">
              Sold Out
            </span>
          )}
      </div>

      {/* Bookmark Button */}
      <div
        className="absolute top-2 right-2 z-40"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <BookmarkButton listing={bookmarkData} />
      </div>

      {/* Clickable Card Link */}
      {isValidId && (
        <Link
          href={`/listings/${listing.id}`}
          prefetch={true}
          className="absolute inset-0 z-30"
          aria-label={`View ${listing.title}`}
        />
      )}

      {/* Product Image */}
      <div className="relative overflow-hidden h-44 sm:h-48 bg-slate-100 border-b border-slate-100">
        {listing.images?.[0] ? (
          <Image
            src={sanitizeUrl(listing.images[0].url)}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            priority={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <span className="text-3xl">📦</span>
          </div>
        )}

        {/* Quick Access Overlay (Desktop Hover) */}
        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-slate-950/70 to-transparent opacity-0 transition-opacity flex justify-between items-center z-40 pointer-events-none hidden md:flex md:group-hover:opacity-100 md:group-hover:pointer-events-auto">
          <div
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="pointer-events-auto"
          >
            <ShareButton
              url={
                typeof window !== 'undefined'
                  ? `${window.location.origin}/listings/${listing.id}`
                  : `https://barterwave.com/listings/${listing.id}`
              }
              title={listing.title}
              description={listing.description || listing.title}
              imageUrl={listing.images?.[0]?.url}
              price={
                listing.priceCents !== undefined
                  ? `₦${(listing.priceCents / 100).toLocaleString()}`
                  : 'N/A'
              }
              allowCash={listing.allowCash}
              allowBarter={listing.allowBarter}
              className="bg-white/95 text-slate-700 p-1.5 rounded-md hover:bg-white transition-colors shadow-xs"
              iconOnly
            />
          </div>
          <div
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="pointer-events-auto"
          >
            <AddToCartButton
              listing={{
                id: listing.id,
                title: listing.title,
                priceCents: listing.priceCents,
                currency: listing.currencyCode || 'NGN',
                images: listing.images || [],
                sellerId: listing.sellerId,
                sellerName:
                  listing.seller?.profile?.displayName || listing.seller?.email || 'Unknown',
                allowCash: listing.allowCash ?? true,
                allowBarter: listing.allowBarter,
                quantity: listing.quantity || 1,
              }}
              className="bg-blue-600 text-white p-1.5 rounded-md hover:bg-blue-700 transition-colors shadow-xs"
              iconOnly
            />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
            {listing.title}
          </h3>

          {listing.description && (
            <p className="text-slate-500 text-[11px] mt-1 line-clamp-2 leading-relaxed">
              {listing.description}
            </p>
          )}

          {listing.priceCents !== undefined && (
            <div className="mt-2">
              <PriceDisplay
                priceCents={listing.priceCents}
                size="sm"
                isBarterFriendly={listing.allowBarter}
              />
            </div>
          )}

          {/* Star Rating */}
          {listing.seller?.profile?.rating !== undefined &&
            (listing.seller?.profile?.rating ?? 0) > 0 && (
              <div className="mt-1.5 flex items-center">
                <StarRating
                  rating={listing.seller.profile.rating}
                  showNumber={false}
                  size="sm"
                />
                {listing.seller?.profile?.reviewCount !== undefined &&
                  listing.seller.profile.reviewCount > 0 && (
                    <span className="text-[10px] text-slate-400 ml-1 font-semibold">
                      ({listing.seller.profile.reviewCount})
                    </span>
                  )}
              </div>
            )}

          {/* Location */}
          <div className="flex items-center gap-1.5 mt-2 text-slate-500 text-[11px]">
            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="truncate">{locationDisplay || 'Location not set'}</span>
            {listing.seller?.tier === 'premium' && <PremiumBadge size="sm" />}
          </div>
        </div>

        {/* Trade Modes (Clean Sharp Chips - Zero Emojis) */}
        <div className="flex gap-1.5 flex-wrap mt-3 pt-2.5 border-t border-slate-100">
          {listing.allowCash && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded">
              Cash
            </span>
          )}
          {listing.allowBarter && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded flex items-center gap-1">
              <Repeat className="w-2.5 h-2.5" />
              Barter
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
