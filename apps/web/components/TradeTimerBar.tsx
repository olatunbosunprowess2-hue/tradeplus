'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BarterOffer } from '@/lib/types';
import { offersApi } from '@/lib/offers-api';
import { useToastStore } from '@/lib/toast-store';

interface TradeTimerBarProps {
    offer: BarterOffer;
    currentUserId: string;
    onUpdate?: (updatedOffer: BarterOffer) => void;
}

function getTimerState(expiresAt: string, pausedAt?: string | null) {
    if (pausedAt) {
        // Timer frozen — calculate remaining from when it was paused
        const pausedTime = new Date(pausedAt).getTime();
        const expiryTime = new Date(expiresAt).getTime();
        const remaining = Math.max(0, expiryTime - pausedTime);
        return { remaining, isPaused: true, isExpired: remaining <= 0 };
    }

    const now = Date.now();
    const expiryTime = new Date(expiresAt).getTime();
    const remaining = Math.max(0, expiryTime - now);
    return { remaining, isPaused: false, isExpired: remaining <= 0 };
}

function formatTime(ms: number): string {
    if (ms <= 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getTimerColor(remaining: number, isPaused: boolean, isMeetupPhase: boolean): {
    bg: string; text: string; border: string; ring: string; icon: string; progressBg: string;
} {
    if (isPaused) {
        return {
            bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200',
            ring: 'ring-blue-400', icon: '⏸️', progressBg: 'bg-blue-400',
        };
    }
    if (isMeetupPhase) {
        const days = remaining / (60000 * 60 * 24);
        if (days <= 1) {
            return {
                bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200',
                ring: 'ring-amber-400', icon: '📅', progressBg: 'bg-amber-400',
            };
        }
        return {
            bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200',
            ring: 'ring-indigo-400', icon: '📅', progressBg: 'bg-indigo-500',
        };
    }
    const minutes = remaining / 60000;
    if (minutes <= 5) {
        return {
            bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200',
            ring: 'ring-red-400', icon: '🔴', progressBg: 'bg-red-500',
        };
    }
    if (minutes <= 10) {
        return {
            bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200',
            ring: 'ring-amber-400', icon: '🟡', progressBg: 'bg-amber-400',
        };
    }
    return {
        bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',
        ring: 'ring-emerald-400', icon: '🟢', progressBg: 'bg-emerald-500',
    };
}

export default function TradeTimerBar({ offer, currentUserId, onUpdate }: TradeTimerBarProps) {
    const [remaining, setRemaining] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isExpired, setIsExpired] = useState(false);
    const [extending, setExtending] = useState(false);
    const { addToast } = useToastStore();

    const isSeller = offer.sellerId === currentUserId;
    const isBuyer = offer.buyerId === currentUserId;
    const isMeetupPhase = offer.status === 'awaiting_meetup';
    const canExtend = offer.extensionCount < 3;

    // Calculate timer state
    const updateTimer = useCallback(() => {
        if (!offer.timerExpiresAt) return;
        const state = getTimerState(offer.timerExpiresAt, offer.timerPausedAt);
        setRemaining(state.remaining);
        setIsPaused(state.isPaused);
        setIsExpired(state.isExpired);
    }, [offer.timerExpiresAt, offer.timerPausedAt]);

    // Tick every second
    useEffect(() => {
        updateTimer();
        if (isPaused || isExpired) return;

        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [updateTimer, isPaused, isExpired]);

    // Don't render if no timer or offer not in an active trade phase
    if (!offer.timerExpiresAt || (offer.status !== 'accepted' && offer.status !== 'awaiting_meetup')) return null;

    const colors = getTimerColor(remaining, isPaused, isMeetupPhase);
    const timeDisplay = formatTime(remaining);

    const handleExtend = async () => {
        setExtending(true);
        try {
            const result = await offersApi.extendTimer(offer.id);
            if ('message' in result) {
                addToast('success', result.message);
            } else {
                addToast('success', isSeller ? 'Timer extended by 30 minutes!' : 'Extension request sent to seller.');
                onUpdate?.(result as BarterOffer);
            }
        } catch (error: any) {
            addToast('error', error.response?.data?.message || 'Failed to extend timer');
        } finally {
            setExtending(false);
        }
    };

    return (
        <div className={`
            ${colors.bg} ${colors.border} border rounded-xl px-4 py-3
            transition-all duration-300 animate-in fade-in slide-in-from-top-2
        `}>
            <div className="flex items-center justify-between gap-3">
                {/* Timer Display */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`
                        w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center
                        border-2 ${colors.border} ${!isPaused && remaining < 300000 ? 'animate-pulse' : ''}
                    `}>
                        <span className="text-lg">{colors.icon}</span>
                    </div>
                    <div className="min-w-0">
                        <div className={`font-mono text-lg font-bold ${colors.text} tabular-nums`}>
                            {timeDisplay}
                        </div>
                        <p className={`text-[11px] font-medium ${colors.text} opacity-80 truncate`}>
                            {isExpired
                                ? (isMeetupPhase ? 'Meetup deadline expired — under review' : 'Trade timer expired')
                                : isPaused
                                    ? '⏸️ Timer Paused: Waiting for Seller to verify payment in their bank app. Trade will not expire while paused.'
                                    : isMeetupPhase
                                        ? 'remaining to meet up & exchange'
                                        : 'remaining to complete trade'
                            }
                        </p>
                    </div>
                </div>

                {/* Extend Button */}
                {canExtend && !isExpired && !isPaused && (
                    <button
                        onClick={handleExtend}
                        disabled={extending}
                        className={`
                            flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold
                            transition-all duration-200 whitespace-nowrap
                            ${isSeller
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                                : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50 shadow-sm'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        {extending ? (
                            <span className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        {isSeller ? '+30 min' : 'Request Time'}
                    </button>
                )}

                {/* Extension Count Badge */}
                {offer.extensionCount > 0 && (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                        {offer.extensionCount}/3 ext
                    </span>
                )}
            </div>

            {/* Progress Bar */}
            {!isPaused && !isExpired && (
                <div className="mt-2.5 h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${colors.progressBg} rounded-full transition-all duration-1000 ease-linear`}
                        style={{
                            width: `${Math.min(100, (remaining / (isMeetupPhase ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000)) * 100)}%`,
                        }}
                    />
                </div>
            )}

            {/* Max Extensions Warning */}
            {!canExtend && !isExpired && (
                <p className="mt-2 text-[10px] text-gray-500 text-center italic">
                    Maximum extensions reached — no additional time can be added
                </p>
            )}
        </div>
    );
}
