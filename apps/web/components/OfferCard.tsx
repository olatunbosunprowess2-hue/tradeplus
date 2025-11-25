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
}

export default function OfferCard({ offer, type, onAccept, onReject, onCounter, onWithdraw, onAcceptCounter, onMessage }: OfferCardProps) {
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
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            accepted: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200',
            countered: 'bg-blue-50 text-blue-800 border-blue-200',
            withdrawn: 'bg-gray-100 text-gray-800 border-gray-200',
            cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex gap-3 mb-3">
                <Image
                    src={offer.listing.images[0]?.url || ''}
                    alt={offer.listing.title}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base mb-1 truncate">
                        {offer.listing.title}
                    </h3>
                    {type === 'received' && (
                        <p className="text-xs text-gray-500 font-medium">Your Listing</p>
                    )}
                    {type === 'sent' && (
                        <p className="text-xs text-gray-500 font-medium">Listed by {sellerName}</p>
                    )}
                </div>
                {type === 'sent' && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border h-fit ${getStatusBadge()}`}>
                        {getStatusText()}
                    </span>
                )}
            </div>

            {/* User Info */}
            {type === 'received' && (
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                        {buyerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 text-sm">{buyerName} wants to trade</p>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {buyerLocation}
                        </p>
                    </div>
                </div>
            )}

            {type === 'sent' && (
                <p className="text-xs text-gray-600 flex items-center gap-1 mb-3">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {sellerLocation}
                </p>
            )}

            {/* Offer Details */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <p className="text-xs font-bold text-blue-800 mb-2 uppercase">
                    {type === 'received' ? 'Offer Details' : 'Your Offer'}
                </p>
                <div className="space-y-1 text-sm">
                    {offerType === 'cash' && (
                        <p className="font-semibold text-gray-900">
                            • Offering: {offer.currencyCode} {((offer.offeredCashCents || 0) / 100).toLocaleString()} cash
                        </p>
                    )}
                    {offerType === 'barter' && (
                        <p className="font-semibold text-gray-900">
                            • Trade for: {barterItemsText}
                        </p>
                    )}
                    {offerType === 'both' && (
                        <>
                            <p className="font-semibold text-gray-900">
                                • Cash: {offer.currencyCode} {((offer.offeredCashCents || 0) / 100).toLocaleString()}
                            </p>
                            <p className="font-semibold text-gray-900">
                                • Plus: {barterItemsText}
                            </p>
                        </>
                    )}
                    {offer.message && (
                        <p className="text-gray-700 italic">
                            • Message: "{offer.message}"
                        </p>
                    )}
                </div>
            </div>

            {/* Timestamp */}
            <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {type === 'sent' ? 'Sent' : 'Received'} {getTimeAgo(offer.createdAt)}
            </p>

            {/* Action Buttons */}
            {type === 'received' && offer.status === 'pending' && (
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => onAccept?.(offer.id)}
                        className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition"
                    >
                        ✓ Accept
                    </button>
                    <button
                        onClick={() => onReject?.(offer.id)}
                        className="px-4 py-2.5 border-2 border-red-500 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-50 transition"
                    >
                        ✕ Reject
                    </button>
                    <button
                        onClick={() => onCounter?.(offer)}
                        className="px-4 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold text-sm hover:bg-blue-50 transition"
                    >
                        ↔ Counter
                    </button>
                    <button
                        onClick={() => onMessage?.(offer)}
                        className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition"
                    >
                        💬 Message
                    </button>
                </div>
            )}

            {type === 'sent' && offer.status === 'pending' && (
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => onWithdraw?.(offer.id)}
                        className="px-4 py-2.5 border-2 border-red-500 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-50 transition"
                    >
                        Withdraw Offer
                    </button>
                    <button
                        onClick={() => onMessage?.(offer)}
                        className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition"
                    >
                        💬 Message Seller
                    </button>
                </div>
            )}

            {type === 'sent' && offer.status === 'countered' && (
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => onAcceptCounter?.(offer.id)}
                        className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition"
                    >
                        Accept Counter
                    </button>
                    <button className="px-4 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold text-sm hover:bg-blue-50 transition">
                        Make New Offer
                    </button>
                </div>
            )}

            {type === 'history' && (
                <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition">
                        View Details
                    </button>
                    {offer.status === 'accepted' && (
                        <button className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition">
                            Leave Review
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
