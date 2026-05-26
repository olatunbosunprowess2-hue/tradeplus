'use client';

import { BarterOffer } from '@/lib/types';
import { sanitizeUrl } from '@/lib/utils';

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
    const cashAmount = offer.offeredCashCents ? (offer.offeredCashCents / 100).toLocaleString() : '0';
    const hasItems = (offer.items || []).length > 0;
    const itemsText = offer.items?.map(item => item.offeredListing?.title).join(', ');

    // Header styling based on action
    let headerBg = 'bg-gradient-to-br from-slate-900 to-slate-800';
    let headerTitle = 'Offer Details';
    let headerSubtitle = 'Review offer terms below';
    let Icon = (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
    );

    if (isAccept) {
        headerBg = 'bg-gradient-to-br from-emerald-600 to-teal-700';
        headerTitle = 'Accept Offer?';
        headerSubtitle = 'This will start the barter agreement';
        Icon = (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
        );
    } else if (isReject) {
        headerBg = 'bg-gradient-to-br from-rose-600 to-red-700';
        headerTitle = 'Reject Offer?';
        headerSubtitle = 'This will permanently reject this offer';
        Icon = (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                {/* Header */}
                <div className={`p-6 text-white ${headerBg}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner">
                            {Icon}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-black tracking-tight">
                                {headerTitle}
                            </h3>
                            <p className="text-white/80 text-xs mt-0.5 font-semibold">
                                {headerSubtitle}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Listing Context */}
                    {offer.listing && (
                        <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                            {offer.listing.images?.[0]?.url && (
                                <img
                                    src={sanitizeUrl(offer.listing.images[0].url)}
                                    alt={offer.listing.title}
                                    className="w-12 h-12 rounded-xl object-cover shadow-sm border border-slate-100/50"
                                />
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Trade Listing</p>
                                <h4 className="font-extrabold text-slate-800 text-sm truncate">{offer.listing.title}</h4>
                            </div>
                        </div>
                    )}

                    {/* Buyer Info */}
                    <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-md">
                            {buyerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-extrabold text-slate-800 text-sm">{buyerName}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Offer Maker</p>
                        </div>
                    </div>

                    {/* Offer Terms Side-by-Side Cards */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Proposed Exchange</p>
                        <div className="grid grid-cols-2 gap-3">
                            {offer.offeredCashCents > 0 ? (
                                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-xs">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1.5">Cash Offered</span>
                                    <span className="text-xl font-black text-emerald-700">{getCurrencySymbol(offer.currencyCode)}{cashAmount}</span>
                                </div>
                            ) : (
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center opacity-60">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Cash Offered</span>
                                    <span className="text-sm font-extrabold text-slate-500">None</span>
                                </div>
                            )}

                            {hasItems ? (
                                <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-xs">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-purple-600 mb-1.5">Barter Items</span>
                                    <span className="text-xs font-black text-purple-700 line-clamp-2 leading-snug">{itemsText}</span>
                                </div>
                            ) : (
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center opacity-60">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Barter Items</span>
                                    <span className="text-sm font-extrabold text-slate-500">None</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Message Bubble */}
                    {offer.message && (
                        <div className="relative p-4 bg-blue-50/30 border border-blue-100/50 rounded-2xl shadow-inner">
                            <p className="text-slate-600 text-xs font-semibold leading-relaxed italic">
                                "{offer.message}"
                            </p>
                        </div>
                    )}

                    {/* Educational / Warning Box */}
                    {!isView && (
                        isAccept ? (
                            <div className="bg-emerald-50/40 border border-emerald-100/50 p-3.5 rounded-2xl flex gap-2.5">
                                <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-[11px] text-emerald-800 font-semibold leading-relaxed">
                                    Confirming starts the escrow and anti-ghosting phase. Meetup details will be finalized via chat.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-rose-50/40 border border-rose-100/50 p-3.5 rounded-2xl flex gap-2.5">
                                <svg className="w-5 h-5 text-rose-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-[11px] text-rose-800 font-semibold leading-relaxed">
                                    Rejecting is permanent. The buyer will be notified immediately.
                                </p>
                            </div>
                        )
                    )}
                </div>

                {/* Actions */}
                <div className={`p-6 pt-2 grid ${isView ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="px-6 py-3 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 text-xs uppercase tracking-wider"
                    >
                        {isView ? 'Close' : 'Cancel'}
                    </button>
                    {!isView && (
                        <button
                            onClick={onConfirm}
                            disabled={isProcessing}
                            className={`px-6 py-3 rounded-2xl font-black text-white transition-all disabled:opacity-50 shadow-md ${isAccept
                                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 hover:shadow-lg'
                                : 'bg-red-600 hover:bg-red-700 shadow-red-100 hover:shadow-lg'
                                } text-xs uppercase tracking-wider`}
                        >
                            {isProcessing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                <span>{isAccept ? 'Accept' : 'Reject'}</span>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
