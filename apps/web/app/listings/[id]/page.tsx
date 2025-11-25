'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function ListingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const listingId = params.id as string;

    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showReportModal, setShowReportModal] = useState(false);
    const [listing, setListing] = useState<Listing | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    const { makeOffer } = useOffersStore();
    const { listings } = useListingsStore();

    // Get listing from mock data
    useEffect(() => {
        const foundListing = listings.find(l => l.id === listingId);
        setListing(foundListing || null);
        setIsLoading(false);
    }, [listingId, listings]);

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

    const handleContactSeller = () => {
        if (!listing) return;
        router.push(`/messages/${listing.sellerId}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading listing...</p>
                </div>
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Listing not found</h2>
                    <button
                        onClick={() => router.push('/listings')}
                        className="text-primary hover:text-primary-dark font-medium"
                    >
                        ← Back to listings
                    </button>
                </div>
            </div>
        );
    }

    const isOwner = user?.id === listing.sellerId;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
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

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Column - Images */}
                    <div>
                        {/* Main Image */}
                        <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200 mb-4 relative">
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
                                <div className="w-full aspect-square flex items-center justify-center bg-gray-100">
                                    <span className="text-9xl">📦</span>
                                </div>
                            )}
                            {/* Share Button - Top Left */}
                            <div className="absolute top-4 left-4">
                                <ShareButton
                                    url={typeof window !== 'undefined' ? window.location.href : `https://tradeplus.com/listings/${listing.id}`}
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
                                        sellerName: listing.seller.profile?.displayName || listing.seller.email,
                                        location: listing.seller.profile?.region?.name || '',
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
                                        className={`rounded-xl overflow-hidden border-2 transition ${selectedImageIndex === index
                                            ? 'border-primary'
                                            : 'border-gray-200 hover:border-primary-light'
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
                    </div>

                    {/* Right Column - Details */}
                    <div className="space-y-6">
                        {/* Title & Price Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
                            <div className="flex items-start justify-between mb-4">
                                {listing.type !== 'SERVICE' && (
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${listing.condition === 'new'
                                            ? 'bg-green-100 text-green-800 border-green-200'
                                            : 'bg-gray-100 text-gray-800 border-gray-200'
                                            }`}
                                    >
                                        {listing.condition === 'new' ? '✨ Brand New' : '📦 Used'}
                                    </span>
                                )}
                                <span className="text-xs text-gray-500">
                                    Listed {new Date(listing.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <h1 className="text-3xl font-bold text-gray-900 mb-4">{listing.title}</h1>

                            <div className="flex items-baseline gap-3 mb-6">
                                <span className="text-4xl font-bold text-primary">
                                    {formatPrice(listing.priceCents)}
                                </span>
                                <span className="text-gray-500 text-sm">
                                    {listing.quantity > 1 && `(${listing.quantity} available)`}
                                </span>
                            </div>

                            {/* Trade Options */}
                            <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-gray-200">
                                {listing.allowCash && (
                                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-bold border border-green-200">
                                        💵 Cash Payment
                                    </span>
                                )}
                                {listing.allowBarter && (
                                    <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-bold border border-purple-200 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7H4m0 0l4-4m-4 4l4 4m0 6h12m0 0l-4 4m4-4l-4-4" />
                                        </svg>
                                        Barter Trade
                                    </span>
                                )}
                                {listing.allowCashPlusBarter && (
                                    <span className="px-4 py-2 bg-blue-50 text-blue-800 rounded-full text-sm font-bold border border-blue-200">
                                        💰 Cash + Barter
                                    </span>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {!isOwner ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => {
                                                if (user && !user.isVerified) {
                                                    setShowVerificationModal(true);
                                                } else {
                                                    setIsOfferModalOpen(true);
                                                }
                                            }}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-md hover:shadow-lg"
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
                                                sellerName: listing.seller.profile?.displayName || listing.seller.email,
                                                allowCash: listing.allowCash,
                                                quantity: listing.quantity,
                                            }}
                                            className="px-6 py-3 rounded-xl font-bold shadow-md"
                                        />
                                    </div>
                                    <button
                                        onClick={handleContactSeller}
                                        className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-400 transition"
                                    >
                                        💬 Message Seller
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                                    <p className="text-primary-dark font-bold text-center">✓ This is your listing</p>
                                </div>
                            )}
                        </div>

                        {/* Barter Preferences (if applicable) */}
                        {listing.allowBarter && listing.preferredBarterNotes && (
                            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6">
                                <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7H4m0 0l4-4m-4 4l4 4m0 6h12m0 0l-4 4m4-4l-4-4" />
                                    </svg>
                                    Seller's Barter Preferences
                                </h3>
                                <p className="text-purple-800 leading-relaxed">{listing.preferredBarterNotes}</p>
                            </div>
                        )}

                        {/* Seller Info Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-4 text-lg">Seller Information</h3>
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-2xl shadow-md">
                                    {(listing.seller.profile?.displayName || listing.seller.email).charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900 text-lg">
                                        {listing.seller.profile?.displayName || listing.seller.email}
                                    </p>
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Verified Seller
                                    </p>
                                    {listing.seller.profile?.region && (
                                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                            {listing.seller.profile.region.name}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Seller Metrics */}
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-primary">{(listing.seller.profile as any)?.rating || 4.8}</p>
                                    <p className="text-xs text-gray-600 mt-1">Rating</p>
                                </div>
                                <div className="text-center border-l border-r border-gray-200">
                                    <p className="text-2xl font-bold text-primary">{(listing.seller.profile as any)?.reviewCount || 12}</p>
                                    <p className="text-xs text-gray-600 mt-1">Reviews</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-primary">{(listing.seller.profile as any)?.responseRate || 95}%</p>
                                    <p className="text-xs text-gray-600 mt-1">Response</p>
                                </div>
                            </div>
                        </div>

                        {/* Description Card - EXPANDABLE */}
                        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
                            <button
                                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                className="w-full text-left flex items-center justify-between mb-4"
                            >
                                <h3 className="font-bold text-gray-900 text-lg">Product Description</h3>
                                <svg
                                    className={`w-5 h-5 text-gray-600 transition-transform ${isDescriptionExpanded ? 'rotate-180' : ''
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
                            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
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
                                                className="text-primary hover:text-primary-dark font-medium ml-2 mt-2 block"
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

                        {/* Product Details Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-4 text-lg">Product Details</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-600 font-medium">Category</span>
                                    <span className="font-bold text-gray-900">{listing.category.name}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-600 font-medium">Condition</span>
                                    <span className="font-bold text-gray-900 capitalize">{listing.condition}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-600 font-medium">Quantity Available</span>
                                    <span className="font-bold text-gray-900">{listing.quantity}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-600 font-medium">Status</span>
                                    <span
                                        className={`font-bold ${listing.status === 'active' ? 'text-green-600' : 'text-gray-600'
                                            }`}
                                    >
                                        {listing.status === 'active' ? '✓ Available' : listing.status}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-gray-600 font-medium">Shipping</span>
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

                        {/* Report Button */}
                        <button
                            onClick={() => setShowReportModal(true)}
                            className="w-full px-4 py-3 text-red-600 hover:text-red-700 font-medium text-sm flex items-center justify-center gap-2 border border-red-200 rounded-xl hover:bg-red-50 transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>
                <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
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
                    sellerName: listing.seller.profile?.displayName || listing.seller.email,
                    sellerLocation: listing.seller.profile?.region?.name || 'Unknown',
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
        </div >
    );
}
