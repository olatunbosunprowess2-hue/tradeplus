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
    const [verifyPin, setVerifyPin] = useState('');
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

    const handleVerifyPickup = async (usePin: boolean) => {
        setIsLoading(true);
        try {
            await apiClient.post(`/barter/offers/${offer.id}/verify-pickup`, {
                pin: usePin ? verifyPin : undefined
            });
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">

            {/* Visual Stepper */}
            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                <TradeStepper
                    status={offer.status}
                    isBuyerLocked={offer.isBuyerLocked}
                    isSellerLocked={offer.isSellerLocked}
                />
            </div>

            {/* Action Area */}
            <div className="px-6 py-5">

                {/* 1. Commitment Phase */}
                {offer.status === 'accepted' && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm flex-wrap">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">Lock Deal</span>
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
                        {isBuyer ? (
                            <div className="bg-blue-50/50 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-blue-100">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-blue-900 text-sm">Your Pickup PIN</h3>
                                    <p className="text-[11px] text-blue-700 leading-tight">Give this to the seller only after inspecting the item.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-xl font-black text-blue-600 tracking-widest bg-white py-1 px-4 rounded-md shadow-sm border border-blue-100">
                                        {offer.pickupPin}
                                    </div>
                                    <button
                                        onClick={() => handleVerifyPickup(false)}
                                        disabled={isLoading || hasFulfilled}
                                        className={`px-3 py-1.5 rounded-md font-bold uppercase text-[10px] whitespace-nowrap transition-all ${hasFulfilled
                                            ? 'bg-green-100 text-green-700 cursor-not-allowed hidden sm:block'
                                            : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-100'
                                            }`}
                                    >
                                        {hasFulfilled ? 'Sent' : 'Approve w/o PIN'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-green-50/50 rounded-lg p-3 sm:p-4 border border-green-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-green-900 text-sm">Verify Buyer's PIN</h3>
                                    <p className="text-[11px] text-green-700 leading-tight">Enter their 6-digit PIN to complete the trade.</p>
                                    {otherHasLocked && !hasFulfilled && (
                                        <p className="text-[10px] text-orange-600 font-bold bg-orange-100 px-2 py-0.5 rounded w-fit">Manual approval sent by buyer</p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-end gap-2">
                                        <input
                                            type="text"
                                            maxLength={6}
                                            value={verifyPin}
                                            onChange={(e) => setVerifyPin(e.target.value.replace(/\D/g, ''))}
                                            placeholder="000000"
                                            className="w-28 text-center font-bold text-lg tracking-wider rounded-md border-green-300 py-1 focus:ring-green-500 shadow-sm"
                                        />
                                        <button
                                            onClick={() => handleVerifyPickup(true)}
                                            disabled={isLoading || verifyPin.length !== 6}
                                            className="bg-green-600 text-white px-4 py-1.5 font-bold uppercase text-[11px] rounded-md hover:bg-green-700 disabled:opacity-50 shadow-sm"
                                        >
                                            Verify
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => handleVerifyPickup(false)}
                                        disabled={isLoading || hasFulfilled}
                                        className={`px-3 py-1.5 rounded border uppercase text-[10px] font-bold text-center transition-all ${hasFulfilled
                                            ? 'bg-green-100 text-green-700 border-green-200 cursor-not-allowed'
                                            : 'bg-white text-green-600 border-green-200 hover:bg-green-50'
                                            }`}
                                    >
                                        {hasFulfilled ? 'Manual Approval Sent' : 'Approve Manually w/o PIN'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Emergency Brake / Dispute Button */}
                        <div className="text-center pt-2">
                            <button
                                onClick={() => setShowDisputeModal(true)}
                                className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-widest flex items-center justify-center gap-1 mx-auto"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                Report Issue / Reject Item
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
