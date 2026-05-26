'use client';

import React, { useState } from 'react';
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

    // TradeCompleteModal visibility state locally (controlled via status check but also closable)
    const [showCompleteModal, setShowCompleteModal] = useState(
        offer.status === 'completed' && (!offer.isSellerFulfilled || !offer.isBuyerFulfilled) // Just a hacky way to test if we JUST completed it. Usually we rely on a flag or state. 
        // Actually, let's just show it if status is completed and they haven't closed it yet in this session.
    );
    // Let's rely on a session-storage flag so it flashes once
    useState(() => {
        if (typeof window !== 'undefined' && offer.status === 'completed') {
            const hasSeen = sessionStorage.getItem(`seen_complete_${offer.id}`);
            if (!hasSeen) {
                setShowCompleteModal(true);
                sessionStorage.setItem(`seen_complete_${offer.id}`, 'true');
            }
        }
    });

    const isSeller = offer.sellerId === currentUserId;
    const isBuyer = offer.buyerId === currentUserId;

    // Check if the current user has locked the deal
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
                // Determine if this hit completed
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
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-3">

            {/* Visual Stepper */}
            <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-100">
                <TradeStepper
                    status={offer.status}
                    isBuyerLocked={offer.isBuyerLocked}
                    isSellerLocked={offer.isSellerLocked}
                />
            </div>

            {/* Action Area */}
            <div className="px-4 py-3">

                {/* 1. Commitment Phase */}
                {offer.status === 'accepted' && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm flex-wrap">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-xs">Lock Deal</span>
                            <span className="text-xs text-gray-500 hidden sm:inline">(Starts 7-day Meetup Timer)</span>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {otherHasLocked && !hasLocked && (
                                <p className="text-xs text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded animate-pulse hidden sm:block">
                                    Waiting for you!
                                </p>
                            )}
                            <button
                                onClick={handleLockDeal}
                                disabled={isLoading || hasLocked}
                                className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-[11px] transition-all flex-1 sm:flex-none ${hasLocked
                                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-sm'
                                    }`}
                            >
                                {isLoading ? 'Working...' : hasLocked ? '✓ Locked' : '🔒 Lock Deal'}
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. Meetup/Fulfillment Phase */}
                {offer.status === 'awaiting_fulfillment' && (
                    <div className="space-y-3 shrink-0 relative mt-2 pt-2 border-t border-gray-100">
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex flex-col gap-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h3 className="font-extrabold text-slate-800 text-sm">Fulfillment Confirmation</h3>
                                    <p className="text-[11px] text-slate-500 leading-normal max-w-xs mt-0.5">
                                        Once you have physically exchanged the items, verified shipment, or received what was agreed, confirm it below.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {hasFulfilled ? (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-[10px] font-extrabold border border-green-200 shadow-inner">
                                            <span>✓</span>
                                            <span>You Confirmed</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleVerifyPickup}
                                            disabled={isLoading}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full text-xs font-bold transition shadow-sm whitespace-nowrap"
                                        >
                                            {isLoading ? 'Confirming...' : 'Confirm Exchange'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {otherHasFulfilled && (
                                <div className="bg-emerald-50 border border-emerald-100/60 rounded-xl px-3 py-2 flex items-center gap-2 mt-1">
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <p className="text-[10px] text-emerald-800 font-bold">
                                        {otherPartyName} has confirmed receipt. Once you confirm, the trade will finalize!
                                    </p>
                                </div>
                            )}

                            {!otherHasFulfilled && hasFulfilled && (
                                <p className="text-[10px] text-slate-400 font-semibold italic mt-0.5">
                                    Awaiting confirmation from {otherPartyName}...
                                </p>
                            )}
                        </div>

                        {/* Emergency Brake / Dispute Button */}
                        <div className="text-center pt-1.5">
                            <button
                                onClick={() => setShowDisputeModal(true)}
                                className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-wider flex items-center justify-center gap-1 mx-auto"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                Report Issue / Dispute
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. Completed State */}
                {offer.status === 'completed' && (
                    <div className="text-center py-4 text-green-700">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h3 className="font-bold text-lg text-green-900 mb-1">Trade Complete</h3>
                        <p className="text-sm font-medium opacity-80">This trade was successfully fulfilled.</p>
                    </div>
                )}
            </div>

            {/* Dispute Modal */}
            {showDisputeModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-red-600 flex items-center gap-2 mb-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            Emergency Brake (Dispute)
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            If the item is not as described, or there is a serious issue during meetup, detail the reason here. This will freeze the trade and alert BarterWave support instantly.
                        </p>
                        <textarea
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            placeholder="Please explain the issue in detail..."
                            className="w-full border-2 border-gray-200 rounded-xl p-3 mb-4 focus:border-red-500 focus:ring-0 min-h-[100px]"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowDisputeModal(false)}
                                className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDispute}
                                disabled={isLoading}
                                className="flex-1 py-3 text-white font-bold bg-red-600 hover:bg-red-700 rounded-xl flex justify-center items-center"
                            >
                                {isLoading ? 'Sending...' : 'Raise Dispute'}
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
