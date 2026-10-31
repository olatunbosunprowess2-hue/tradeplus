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
    const [showLockCelebration, setShowLockCelebration] = useState(false);
    const [pinInput, setPinInput] = useState('');

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

    // Show lock celebration once per session when both parties lock
    useEffect(() => {
        if (offer.isBuyerLocked && offer.isSellerLocked) {
            const hasSeenLock = sessionStorage.getItem(`seen_lock_${offer.id}`);
            if (!hasSeenLock) {
                setShowLockCelebration(true);
                sessionStorage.setItem(`seen_lock_${offer.id}`, 'true');
                setTimeout(() => setShowLockCelebration(false), 3000);
            }
        }
    }, [offer.isBuyerLocked, offer.isSellerLocked, offer.id]);

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
            setShowLockCelebration(true);
            setTimeout(() => setShowLockCelebration(false), 3000);
            onUpdate();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to lock deal');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyPickup = async (pin?: string) => {
        setIsLoading(true);
        try {
            await apiClient.post(`/barter/offers/${offer.id}/verify-pickup`, pin ? { pin } : {});
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_4px_rgba(15,23,42,0.08)] overflow-hidden relative">

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
                <div className="px-3 pb-3 space-y-2.5">
                    {otherHasLocked && !hasLocked && (
                        <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3.5 py-2.5 shadow-sm">
                            <span className="px-2 py-0.5 bg-amber-500 text-white rounded text-[9px] font-black uppercase tracking-wider shadow-xs">WAITING FOR YOU</span>
                            <p className="text-xs text-amber-900 font-bold">{otherPartyName} has locked — seal the deal to start safe exchange!</p>
                        </div>
                    )}
                    <button
                        onClick={handleLockDeal}
                        disabled={isLoading || hasLocked}
                        className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            hasLocked
                                ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/30 cursor-default font-extrabold shadow-xs'
                                : 'bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white shadow-[0_4px_16px_rgba(37,99,235,0.35)] active:scale-[0.98]'
                        }`}
                    >
                        {isLoading ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : hasLocked ? (
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded bg-emerald-600 inline-block" />
                                Deal Locked by You
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                Lock Deal (Commit)
                            </span>
                        )}
                    </button>
                    {!hasLocked && (
                        <p className="text-[10px] text-slate-400 text-center font-medium">Both parties must lock to initiate the local meetup handshake</p>
                    )}
                </div>
            )}

            {/* ── 2. Fulfillment Phase ── */}
            {offer.status === 'awaiting_fulfillment' && (
                <div className="px-3 pb-3 space-y-2.5">
                    {/* Buyer PIN display card */}
                    {isBuyer && offer.pickupPin && (
                        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 rounded-xl p-4 text-center shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded text-[9px] font-black uppercase tracking-widest inline-block mb-1">
                                YOUR 6-DIGIT EXCHANGE CODE
                            </span>
                            <p className="text-3xl font-mono font-black tracking-[0.25em] text-white select-all my-1.5 drop-shadow-sm">
                                {offer.pickupPin}
                            </p>
                            <p className="text-[11px] text-slate-300 font-medium max-w-xs mx-auto leading-relaxed">
                                Share this secret code with <strong className="text-white">{otherPartyName}</strong> in person only after inspecting and testing the item thoroughly.
                            </p>
                        </div>
                    )}

                    {/* Seller PIN verification input */}
                    {isSeller && !hasFulfilled && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-xs">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-900">Enter Buyer's Exchange PIN:</span>
                                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded text-[9px] font-black uppercase">INSTANT VERIFY</span>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={pinInput}
                                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                                    placeholder="6-digit PIN"
                                    className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-center font-mono font-black text-base tracking-[0.2em] text-[#0F172A] focus:ring-2 focus:ring-[#22C55E] focus:border-[#16A34A] focus:outline-none shadow-inner"
                                />
                                <button
                                    onClick={() => handleVerifyPickup(pinInput)}
                                    disabled={isLoading || pinInput.length !== 6}
                                    className="px-5 py-2.5 bg-gradient-to-r from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow-[0_4px_14px_rgba(22,163,74,0.35)] active:scale-[0.98]"
                                >
                                    Verify
                                </button>
                            </div>
                        </div>
                    )}

                    {otherHasFulfilled && (
                        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3.5 py-2.5">
                            <span className="px-1.5 py-0.5 bg-[#16A34A] text-white rounded text-[9px] font-black uppercase tracking-wider shadow-xs">CONFIRMED</span>
                            <p className="text-xs text-emerald-950 font-bold">
                                {otherPartyName} confirmed exchange — please verify on your end!
                            </p>
                        </div>
                    )}

                    {hasFulfilled ? (
                        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3.5 py-3">
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-xs font-black shadow-xs">✓</span>
                                <span className="text-xs font-bold text-emerald-900">Exchange confirmed on your side</span>
                            </div>
                            {!otherHasFulfilled && (
                                <span className="text-[10px] text-slate-500 font-semibold italic">Waiting for {otherPartyName}...</span>
                            )}
                        </div>
                    ) : showConfirmExchange ? (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5">
                            <p className="text-xs text-amber-950 font-bold mb-2.5">Confirming will mark this trade as fulfilled and release any obligations. Proceed?</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowConfirmExchange(false)}
                                    className="flex-1 py-2 bg-white text-slate-700 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleVerifyPickup()}
                                    disabled={isLoading}
                                    className="flex-1 py-2 bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white rounded-lg text-xs font-black uppercase tracking-wider hover:from-[#16A34A] hover:to-[#15803D] active:scale-[0.98] transition shadow-[0_4px_14px_rgba(22,163,74,0.35)]"
                                >
                                    {isLoading ? 'Confirming...' : 'Yes, Confirm Exchange'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowConfirmExchange(true)}
                            className="w-full py-3 bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white rounded-xl font-black text-xs uppercase tracking-wider hover:from-[#16A34A] hover:to-[#15803D] active:scale-[0.98] transition shadow-[0_4px_16px_rgba(22,163,74,0.35)] flex items-center justify-center gap-1.5"
                        >
                            <span>Confirm Exchange</span>
                            <span className="text-sm">→</span>
                        </button>
                    )}

                    {/* Dispute link */}
                    <button
                        onClick={() => setShowDisputeModal(true)}
                        className="w-full text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-rose-600 py-1 transition flex items-center justify-center gap-1"
                    >
                        Report Issue / Dispute Trade
                    </button>
                </div>
            )}

            {/* ── 3. Completed ── */}
            {offer.status === 'completed' && (
                <div className="text-center px-3 pb-3">
                    <div className="bg-[#F0FDF4] rounded-lg py-3 flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 text-[#16A34A]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        <span className="text-sm font-bold text-[#14532D]">Trade Complete</span>
                    </div>
                </div>
            )}

            {/* Dispute Modal */}
            {showDisputeModal && (
                <div className="fixed inset-0 bg-black/50 z-[10050] flex items-center justify-center p-4" onClick={() => setShowDisputeModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-base font-bold text-red-600 flex items-center gap-2 mb-2">
                            Report Issue / Dispute
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

            {showLockCelebration && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-50 flex items-center justify-center">
                    <style>{`
                        @keyframes floatUp {
                            0% {
                                transform: translate(0, 0) scale(0.5);
                                opacity: 0;
                            }
                            15% {
                                opacity: 1;
                            }
                            100% {
                                transform: translate(var(--tw-translateX), var(--tw-translateY)) scale(1.2);
                                opacity: 0;
                            }
                        }
                        .animate-sparkle {
                            animation: floatUp 1.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
                        }
                    `}</style>
                    {[...Array(24)].map((_, i) => {
                        const randomX = (Math.random() * 240 - 120).toFixed(0);
                        const randomY = (Math.random() * -200 - 60).toFixed(0);
                        const delay = (Math.random() * 0.5).toFixed(2);
                        const colors = ['bg-amber-400', 'bg-purple-500', 'bg-blue-400', 'bg-emerald-400', 'bg-pink-500', 'bg-indigo-500'];
                        const color = colors[i % colors.length];
                        const size = i % 2 === 0 ? 'w-2 h-2' : 'w-1.5 h-1.5';
                        return (
                            <div
                                key={i}
                                className={`absolute rounded-full ${color} ${size} animate-sparkle`}
                                style={{
                                    '--tw-translateX': `${randomX}px`,
                                    '--tw-translateY': `${randomY}px`,
                                    animationDelay: `${delay}s`
                                } as any}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
