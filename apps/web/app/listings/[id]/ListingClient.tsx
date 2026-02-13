'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Listing } from '@/lib/types';
import { useAuthStore } from '@/lib/auth-store';
import { useOffersStore } from '@/lib/offers-store';
import { useListingsStore } from '@/lib/listings-store';
import MakeOfferModal from '@/components/MakeOfferModal';
import AddToCartButton from '@/components/AddToCartButton';
import BookmarkButton from '@/components/BookmarkButton';
import ShareButton from '@/components/ShareButton';
import ReviewList from '@/components/ReviewList';
import ReportModal from '@/components/ReportModal';
import VerificationBlockModal from '@/components/VerificationBlockModal';
import DistressBadge from '@/components/DistressBadge';
import PremiumBadge from '@/components/PremiumBadge';
import BrandBadge from '@/components/BrandBadge';
import { ChatLimitModal } from '@/components/PaywallModal';
import { checkChatLimit, initializePayment, redirectToPaystack } from '@/lib/payments-api';

interface ListingClientProps {
    listing: Listing;
}

export default function ListingClient({ listing }: ListingClientProps) {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const listingId = listing.id;

    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showReportModal, setShowReportModal] = useState(false);
    // listing is now a prop
    // const [isLoading, setIsLoading] = useState(true); // Removed
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [showChatLimitModal, setShowChatLimitModal] = useState(false);
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);

    const { makeOffer } = useOffersStore();
    const { listings } = useListingsStore();

    // Removed fetch logic


    // Track listing view for Aggressive Boost targeting
    useEffect(() => {
        const trackView = async () => {
            if (!listingId || !isAuthenticated) return;

            try {
                const { apiClient } = await import('@/lib/api-client');
                await apiClient.post(`/listings/${listingId}/view`);
            } catch (error) {
                // Silently fail - view tracking is not critical
                console.debug('View tracking failed:', error);
            }
        };

        // Slight delay to avoid tracking partial page loads
        const timer = setTimeout(trackView, 1000);
        return () => clearTimeout(timer);
    }, [listingId, isAuthenticated]);

    const formatPrice = (cents: number | undefined) => {
        if (cents === undefined) return 'N/A';
        return `₦${(cents / 100).toLocaleString()}`;
    };

    const handleMakeOffer = async (offerData: any) => {
        if (!listing) return;

        try {
            await makeOffer({
                targetListingId: listing.id,
                offeredItems: offerData.offeredItems,
                offeredCashCents: offerData.cashAmount ? offerData.cashAmount * 100 : undefined,
                message: offerData.message,
            });

            alert('Offer sent successfully! The seller will be notified.');
            setIsOfferModalOpen(false);
        } catch (error) {
            console.error('Failed to send offer:', error);
            alert('Failed to send offer. Please try again.');
        }
    };

    const handleContactSeller = async () => {
        if (!listing) return;
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Check chat limit
        try {
            const limitStatus = await checkChatLimit();
            if (!limitStatus.allowed) {
                setShowChatLimitModal(true);
                return;
            }
        } catch (error) {
            console.error('Failed to check chat limit:', error);
            // Allow proceeding on error (fail open)
        }

        router.push(`/messages/${listing.sellerId}`);
    };

    const handleChatPaywallSelect = async (optionId: string, currency: 'NGN' | 'USD') => {
        setIsPaymentLoading(true);
        try {
            const result = await initializePayment(optionId as any, undefined, currency);
            redirectToPaystack(result.authorizationUrl);
        } catch (error) {
            console.error('Payment initialization failed:', error);
            alert('Failed to initialize payment. Please try again.');
        } finally {
            setIsPaymentLoading(false);
        }
    };


    const isOwner = user?.id === listing.sellerId;
    const isUnavailable =
        (listing.type === 'SERVICE' && (listing as any).isAvailable === false) ||
        (listing.type === 'PHYSICAL' && (listing.quantity === 0 || listing.status === 'traded'));


    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Left Column - Images */}
                    <div>
                        {/* Main Image */}
                        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 mb-4 relative">
                            {listing.images[selectedImageIndex] ? (
                                <Image
                                    src={listing.images[selectedImageIndex].url}
                                    alt={listing.title}
                                    width={600}
                                    height={600}
                                    className="w-full aspect-square object-cover"
                                    priority
                                />
                            ) : (
                                <div className="w-full aspect-square flex items-center justify-center bg-slate-100">
                                    <span className="text-9xl">📦</span>
                                </div>
                            )}

                            {/* Distress Sale Badge - Top Left Corner */}
                            {(listing as any).isDistressSale && (
                                <div className="absolute top-4 left-4 z-10">
                                    <DistressBadge size="md" />
                                </div>
                            )}

                            {/* Share Button - Below Distress Badge if present */}
                            <div className={`absolute ${(listing as any).isDistressSale ? 'top-14' : 'top-4'} left-4`}>
                                <ShareButton
                                    url={typeof window !== 'undefined' ? window.location.href : `https://barterwave.com/listings/${listing.id}`}
                                    title={listing.title}
                                    description={listing.description}
                                    imageUrl={listing.images[0]?.url}
                                    price={formatPrice(listing.priceCents)}
                                    allowCash={listing.allowCash}
                                    allowBarter={listing.allowBarter}
                                    iconOnly
                                />
                            </div>
                            {/* Bookmark Button - Top Right */}
                            <div className="absolute top-4 right-4">
                                <BookmarkButton
                                    listing={{
                                        id: listing.id,
                                        title: listing.title,
                                        priceCents: listing.priceCents,
                                        currencyCode: listing.currencyCode || 'NGN',
                                        images: listing.images,
                                        sellerId: listing.sellerId,
                                        sellerName: listing.seller?.profile?.displayName || listing.seller?.email || 'Unknown Seller',
                                        location: listing.seller?.profile?.region?.name || '',
                                        bookmarkedAt: new Date().toISOString(),
                                    }}
                                />
                            </div>
                        </div>

                        {/* Thumbnail Images */}
                        {listing.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-3">
                                {listing.images.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImageIndex(index)}
                                        className={`rounded-lg overflow-hidden border-2 transition ${selectedImageIndex === index
                                            ? 'border-gray-900'
                                            : 'border-transparent hover:border-gray-300'
                                            }`}
                                    >
                                        <Image
                                            src={image.url}
                                            alt={`${listing.title} ${index + 1}`}
                                            width={150}
                                            height={150}
                                            className="w-full aspect-square object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Video Player */}
                        {listing.videoUrl && (
                            <div className="mt-4 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
                                <div className="p-3 bg-gray-50 border-b border-gray-200">
                                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Product Video
                                    </h3>
                                </div>
                                <div className="aspect-video bg-black">
                                    <video
                                        src={listing.videoUrl}
                                        controls
                                        className="w-full h-full"
                                        preload="metadata"
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Details */}
                    <div className="space-y-4">
                        {/* Title & Price Card */}
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <div className="flex items-start justify-between mb-3">
                                {listing.type !== 'SERVICE' && (
                                    <span
                                        className={`inline-block px-3 py-1 rounded-md text-xs font-bold ${listing.condition === 'new'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-slate-100 text-slate-700'
                                            }`}
                                    >
                                        {listing.condition === 'new' ? '✨ Brand New' : '📦 Used'}
                                    </span>
                                )}
                                <span className="text-xs text-gray-400">
                                    {new Date(listing.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <h1 className="text-xl font-bold text-gray-900 mb-3 leading-tight">{listing.title}</h1>

                            <div className="flex items-baseline gap-3 mb-3">
                                <div>
                                    {listing.allowBarter && (
                                        <span className="text-xs text-gray-500 block mb-0.5">Seller valued at</span>
                                    )}
                                    <span className="text-2xl font-bold text-gray-900">
                                        {formatPrice(listing.priceCents)}
                                    </span>
                                </div>
                                <span className="text-gray-500 text-sm">
                                    {listing.type === 'SERVICE'
                                        ? ((listing as any).isAvailable === false ? '🔴 Fully Booked' : '🟢 Available')
                                        : (listing.quantity > 1 ? `(${listing.quantity} available)` : '')}
                                </span>
                            </div>

                            {/* Downpayment Info */}
                            {(listing as any).downpaymentCents && (listing as any).downpaymentCents > 0 && (
                                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                    <span className="text-2xl">💰</span>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">
                                            Downpayment Required: {listing.downpaymentCurrency || listing.currencyCode} {((listing as any).downpaymentCents / 100).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-amber-800">
                                            A partial upfront payment is required by this verified brand.
                                        </p>
                                    </div>
                                </div>
                            )}


                            {/* Trade Options */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {listing.allowCash && (
                                    <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md text-xs font-bold border border-slate-200">
                                        💵 Cash
                                    </span>
                                )}
                                {listing.allowBarter && (
                                    <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md text-xs font-bold border border-slate-200 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7H4m0 0l4-4m-4 4l4 4m0 6h12m0 0l-4 4m4-4l-4-4" />
                                        </svg>
                                        Barter
                                    </span>
                                )}
                                {listing.allowCashPlusBarter && (
                                    <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md text-xs font-bold border border-slate-200">
                                        💰 Both
                                    </span>
                                )}
                            </div>

                            {/* Barter Preferences Display */}
                            {listing.allowBarter && ((listing as any).barterPreference1 || (listing as any).barterPreference2 || (listing as any).barterPreference3) && (
                                <div className="mb-6 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                    {/* Header */}
                                    <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7H4m0 0l4-4m-4 4l4 4m0 6h12m0 0l-4 4m4-4l-4-4" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-sm">
                                                        {(listing as any).barterPreferencesOnly
                                                            ? "Accepted Trade Items"
                                                            : "Preferred Trade Items"}
                                                    </h4>
                                                    <p className="text-xs text-gray-500">
                                                        {(listing as any).barterPreferencesOnly
                                                            ? "Seller only accepts these items"
                                                            : "Seller is looking for these items"}
                                                    </p>
                                                </div>
                                            </div>
                                            {(listing as any).barterPreferencesOnly && (
                                                <span className="px-2.5 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wide shadow-sm">
                                                    Strict
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div className="p-4">
                                        <div className="flex flex-wrap gap-2">
                                            {(listing as any).barterPreference1 && (
                                                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100 group hover:border-indigo-200 hover:shadow-sm transition">
                                                    <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">1</span>
                                                    <span className="text-sm font-medium text-gray-800 capitalize">{(listing as any).barterPreference1}</span>
                                                </div>
                                            )}
                                            {(listing as any).barterPreference2 && (
                                                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100 group hover:border-purple-200 hover:shadow-sm transition">
                                                    <span className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-bold">2</span>
                                                    <span className="text-sm font-medium text-gray-800 capitalize">{(listing as any).barterPreference2}</span>
                                                </div>
                                            )}
                                            {(listing as any).barterPreference3 && (
                                                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-100 group hover:border-pink-200 hover:shadow-sm transition">
                                                    <span className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-xs font-bold">3</span>
                                                    <span className="text-sm font-medium text-gray-800 capitalize">{(listing as any).barterPreference3}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info Footer */}
                                        {!(listing as any).barterPreferencesOnly && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                                    <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                    </svg>
                                                    <span>These are preferences — you can also offer other items the seller might like</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="pb-6 border-b border-gray-100"></div>

                            {/* Unavailable Banner */}
                            {isUnavailable && !isOwner && (
                                <div className={`p-4 rounded-xl flex items-center gap-3 mb-4 ${listing.type === 'SERVICE'
                                    ? 'bg-red-50 border border-red-200'
                                    : 'bg-gray-100 border border-gray-300'
                                    }`}>
                                    <span className="text-2xl">{listing.type === 'SERVICE' ? '🚫' : '📦'}</span>
                                    <div>
                                        <p className={`font-bold text-sm ${listing.type === 'SERVICE' ? 'text-red-700' : 'text-gray-700'
                                            }`}>
                                            {listing.type === 'SERVICE' ? 'Fully Booked' : 'Sold Out'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {listing.type === 'SERVICE'
                                                ? 'This service provider is currently unavailable for new bookings.'
                                                : 'This product is no longer available.'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {!isOwner ? (
                                listing.status === 'active' && !isUnavailable ? (
                                    <div className="space-y-3">

                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => {
                                                    if (!isAuthenticated) {
                                                        router.push('/login');
                                                        return;
                                                    }
                                                    if (user && !user.isVerified) {
                                                        setShowVerificationModal(true);
                                                    } else {
                                                        setIsOfferModalOpen(true);
                                                    }
                                                }}
                                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-sm hover:shadow-md"
                                            >
                                                Make Offer
                                            </button>
                                            <AddToCartButton
                                                listing={{
                                                    id: listing.id,
                                                    title: listing.title,
                                                    priceCents: listing.priceCents,
                                                    currency: listing.currencyCode || 'NGN',
                                                    images: listing.images,
                                                    sellerId: listing.sellerId,
                                                    sellerName: listing.seller?.profile?.displayName || listing.seller?.email || 'Unknown Seller',
                                                    allowCash: listing.allowCash,
                                                    quantity: listing.quantity,
                                                }}
                                                className="px-6 py-3 rounded-lg font-bold shadow-sm border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                                            />
                                        </div>
                                        <button
                                            onClick={handleContactSeller}
                                            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-slate-50 hover:border-gray-400 transition"
                                        >
                                            💬 Message Seller
                                        </button>
                                        {/* WhatsApp Button for Verified Brands */}
                                        {(listing.seller as any).brandVerificationStatus === 'VERIFIED_BRAND' && (listing.seller as any).brandWhatsApp && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <a
                                                    href={`tel:${(listing.seller as any).brandWhatsApp.replace(/[^0-9+]/g, '')}`}
                                                    className="px-6 py-3 bg-white border-2 border-green-600 text-green-700 rounded-lg font-bold hover:bg-green-50 transition flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    Call Seller
                                                </a>
                                                <a
                                                    href={`https://wa.me/${(listing.seller as any).brandWhatsApp.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(`Hi, I'm interested in your listing "${listing.title}" on BarterWave`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                                    WhatsApp
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ) : !isUnavailable ? (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-red-700 font-bold text-center text-sm">⚠️ This listing is unavailable</p>
                                    </div>
                                ) : null
                            ) : (
                                <div className="bg-slate-50 border border-gray-200 rounded-lg p-4">
                                    <p className="text-gray-600 font-bold text-center text-sm">✓ This is your listing</p>
                                </div>
                            )}
                        </div>

                        {/* Barter Preferences (if applicable) */}
                        {listing.allowBarter && listing.preferredBarterNotes && (
                            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7H4m0 0l4-4m-4 4l4 4m0 6h12m0 0l-4 4m4-4l-4-4" />
                                    </svg>
                                    Barter Preferences
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed">{listing.preferredBarterNotes}</p>
                            </div>
                        )}

                        {/* Seller Info Card */}
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Seller Information</h3>
                            <div className="flex items-start gap-4 mb-4">
                                <button
                                    onClick={() => router.push(`/listings?sellerId=${listing.sellerId}&countryId=${listing.countryId || 1}`)}
                                    className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-gray-600 font-bold text-xl hover:ring-2 hover:ring-blue-500 transition cursor-pointer"
                                >
                                    {(listing.seller?.profile?.displayName || listing.seller?.email || 'S').charAt(0).toUpperCase()}
                                </button>
                                <div className="flex-1">
                                    <button
                                        onClick={() => router.push(`/listings?sellerId=${listing.sellerId}&countryId=${listing.countryId || 1}`)}
                                        className="font-bold text-gray-900 text-base hover:text-blue-600 hover:underline transition cursor-pointer text-left flex items-center gap-1.5"
                                    >
                                        {listing.seller?.profile?.displayName || listing.seller?.email || 'Unknown Seller'}
                                        {/* Premium Badge - Twitter/Instagram style */}
                                        {(listing.seller as any).tier === 'premium' && (
                                            <PremiumBadge size="sm" />
                                        )}
                                        {(listing.seller as any).brandVerificationStatus === 'VERIFIED_BRAND' && (
                                            <BrandBadge size="xs" />
                                        )}
                                    </button>
                                    <p className="text-xs text-green-600 font-bold flex items-center gap-1 mt-0.5">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Verified ID
                                    </p>
                                    {listing.seller?.profile?.region && (
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                            </svg>
                                            {listing.seller?.profile?.region?.name || 'Unknown'}
                                        </p>
                                    )}
                                    {/* Brand Physical Address */}
                                    {(listing.seller as any).brandVerificationStatus === 'VERIFIED_BRAND' && (listing.seller as any).brandPhysicalAddress && (
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                            <svg className="w-3 h-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            {(listing.seller as any).brandPhysicalAddress}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Seller Metrics */}
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                                <div className="text-center">
                                    <p className="text-lg font-bold text-gray-900">{(listing.seller?.profile as any)?.rating || 4.8}</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Rating</p>
                                </div>
                                <div className="text-center border-l border-r border-gray-100">
                                    <p className="text-lg font-bold text-gray-900">{(listing.seller?.profile as any)?.reviewCount || 12}</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Reviews</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-gray-900">{(listing.seller?.profile as any)?.responseRate || 95}%</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Response</p>
                                </div>
                            </div>
                        </div>

                        {/* Description Card - EXPANDABLE */}
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <button
                                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                className="w-full text-left flex items-center justify-between mb-3"
                            >
                                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Product Description</h3>
                                <svg
                                    className={`w-4 h-4 text-gray-400 transition-transform ${isDescriptionExpanded ? 'rotate-180' : ''
                                        }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>
                            <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                {listing.description ? (
                                    <>
                                        {isDescriptionExpanded
                                            ? listing.description
                                            : listing.description.length > 150
                                                ? `${listing.description.substring(0, 150)}...`
                                                : listing.description}
                                        {listing.description.length > 150 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsDescriptionExpanded(!isDescriptionExpanded);
                                                }}
                                                className="text-gray-900 hover:text-black font-bold text-xs ml-1 hover:underline"
                                            >
                                                {isDescriptionExpanded ? 'See less' : 'See more'}
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    'No description provided'
                                )}
                            </div>
                        </div>

                        {/* Product/Service Details Card */}
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
                                {listing.type === 'SERVICE' ? 'Service Details' : 'Product Details'}
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-500">Type</span>
                                    <span className="font-bold text-gray-900">
                                        {listing.type === 'SERVICE' ? '🛠️ Service' : '📦 Product'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-500">Category</span>
                                    <span className="font-bold text-gray-900">{listing.category.name}</span>
                                </div>
                                {listing.type !== 'SERVICE' && (
                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                        <span className="text-gray-500">Condition</span>
                                        <span className="font-bold text-gray-900 capitalize">{listing.condition}</span>
                                    </div>
                                )}
                                {listing.type === 'PHYSICAL' && (
                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                        <span className="text-gray-500">Quantity Available</span>
                                        <span className="font-bold text-gray-900">{listing.quantity}</span>
                                    </div>
                                )}
                                {listing.type === 'SERVICE' && (
                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                        <span className="text-gray-500">Availability</span>
                                        <span className={`font-bold ${(listing as any).isAvailable !== false ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {(listing as any).isAvailable !== false ? '✓ Available' : '✗ Fully Booked'}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-500">Status</span>
                                    <span
                                        className={`font-bold ${listing.status === 'active' ? 'text-green-600'
                                            : listing.status === 'traded' ? 'text-purple-600'
                                                : 'text-gray-600'
                                            }`}
                                    >
                                        {listing.status === 'active' ? '✓ Available'
                                            : listing.status === 'traded' ? '🤝 Traded'
                                                : listing.status}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-gray-500">Shipping</span>
                                    <span className="font-bold text-gray-900">
                                        {listing.shippingMeetInPerson && listing.shippingShipItem
                                            ? 'Meet-up or Shipping'
                                            : listing.shippingMeetInPerson
                                                ? 'Meet-up only'
                                                : 'Shipping only'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Safety Tips */}
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-3 text-center text-sm">Safety tips</h3>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-2 px-2">
                                <li>Avoid paying in advance, even for delivery</li>
                                <li>Meet with the seller at a safe public place</li>
                                <li>First, check what you're going to buy to make sure it's what you need</li>
                                <li>Only pay if you're satisfied</li>
                            </ul>
                        </div>

                        {/* Post Ad Like This Button */}
                        <button
                            onClick={() => router.push('/create')}
                            className="w-full py-3.5 bg-white border-2 border-blue-500 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition shadow-sm uppercase text-sm tracking-wide"
                        >
                            Post Ad Like This
                        </button>

                        {/* Report Button */}
                        <button
                            onClick={() => setShowReportModal(true)}
                            className="w-full px-4 py-3 text-red-600 hover:text-red-700 font-medium text-xs flex items-center justify-center gap-2 border border-red-100 rounded-lg hover:bg-red-50 transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                            Report Incorrect Product Information
                        </button>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-8 container mx-auto px-4 max-w-7xl">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Reviews</h2>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <ReviewList listingId={listing.id} />
                </div>
            </div>


            {/* Make Offer Modal */}
            <MakeOfferModal
                isOpen={isOfferModalOpen}
                onClose={() => setIsOfferModalOpen(false)}
                listing={{
                    id: listing.id,
                    title: listing.title,
                    image: listing.images[0]?.url || '',
                    sellerName: listing.seller?.profile?.displayName || listing.seller?.email || 'Unknown Seller',
                    sellerLocation: listing.seller?.profile?.region?.name || 'Unknown',
                    allowCash: listing.allowCash,
                    allowBarter: listing.allowBarter,
                    allowCashPlusBarter: listing.allowCashPlusBarter,
                    downpaymentCents: (listing as any).downpaymentCents ? Number((listing as any).downpaymentCents) : undefined,
                    currencyCode: listing.currencyCode || 'NGN',
                }}
                onSubmit={handleMakeOffer}
            />

            {/* Report Modal */}
            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                listingId={listing.id}
            />

            <VerificationBlockModal
                isOpen={showVerificationModal}
                onClose={() => setShowVerificationModal(false)}
            />

            {/* Chat Limit Paywall Modal */}
            <ChatLimitModal
                isOpen={showChatLimitModal}
                onClose={() => setShowChatLimitModal(false)}
                onSelectOption={handleChatPaywallSelect}
                isLoading={isPaymentLoading}
            />

        </div>
    );
}
