'use client';

import { BarterOffer } from '@/lib/types';

interface OfferActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    offer: BarterOffer | null;
    action: 'accept' | 'reject' | 'view';
    isProcessing?: boolean;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    EUR: '€',
    GBP: '£',
};

const getCurrencySymbol = (code?: string) => CURRENCY_SYMBOLS[code || ''] || code || '$';

export default function OfferActionModal({
    isOpen,
    onClose,
    onConfirm,
    offer,
    action,
    isProcessing = false
}: OfferActionModalProps) {
    if (!isOpen || !offer) return null;

    const isAccept = action === 'accept';
    const isReject = action === 'reject';
    const isView = action === 'view';
    
    const buyerName = offer.buyer?.profile?.displayName || offer.buyer?.email || 'Unknown User';
    const cashAmount = offer.offeredCashCents ? (offer.offeredCashCents / 100).toLocaleString() : null;
    const hasItems = (offer.items || []).length > 0;
    const itemsText = offer.items?.map(item => `${item.quantity}x ${item.offeredListing?.title}`).join(', ');
    const listingTitle = offer.listing?.title || 'this listing';

    // Build the offer description
    const offerDescription = (() => {
        const parts: string[] = [];
        if (cashAmount) parts.push(`${getCurrencySymbol(offer.currencyCode)}${cashAmount} cash`);
        if (hasItems) parts.push(itemsText || 'barter items');
        return parts.length > 0 ? parts.join(' and ') : 'a trade';
    })();

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header — minimal */}
                <div className="px-6 pt-6 pb-3">
                    <h3 className="text-lg font-bold text-gray-900">
                        {isAccept ? 'Accept this offer?' : isReject ? 'Reject this offer?' : 'Offer Details'}
                    </h3>
                </div>

                {/* Agreement text block */}
                <div className="px-6 pb-4">
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-700 leading-relaxed space-y-3">
                        {isAccept ? (
                            <>
                                <p>
                                    By accepting this offer from <strong className="text-gray-900">{buyerName}</strong> for <strong className="text-gray-900">{listingTitle}</strong>, you agree to start a private chat to arrange the exchange.
                                </p>
                                <p>
                                    A 60-minute timer will begin once accepted. Both parties should discuss terms, confirm details, and finalize the trade before the timer expires.
                                </p>
                                <p className="text-gray-500 text-xs">
                                    Meet in a public place. Do not hand over items before inspecting what you receive. You can raise a dispute at any time during the trade.
                                </p>
                            </>
                        ) : isReject ? (
                            <>
                                <p>
                                    You are about to reject the offer from <strong className="text-gray-900">{buyerName}</strong> for <strong className="text-gray-900">{listingTitle}</strong>.
                                </p>
                                <p className="text-gray-500 text-xs">
                                    This action is permanent. The buyer will be notified immediately and will need to submit a new offer if they wish to trade again.
                                </p>
                            </>
                        ) : (
                            <>
                                <p>
                                    <strong className="text-gray-900">{buyerName}</strong> offered {offerDescription} for <strong className="text-gray-900">{listingTitle}</strong>.
                                </p>
                            </>
                        )}

                        {/* Offer terms — compact */}
                        <div className="pt-2 border-t border-gray-200 space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Offering</span>
                                <span className="font-semibold text-gray-900">{offerDescription}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">For</span>
                                <span className="font-semibold text-gray-900 text-right max-w-[60%] truncate">{listingTitle}</span>
                            </div>
                        </div>

                        {/* Buyer's note — inline, plain */}
                        {offer.message && (
                            <div className="pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-500 mb-0.5">Note from {buyerName}:</p>
                                <p className="text-sm text-gray-700">{offer.message}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className={`px-6 pb-6 flex gap-3 ${isView ? '' : 'border-t border-gray-100 pt-4'}`}>
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="flex-1 py-2.5 border border-gray-200 rounded-lg font-semibold text-gray-600 hover:bg-gray-50 transition-all text-sm disabled:opacity-50"
                    >
                        {isView ? 'Close' : 'Cancel'}
                    </button>
                    {!isView && (
                        <button
                            onClick={onConfirm}
                            disabled={isProcessing}
                            className={`flex-1 py-2.5 rounded-lg font-bold text-white transition-all disabled:opacity-50 text-sm ${
                                isAccept
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'bg-red-600 hover:bg-red-700'
                            }`}
                        >
                            {isProcessing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </span>
                            ) : (
                                isAccept ? 'Accept' : 'Reject'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
