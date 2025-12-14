'use client';

import Image from 'next/image';
import { BarterOffer } from '@/lib/types';

interface OfferCardProps {
    offer: BarterOffer;
    type: 'received' | 'sent' | 'history';
    onAccept?: (id: string) => void;
    onReject?: (id: string) => void;
    onCounter?: (offer: BarterOffer) => void;
    onWithdraw?: (id: string) => void;
    onAcceptCounter?: (id: string) => void;
    onMessage?: (offer: BarterOffer) => void;
    onConfirm?: (id: string) => void;
    onViewReceipt?: (offer: BarterOffer) => void;
    currentUserId?: string;
}

export default function OfferCard({ offer, type, onAccept, onReject, onCounter, onWithdraw, onAcceptCounter, onMessage, onConfirm, onViewReceipt, currentUserId }: OfferCardProps) {
    const getTimeAgo = (timestamp: string) => {
        const date = new Date(timestamp);
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const getStatusBadge = () => {
        const badges: Record<string, string> = {
            pending: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md',
            accepted: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md',
            rejected: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md',
            countered: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md',
            withdrawn: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-md',
            cancelled: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-md',
        };
        return badges[offer.status] || badges.pending;
    };

    const getStatusText = () => {
        return offer.status.charAt(0).toUpperCase() + offer.status.slice(1);
    };

    const buyerName = offer.buyer.profile?.displayName || offer.buyer.email;
    const sellerName = offer.seller.profile?.displayName || offer.seller.email;
    const buyerLocation = offer.buyer.profile?.region?.name || 'Unknown Location';
    const sellerLocation = offer.seller.profile?.region?.name || 'Unknown Location';

    const hasCash = (offer.offeredCashCents || 0) > 0;
    const hasItems = (offer.items || []).length > 0;

    let offerType = 'cash';
    if (hasCash && hasItems) offerType = 'both';
    else if (hasItems) offerType = 'barter';

    const barterItemsText = offer.items?.map(item => `${item.quantity}x ${item.offeredListing?.title || 'Item'}`).join(', ');

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
            {/* Header with Listing Info */}
            <div className="flex gap-4 p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <Image
                    src={offer.listing.images[0]?.url || ''}
                    alt={offer.listing.title}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-xl object-cover shadow-md ring-2 ring-white"
                />
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg mb-1.5 truncate">
                        {offer.listing.title}
                    </h3>
                    {type === 'received' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            Your Listing
                        </span>
                    )}
                    {type === 'sent' && (
                        <p className="text-sm text-gray-600 font-medium mb-2">Listed by {sellerName}</p>
                    )}
                    {/* Timestamp */}
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {type === 'sent' ? 'Sent' : 'Received'} {getTimeAgo(offer.createdAt)}
                    </p>
                </div>
                {type === 'sent' && (
                    <span className={`px-3.5 py-1.5 rounded-xl text-xs font-bold h-fit shadow-sm ${getStatusBadge()}`}>
                        {getStatusText()}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
                {/* User Info */}
                {type === 'received' && (
                    <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white">
                            {buyerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-gray-900 text-base mb-1">{buyerName} wants to trade</p>
                            <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {buyerLocation}
                            </p>
                        </div>
                    </div>
                )}

                {type === 'sent' && (
                    <p className="text-sm text-gray-600 flex items-center gap-1.5 px-3 py-2 bg-gray-50 rounded-lg">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">{sellerLocation}</span>
                    </p>
                )}

                {/* Offer Details */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-bold text-blue-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {type === 'received' ? 'Offer Details' : 'Your Offer'}
                    </p>
                    <div className="space-y-2 text-sm">
                        {offerType === 'cash' && (
                            <div className="flex items-start gap-2">
                                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <p className="font-bold text-gray-900 flex-1">
                                    Offering <span className="text-green-600">{offer.currencyCode} {((offer.offeredCashCents || 0) / 100).toLocaleString()}</span> cash
                                </p>
                            </div>
                        )}
                        {offerType === 'barter' && (
                            <div className="flex items-start gap-2">
                                <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                                    </svg>
                                </div>
                                <p className="font-bold text-gray-900 flex-1">
                                    Trade for: <span className="text-purple-600">{barterItemsText}</span>
                                </p>
                            </div>
                        )}
                        {offerType === 'both' && (
                            <>
                                <div className="flex items-start gap-2">
                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="font-bold text-gray-900 flex-1">
                                        Cash: <span className="text-green-600">{offer.currencyCode} {((offer.offeredCashCents || 0) / 100).toLocaleString()}</span>
                                    </p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                                        </svg>
                                    </div>
                                    <p className="font-bold text-gray-900 flex-1">
                                        Plus: <span className="text-purple-600">{barterItemsText}</span>
                                    </p>
                                </div>
                            </>
                        )}
                        {offer.message && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                                <p className="text-gray-700 text-sm italic leading-relaxed bg-white p-3 rounded-lg border border-blue-100">
                                    <span className="font-semibold not-italic text-blue-700">💬 Message: </span>"{offer.message}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                {type === 'received' && offer.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={() => onAccept?.(offer.id)}
                            className="px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-sm hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            Accept
                        </button>
                        <button
                            onClick={() => onReject?.(offer.id)}
                            className="px-4 py-3 bg-white border-2 border-red-500 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject
                        </button>
                        <button
                            onClick={() => onCounter?.(offer)}
                            className="px-4 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Counter
                        </button>
                        <button
                            onClick={() => onMessage?.(offer)}
                            className="px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Message
                        </button>
                    </div>
                )}

                {type === 'sent' && offer.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={() => onWithdraw?.(offer.id)}
                            className="px-4 py-3 bg-white border-2 border-red-500 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                        >
                            Withdraw Offer
                        </button>
                        <button
                            onClick={() => onMessage?.(offer)}
                            className="px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                        >
                            💬 Message Seller
                        </button>
                    </div>
                )}

                {/* Accepted Offers - Prominent Start Chat */}
                {type === 'sent' && offer.status === 'accepted' && (
                    <div className="pt-2">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-3">
                            <p className="text-green-800 font-bold flex items-center gap-2 mb-1">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Offer Accepted! 🎉
                            </p>
                            <p className="text-green-700 text-sm">Connect now to arrange the exchange.</p>
                        </div>
                        <button
                            onClick={() => onMessage?.(offer)}
                            className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-base hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Start Chatting with Seller
                        </button>
                    </div>
                )}

                {type === 'sent' && offer.status === 'countered' && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={() => onAcceptCounter?.(offer.id)}
                            className="px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-sm hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
                        >
                            Accept Counter
                        </button>
                        <button className="px-4 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all shadow-sm hover:shadow-md">
                            Make New Offer
                        </button>
                    </div>
                )}

                {type === 'history' && (
                    <div className="flex flex-col gap-3 pt-2">
                        {offer.status === 'accepted' && (
                            <button
                                onClick={() => onMessage?.(offer)}
                                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Chat with Partner
                            </button>
                        )}
                        <div className="flex gap-3">
                            <button className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-sm hover:shadow-md">
                                View Details
                            </button>
                            {offer.status === 'accepted' && (
                                <button className="flex-1 px-4 py-3 bg-white border-2 border-purple-500 text-purple-600 rounded-xl font-bold text-sm hover:bg-purple-50 transition-all shadow-sm hover:shadow-md">
                                    Leave Review
                                </button>
                            )}
                        </div>

                        {/* Receipt Logic */}
                        {offer.status === 'accepted' && (
                            <div className="pt-3 border-t border-gray-100">
                                {(() => {
                                    const isSeller = offer.sellerId === currentUserId;
                                    const isBuyer = offer.buyerId === currentUserId;
                                    const hasConfirmed = isSeller ? offer.listingOwnerConfirmedAt : offer.offerMakerConfirmedAt;
                                    const partnerConfirmed = isSeller ? offer.offerMakerConfirmedAt : offer.listingOwnerConfirmedAt;

                                    if (!hasConfirmed) {
                                        return (
                                            <button
                                                onClick={() => onConfirm?.(offer.id)}
                                                className="w-full px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-2 border-green-200 rounded-xl font-bold text-sm hover:from-green-100 hover:to-emerald-100 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Confirm Item Received
                                            </button>
                                        );
                                    }

                                    // Status Message
                                    if (hasConfirmed && !partnerConfirmed) {
                                        return (
                                            <div className="text-center p-3 bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-800 rounded-xl text-sm font-semibold border border-yellow-200">
                                                Waiting for partner to confirm...
                                            </div>
                                        );
                                    }

                                    // Receipt Timer / Button
                                    if (hasConfirmed && partnerConfirmed) {
                                        const availableAt = offer.receiptAvailableAt ? new Date(offer.receiptAvailableAt) : null;
                                        const now = new Date();
                                        const isAvailable = availableAt && now >= availableAt;

                                        if (isAvailable) {
                                            return (
                                                <button
                                                    onClick={() => onViewReceipt?.(offer)}
                                                    className="w-full px-4 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl font-bold text-sm hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    View Official Receipt
                                                </button>
                                            );
                                        } else {
                                            return (
                                                <div className="text-center space-y-2">
                                                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 rounded-xl text-sm font-semibold border border-blue-200">
                                                        Receipt available after 24h verification period
                                                    </div>
                                                    {availableAt && (
                                                        <p className="text-xs text-gray-500">
                                                            Available: {availableAt.toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        }
                                    }
                                })()}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
