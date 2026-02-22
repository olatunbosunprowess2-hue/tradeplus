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
                    <div className="space-y-4 text-center">
                        <h3 className="font-bold text-gray-900">Lock Deal & Schedule Meetup</h3>
                        <p className="text-sm text-gray-500 max-w-md mx-auto">
                            By clicking below, you commit to this trade. Once both parties lock the deal, a 7-day timer will begin for the meetup/fulfillment.
                        </p>
                        <div className="flex justify-center flex-col sm:flex-row items-center gap-3">
                            <button
                                onClick={handleLockDeal}
                                disabled={isLoading || hasLocked}
                                className={`px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all w-full sm:w-auto ${hasLocked
                                        ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:scale-95'
                                    }`}
                            >
                                {isLoading ? 'Processing...' : hasLocked ? '✓ Deal Locked by You' : '🔒 Lock Deal'}
                            </button>
                            {otherHasLocked && !hasLocked && (
                                <p className="text-xs text-orange-600 font-bold bg-orange-50 px-3 py-2 rounded-lg animate-pulse">
                                    Other party has already locked. Waiting for you!
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. Meetup/Fulfillment Phase */}
                {offer.status === 'awaiting_fulfillment' && (
                    <div className="space-y-6">
                        {isBuyer ? (
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                                <h3 className="font-bold text-blue-900 mb-2">Your Secret Pickup PIN</h3>
                                <p className="text-sm text-blue-700 mb-4">Give this to the seller ONLY when you have received and inspected the item(s).</p>
                                <div className="text-5xl font-black text-blue-600 tracking-[0.2em] bg-white py-4 rounded-xl shadow-inner inline-block px-8 w-fit mx-auto border border-blue-100">
                                    {offer.pickupPin}
                                </div>
                                <div className="mt-6 pt-6 border-t border-blue-100">
                                    <button
                                        onClick={() => handleVerifyPickup(false)}
                                        disabled={isLoading || hasFulfilled}
                                        className={`px-6 py-2.5 rounded-xl font-bold uppercase text-xs transition-all ${hasFulfilled
                                                ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                                : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-100'
                                            }`}
                                    >
                                        {hasFulfilled ? '✓ Manual Approval Sent' : 'Or Approve Manually without PIN'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 max-w-lg mx-auto">
                                <h3 className="font-bold text-green-900 mb-2 text-center">Verify Buyer's PIN</h3>
                                <p className="text-sm text-green-700 mb-4 text-center">Ask the buyer for their 6-digit PIN to instantly complete this trade.</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={verifyPin}
                                        onChange={(e) => setVerifyPin(e.target.value.replace(/\D/g, ''))}
                                        placeholder="000000"
                                        className="flex-1 text-center font-black text-2xl tracking-[0.2em] rounded-xl border-green-300 focus:border-green-500 focus:ring-green-500"
                                    />
                                    <button
                                        onClick={() => handleVerifyPickup(true)}
                                        disabled={isLoading || verifyPin.length !== 6}
                                        className="bg-green-600 text-white px-6 font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-green-700 disabled:opacity-50"
                                    >
                                        Verify
                                    </button>
                                </div>
                                <div className="mt-6 pt-6 border-t border-green-200 text-center">
                                    <button
                                        onClick={() => handleVerifyPickup(false)}
                                        disabled={isLoading || hasFulfilled}
                                        className={`px-6 py-2.5 rounded-xl font-bold uppercase text-xs transition-all ${hasFulfilled
                                                ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                                : 'bg-white text-green-600 border border-green-200 hover:bg-green-100'
                                            }`}
                                    >
                                        {hasFulfilled ? '✓ Manual Approval Sent' : 'Or Approve Manually without PIN'}
                                    </button>
                                    {otherHasLocked && !hasFulfilled && (
                                        <p className="text-xs text-orange-600 font-bold mt-2">Buyer sent manual approval. Yours is needed.</p>
                                    )}
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
