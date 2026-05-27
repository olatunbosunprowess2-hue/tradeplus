'use client';

import React, { useState, useEffect } from 'react';
import TradeStepper from './TradeStepper';
import TradeCompleteModal from './TradeCompleteModal';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';

interface TradeActionPanelProps {
    offer: any;
    currentUserId: string;
    onUpdate: () => void;
}

export default function TradeActionPanel({ offer, currentUserId, onUpdate }: TradeActionPanelProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [showConfirmExchange, setShowConfirmExchange] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);

    // Show completion modal once per session when trade is newly completed
    useEffect(() => {
        if (typeof window !== 'undefined' && offer.status === 'completed') {
            const hasSeen = sessionStorage.getItem(`seen_complete_${offer.id}`);
            if (!hasSeen) {
                setShowCompleteModal(true);
                sessionStorage.setItem(`seen_complete_${offer.id}`, 'true');
            }
        }
    }, [offer.status, offer.id]);

    const isSeller = offer.sellerId === currentUserId;
    const isBuyer = offer.buyerId === currentUserId;

    const hasLocked = (isBuyer && offer.isBuyerLocked) || (isSeller && offer.isSellerLocked);
    const otherHasLocked = (isBuyer && offer.isSellerLocked) || (isSeller && offer.isBuyerLocked);

    const hasFulfilled = (isBuyer && offer.isBuyerFulfilled) || (isSeller && offer.isSellerFulfilled);
    const otherHasFulfilled = (isBuyer && offer.isSellerFulfilled) || (isSeller && offer.isBuyerFulfilled);
    const otherPartyName = isBuyer 
        ? offer.seller?.profile?.displayName || offer.seller?.email || 'Seller' 
        : offer.buyer?.profile?.displayName || offer.buyer?.email || 'Buyer';

    const handleLockDeal = async () => {
        setIsLoading(true);
        try {
            await apiClient.post(`/barter/offers/${offer.id}/lock`);
            toast.success('Deal locked! Awaiting other party.');
            onUpdate();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to lock deal');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyPickup = async () => {
        setIsLoading(true);
        try {
            await apiClient.post(`/barter/offers/${offer.id}/verify-pickup`);
            toast.success('Fulfillment verified!');
            if (offer.status !== 'completed') {
                setShowCompleteModal(true);
            }
            onUpdate();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDispute = async () => {
        if (!disputeReason.trim()) {
            toast.error('Please provide a reason');
            return;
        }
        setIsLoading(true);
        try {
            await apiClient.post(`/barter/offers/${offer.id}/dispute`, { reason: disputeReason });
            toast.success('Dispute raised successfully. Admin notified.');
            setShowDisputeModal(false);
            onUpdate();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to raise dispute');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Compact Stepper + Action in one row for accepted status */}
            <div className="px-3 py-2.5">
                <TradeStepper
                    status={offer.status}
                    isBuyerLocked={offer.isBuyerLocked}
                    isSellerLocked={offer.isSellerLocked}
                />
            </div>

            {/* ── 1. Commitment Phase ── */}
            {offer.status === 'accepted' && (
                <div className="px-3 pb-3">
                    {otherHasLocked && !hasLocked && (
                        <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 mb-2">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                            <p className="text-[11px] text-orange-700 font-bold">{otherPartyName} has locked — waiting for you!</p>
                        </div>
                    )}
                    <button
                        onClick={handleLockDeal}
                        disabled={isLoading || hasLocked}
                        className={`w-full py-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                            hasLocked
                                ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
                                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-sm'
                        }`}
                    >
                        {isLoading ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : hasLocked ? (
                            <>✓ You've Locked</>
                        ) : (
                            <>🔒 Lock Deal</>
                        )}
                    </button>
                    {!hasLocked && (
                        <p className="text-[10px] text-gray-400 text-center mt-1.5">Both parties must lock to start the exchange phase</p>
                    )}
                </div>
            )}

            {/* ── 2. Fulfillment Phase ── */}
            {offer.status === 'awaiting_fulfillment' && (
                <div className="px-3 pb-3 space-y-2">
                    {otherHasFulfilled && (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <p className="text-[11px] text-emerald-800 font-bold">
                                {otherPartyName} confirmed — your turn!
                            </p>
                        </div>
                    )}

                    {hasFulfilled ? (
                        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                            <div className="flex items-center gap-2">
                                <span className="text-green-600 text-sm">✓</span>
                                <span className="text-xs font-bold text-green-700">You confirmed exchange</span>
                            </div>
                            {!otherHasFulfilled && (
                                <span className="text-[10px] text-gray-400 font-medium italic">Waiting for {otherPartyName}...</span>
                            )}
                        </div>
                    ) : showConfirmExchange ? (
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                            <p className="text-[11px] text-amber-800 font-bold mb-2">⚠️ Are you sure? This cannot be undone.</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowConfirmExchange(false)}
                                    className="flex-1 py-2 bg-white text-gray-600 rounded-lg text-xs font-bold border border-gray-200 hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleVerifyPickup}
                                    disabled={isLoading}
                                    className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 active:scale-[0.98] transition shadow-sm"
                                >
                                    {isLoading ? 'Confirming...' : 'Yes, Confirm'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowConfirmExchange(true)}
                            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 active:scale-[0.98] transition shadow-sm flex items-center justify-center gap-1.5"
                        >
                            🤝 Confirm Exchange
                        </button>
                    )}

                    {/* Dispute link */}
                    <button
                        onClick={() => setShowDisputeModal(true)}
                        className="w-full text-[10px] font-semibold text-gray-400 hover:text-red-500 py-1 transition flex items-center justify-center gap-1"
                    >
                        ⚠️ Report Issue
                    </button>
                </div>
            )}

            {/* ── 3. Completed ── */}
            {offer.status === 'completed' && (
                <div className="text-center px-3 pb-3">
                    <div className="bg-green-50 rounded-lg py-3 flex items-center justify-center gap-2">
                        <span className="text-green-600 text-lg">🎉</span>
                        <span className="text-sm font-bold text-green-800">Trade Complete</span>
                    </div>
                </div>
            )}

            {/* Dispute Modal */}
            {showDisputeModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDisputeModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-base font-bold text-red-600 flex items-center gap-2 mb-2">
                            ⚠️ Report Issue / Dispute
                        </h3>
                        <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                            If the item is not as described or there is a serious issue, explain below. This will freeze the trade and alert BarterWave support.
                        </p>
                        <textarea
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            placeholder="Explain the issue in detail..."
                            className="w-full border-2 border-gray-200 rounded-xl p-3 mb-3 focus:border-red-400 focus:ring-0 min-h-[80px] text-sm"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowDisputeModal(false)}
                                className="flex-1 py-2.5 text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDispute}
                                disabled={isLoading}
                                className="flex-1 py-2.5 text-white font-bold bg-red-600 hover:bg-red-700 rounded-xl text-xs flex justify-center items-center"
                            >
                                {isLoading ? 'Sending...' : 'Submit Dispute'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <TradeCompleteModal
                isOpen={showCompleteModal}
                onClose={() => setShowCompleteModal(false)}
                tradeId={offer.id}
                targetListingTitle={offer.listing?.title || 'Traded Item'}
                targetListingImage={offer.listing?.images?.[0]?.url}
                otherPartyName={isBuyer ? offer.seller?.profile?.displayName : offer.buyer?.profile?.displayName}
            />
        </div>
    );
}
