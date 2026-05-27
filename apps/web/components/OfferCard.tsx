'use client';

import Image from 'next/image';
import { BarterOffer } from '@/lib/types';
import { sanitizeUrl } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const CURRENCY_SYMBOLS: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    EUR: '€',
    GBP: '£',
};

const getCurrencySymbol = (code?: string) => CURRENCY_SYMBOLS[code || ''] || code || '$';

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
    onViewDetails?: (offer: BarterOffer) => void;
    currentUserId?: string;
}

export default function OfferCard({ offer, type, onAccept, onReject, onCounter, onWithdraw, onAcceptCounter, onMessage, onConfirm, onViewReceipt, onViewDetails, currentUserId }: OfferCardProps) {
    const router = useRouter();

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

    const statusStyles: Record<string, string> = {
        pending: 'bg-amber-50 text-amber-700 border-amber-200',
        accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        rejected: 'bg-red-50 text-red-700 border-red-200',
        countered: 'bg-blue-50 text-blue-700 border-blue-200',
        withdrawn: 'bg-gray-100 text-gray-500 border-gray-200',
        cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
    };

    const statusText = offer.status.charAt(0).toUpperCase() + offer.status.slice(1);

    const buyerName = offer.buyer?.profile?.displayName || offer.buyer?.email || 'Unknown Buyer';
    const sellerName = offer.seller?.profile?.displayName || offer.seller?.email || 'Unknown Seller';

    const hasCash = (offer.offeredCashCents || 0) > 0;
    const hasItems = (offer.items || []).length > 0;
    const cashText = hasCash ? `${getCurrencySymbol(offer.currencyCode)}${((offer.offeredCashCents || 0) / 100).toLocaleString()}` : '';
    const barterItemsText = offer.items?.map(item => `${item.quantity}x ${item.offeredListing?.title || 'Item'}`).join(', ') || '';

    // Build a compact offer summary string
    const offerSummary = (() => {
        if (hasCash && hasItems) return `${cashText} + ${barterItemsText}`;
        if (hasCash) return `${cashText} cash`;
        if (hasItems) return barterItemsText;
        return 'No offer details';
    })();

    const isSeller = offer.sellerId === currentUserId;
    const isBuyer = offer.buyerId === currentUserId;

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            {/* Top row: Image + Listing + Meta */}
            <div className="flex gap-3 p-4">
                <Image
                    src={sanitizeUrl(offer.listing.images[0]?.url || '')}
                    alt={offer.listing.title}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900 text-sm truncate">{offer.listing.title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${statusStyles[offer.status] || statusStyles.pending}`}>
                            {statusText}
                        </span>
                    </div>

                    {/* Who + When */}
                    <p className="text-xs text-gray-500 mt-0.5">
                        {type === 'received'
                            ? `From ${buyerName}`
                            : type === 'sent'
                                ? `To ${sellerName}`
                                : isBuyer ? `To ${sellerName}` : `From ${buyerName}`
                        }
                        <span className="text-gray-300 mx-1.5">·</span>
                        {getTimeAgo(offer.createdAt)}
                    </p>

                    {/* Offer Summary — one line */}
                    <p className="text-sm font-semibold text-gray-800 mt-1.5 truncate">
                        {hasCash && <span className="text-emerald-600">{cashText}</span>}
                        {hasCash && hasItems && <span className="text-gray-400 mx-1">+</span>}
                        {hasItems && <span className="text-blue-600">{barterItemsText}</span>}
                        {!hasCash && !hasItems && <span className="text-gray-400">No offer details</span>}
                    </p>
                </div>
            </div>

            {/* Message — subtle left border, no italics, no decorative SVG */}
            {offer.message && (
                <div className="mx-4 mb-3 pl-3 border-l-2 border-gray-200">
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                        {offer.message}
                    </p>
                </div>
            )}

            {/* Actions */}
            {type === 'received' && offer.status === 'pending' && (
                <div className="px-4 pb-4 flex items-center gap-2">
                    <button
                        onClick={() => onAccept?.(offer.id)}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 active:scale-[0.98] transition-all"
                    >
                        Accept
                    </button>
                    <button
                        onClick={() => onReject?.(offer.id)}
                        className="py-2 px-3 text-red-600 font-bold text-xs hover:bg-red-50 rounded-lg transition-all"
                    >
                        Reject
                    </button>
                    <span className="h-4 w-px bg-gray-200" />
                    <button
                        onClick={() => onCounter?.(offer)}
                        className="py-2 px-3 text-gray-600 font-semibold text-xs hover:bg-gray-50 rounded-lg transition-all"
                    >
                        Counter
                    </button>
                    <button
                        onClick={() => onMessage?.(offer)}
                        className="py-2 px-3 text-gray-600 font-semibold text-xs hover:bg-gray-50 rounded-lg transition-all"
                    >
                        Message
                    </button>
                </div>
            )}

            {type === 'sent' && offer.status === 'pending' && (
                <div className="px-4 pb-4 flex items-center gap-2">
                    <button
                        onClick={() => onWithdraw?.(offer.id)}
                        className="py-2 px-4 text-red-600 border border-red-200 font-bold text-xs rounded-lg hover:bg-red-50 transition-all"
                    >
                        Withdraw
                    </button>
                    <button
                        onClick={() => onMessage?.(offer)}
                        className="py-2 px-4 text-gray-600 border border-gray-200 font-semibold text-xs rounded-lg hover:bg-gray-50 transition-all"
                    >
                        Message Seller
                    </button>
                </div>
            )}

            {/* Accepted - compact start chat */}
            {type === 'sent' && offer.status === 'accepted' && (
                <div className="px-4 pb-4">
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-2">
                        <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs font-bold text-emerald-700">Offer accepted — connect to arrange the exchange.</p>
                    </div>
                    <button
                        onClick={() => onMessage?.(offer)}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm"
                    >
                        Open Chat
                    </button>
                </div>
            )}

            {type === 'sent' && offer.status === 'countered' && (
                <div className="px-4 pb-4 flex items-center gap-2">
                    <button
                        onClick={() => onAcceptCounter?.(offer.id)}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 active:scale-[0.98] transition-all"
                    >
                        Accept Counter
                    </button>
                    <button
                        onClick={() => router.push(`/listings/${offer.listingId}`)}
                        className="py-2 px-4 text-gray-600 border border-gray-200 font-semibold text-xs rounded-lg hover:bg-gray-50 transition-all"
                    >
                        New Offer
                    </button>
                </div>
            )}

            {type === 'history' && (
                <div className="px-4 pb-4 space-y-2">
                    <div className="flex items-center gap-2">
                        {offer.status === 'accepted' && (
                            <button
                                onClick={() => onMessage?.(offer)}
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 active:scale-[0.98] transition-all"
                            >
                                Open Chat
                            </button>
                        )}
                        {offer.status === 'rejected' && offer.buyerId === currentUserId && (
                            <button
                                onClick={() => router.push(`/listings/${offer.listingId}`)}
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 active:scale-[0.98] transition-all"
                            >
                                Make New Offer
                            </button>
                        )}
                        <button
                            onClick={() => onViewDetails ? onViewDetails(offer) : router.push(`/listings/${offer.listingId}`)}
                            className="py-2 px-4 text-gray-600 border border-gray-200 font-semibold text-xs rounded-lg hover:bg-gray-50 transition-all"
                        >
                            Details
                        </button>
                    </div>

                    {/* Receipt / Confirm Logic */}
                    {offer.status === 'accepted' && (() => {
                        const hasConfirmed = isSeller ? offer.listingOwnerConfirmedAt : offer.offerMakerConfirmedAt;
                        const partnerConfirmed = isSeller ? offer.offerMakerConfirmedAt : offer.listingOwnerConfirmedAt;

                        if (!hasConfirmed) {
                            return (
                                <button
                                    onClick={() => onConfirm?.(offer.id)}
                                    className="w-full py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs hover:bg-emerald-100 transition-all"
                                >
                                    Confirm Item Received
                                </button>
                            );
                        }
                        if (hasConfirmed && !partnerConfirmed) {
                            return (
                                <p className="text-center text-xs text-gray-400 font-semibold py-1.5">
                                    Waiting for partner to confirm...
                                </p>
                            );
                        }
                        if (hasConfirmed && partnerConfirmed) {
                            const availableAt = offer.receiptAvailableAt ? new Date(offer.receiptAvailableAt) : null;
                            const isAvailable = availableAt && new Date() >= availableAt;

                            if (isAvailable) {
                                return (
                                    <button
                                        onClick={() => onViewReceipt?.(offer)}
                                        className="w-full py-2 bg-gray-900 text-white rounded-lg font-bold text-xs hover:bg-gray-800 transition-all"
                                    >
                                        View Receipt
                                    </button>
                                );
                            }
                            return (
                                <p className="text-center text-xs text-gray-400 font-medium py-1.5">
                                    Receipt available after 24h verification
                                    {availableAt && ` — ${availableAt.toLocaleString()}`}
                                </p>
                            );
                        }
                    })()}
                </div>
            )}
        </div>
    );
}
