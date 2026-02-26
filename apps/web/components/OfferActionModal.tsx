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
    const isView = action === 'view';
    const buyerName = offer.buyer?.profile?.displayName || offer.buyer?.email || 'Unknown Buyer';
    const cashAmount = offer.offeredCashCents ? (offer.offeredCashCents / 100).toLocaleString() : '0';
    const hasItems = (offer.items || []).length > 0;
    const itemsText = offer.items?.map(item => item.offeredListing?.title).join(', ');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className={`p-6 ${isAccept ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full ${isAccept ? 'bg-white/20' : 'bg-white/20'} flex items-center justify-center`}>
                            {isAccept ? (
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white">
                                {isAccept ? 'Accept Offer?' : 'Reject Offer?'}
                            </h3>
                            <p className="text-white/90 text-sm mt-0.5">
                                {isAccept ? 'This action will accept the trade' : 'This will permanently reject the offer'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Buyer Info */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                            {buyerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">{buyerName}</p>
                            <p className="text-xs text-gray-500">Buyer</p>
                        </div>
                    </div>

                    {/* Offer Summary */}
                    <div className="border-2 border-blue-100 rounded-xl p-4 bg-blue-50/50">
                        <p className="text-xs font-bold text-blue-800 uppercase mb-2">Offer Details</p>
                        <div className="space-y-1">
                            {offer.offeredCashCents > 0 && (
                                <p className="text-gray-900 font-semibold">
                                    💰 {offer.currencyCode} {cashAmount} cash
                                </p>
                            )}
                            {hasItems && (
                                <p className="text-gray-900 font-semibold">
                                    🔄 {itemsText}
                                </p>
                            )}
                            {offer.message && (
                                <p className="text-gray-700 text-sm italic mt-2">
                                    "{offer.message}"
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Warning/Info Message */}
                    {isAccept ? (
                        <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-r-lg">
                            <p className="text-sm text-green-800">
                                ✓ You can arrange the trade details with the buyer via messages after accepting.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg">
                            <p className="text-sm text-amber-800">
                                ⚠️ The buyer will be notified that you rejected their offer.
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className={`p-6 pt-0 grid ${isView ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="px-6 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isView ? 'Close' : 'Cancel'}
                    </button>
                    {!isView && (
                        <button
                            onClick={onConfirm}
                            disabled={isProcessing}
                            className={`px-6 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${isAccept
                                ? 'bg-green-600 hover:bg-green-700 shadow-green-200'
                                : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                                }`}
                        >
                            {isProcessing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                <span>{isAccept ? 'Accept Offer' : 'Reject Offer'}</span>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
