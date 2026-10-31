'use client';

import React, { useState, useEffect } from 'react';
import { KeyRound, CheckCircle2, Lock, AlertTriangle, X } from 'lucide-react';
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
                        <div className="bg-white border border-amber-200/90 rounded-xl p-2.5 flex items-center gap-2.5 shadow-[0_1px_4px_rgba(245,158,11,0.1)]">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-black text-[#0F172A]">{otherPartyName} committed</span>
                                    <span className="px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[8px] font-black uppercase tracking-wider">
                                        1/2 Locked
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium truncate">Lock your deal to begin safe exchange</p>
                            </div>
                            <span className="text-[10px] font-bold text-[#1D4ED8] shrink-0">
                                Lock now →
                            </span>
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

            {/* ── 2. Fulfillment Phase (Compact & Secure) ── */}
            {offer.status === 'awaiting_fulfillment' && (
                <div className="px-3 pb-3 space-y-2">
                    {/* Buyer PIN display (Balanced Micro-Card) */}
                    {isBuyer && !hasFulfilled && (
                        <div className="bg-[#0B1120] border border-slate-800 text-white rounded-2xl p-3 shadow-md space-y-2">
                            {/* Top Header: 6-Digit PIN & Live Status */}
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1.5 rounded-xl shadow-inner">
                                    <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span className="font-mono font-black text-lg tracking-[0.25em] text-white select-all">
                                        {(offer.pickupPin || offer.pickup_pin)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                    <span className="text-[10px] text-emerald-300 font-extrabold uppercase tracking-wider whitespace-nowrap">
                                        Awaiting Scan
                                    </span>
                                </div>
                            </div>

                            {/* Bottom: Full Untruncated Instructions */}
                            <div className="pt-1.5 border-t border-slate-800/80">
                                <p className="text-[11.5px] text-slate-300 font-medium leading-relaxed">
                                    Show this 6-digit code to <strong className="text-white font-bold">{otherPartyName}</strong> in person <span className="text-emerald-400 font-bold">only after</span> inspecting and testing your item.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Seller PIN verification input (Balanced Micro-Card) */}
                    {isSeller && !hasFulfilled && (
                        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 shadow-xs space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={pinInput}
                                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Enter 6-digit PIN"
                                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-center font-mono font-black text-base tracking-[0.25em] text-[#0F172A] focus:ring-2 focus:ring-[#22C55E] focus:border-[#16A34A] focus:outline-none shadow-inner placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400"
                                />
                                <button
                                    onClick={() => handleVerifyPickup(pinInput)}
                                    disabled={isLoading || pinInput.length !== 6}
                                    className="px-4 py-2.5 bg-gradient-to-r from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
                                >
                                    Verify Code
                                </button>
                            </div>
                            <div className="pt-1.5 border-t border-slate-200/80">
                                <p className="text-[11.5px] text-slate-600 font-medium leading-snug">
                                    Ask <strong className="text-slate-900 font-bold">{otherPartyName}</strong> for their 6-digit code after handing over the item.
                                </p>
                            </div>
                        </div>
                    )}

                    {hasFulfilled && (
                        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-[10px] font-black shadow-xs">✓</span>
                                <span className="text-xs font-bold text-emerald-900">Exchange confirmed & verified</span>
                            </div>
                        </div>
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

                        {/* ── 3. Completed — Short Headline with Corner Appeal ── */}
            {offer.status === 'completed' && (
                <div className="px-3 pb-2.5">
                    <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3 py-2 flex items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="px-1.5 py-0.5 bg-[#16A34A] text-white rounded text-[8px] font-black uppercase tracking-wider shrink-0 shadow-xs">
                                {isBuyer ? 'TRADE COMPLETED' : 'SOLD'}
                            </span>
                            <span className="text-[11.5px] font-extrabold text-emerald-950 truncate">
                                Deal Concluded
                            </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-[#16A34A] font-black flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> {isBuyer ? 'Sealed' : 'Closed'}
                            </span>
                            <span className="text-slate-300 text-xs">|</span>
                            <button
                                type="button"
                                onClick={() => setShowDisputeModal(true)}
                                className="text-[10px] font-bold text-slate-500 hover:text-rose-600 transition-colors underline underline-offset-2 flex items-center gap-0.5"
                            >
                                <AlertTriangle className="w-3 h-3 text-amber-500 inline" />
                                <span>Appeal</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dispute Modal */}
            {showDisputeModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10050] flex items-center justify-center p-4" onClick={() => setShowDisputeModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-[#0F172A]">
                                        Appeal / Report Trade Issue
                                    </h3>
                                    <span className="text-[10px] text-slate-500 font-medium">Trust &amp; Safety Investigation</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDisputeModal(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <p className="text-xs text-slate-500 mb-3.5 leading-relaxed font-medium">
                            If the item has undisclosed defects, wrong serial number, missing cash, or any other issue, describe it below. This freezes trader ratings and alerts support.
                        </p>

                        {/* Quick Common Presets */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {[
                                'Hidden Defect / Fault',
                                'Counterfeit / Replica',
                                'Incomplete Cash Balance',
                                'Other Issue',
                            ].map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setDisputeReason((prev) => prev ? `${preset}: ${prev}` : `${preset}: `)}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10.5px] font-bold transition-colors"
                                >
                                    + {preset}
                                </button>
                            ))}
                        </div>

                        {/* Dispute Explanation Text Area */}
                        <div className="mb-4">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                                <span>Describe the issue in detail:</span>
                                <span className="text-[10px] text-slate-400 font-normal">{disputeReason.length}/500</span>
                            </label>
                            <textarea
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                                maxLength={500}
                                placeholder="Explain what went wrong in detail (e.g., undisclosed screen flicker, wrong storage size, missing charger)..."
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-medium transition-all min-h-[90px] resize-none"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowDisputeModal(false)}
                                className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl text-xs transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDispute}
                                disabled={isLoading || !disputeReason.trim()}
                                className="flex-1 py-3 text-white font-black bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 disabled:opacity-40 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex justify-center items-center gap-1.5"
                            >
                                {isLoading ? 'Submitting...' : 'Submit Appeal Ticket'}
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
