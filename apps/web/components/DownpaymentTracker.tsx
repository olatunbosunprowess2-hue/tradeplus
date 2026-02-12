'use client';

import { useState } from 'react';
import type { BarterOffer } from '@/lib/types';
import { offersApi } from '@/lib/offers-api';
import { useToastStore } from '@/lib/toast-store';

interface DownpaymentTrackerProps {
    offer: BarterOffer;
    currentUserId: string;
    onUpdate: (updatedOffer: BarterOffer) => void;
}

const STEPS = [
    { key: 'awaiting_payment', label: 'Awaiting Payment', icon: '⏳' },
    { key: 'paid', label: 'Paid', icon: '💰' },
    { key: 'confirmed', label: 'Confirmed', icon: '✅' },
];

function getStepIndex(status: string): number {
    if (status === 'awaiting_payment') return 0;
    if (status === 'paid') return 1;
    if (status === 'confirmed') return 2;
    return -1;
}

export default function DownpaymentTracker({ offer, currentUserId, onUpdate }: DownpaymentTrackerProps) {
    const [loading, setLoading] = useState(false);
    const { addToast } = useToastStore();

    const isBuyer = offer.buyerId === currentUserId;
    const isSeller = offer.sellerId === currentUserId;
    const currentStep = getStepIndex(offer.downpaymentStatus);
    const downpaymentAmount = offer.listing?.downpaymentCents
        ? (Number(offer.listing.downpaymentCents) / 100).toFixed(2)
        : '0.00';
    const currency = offer.listing?.downpaymentCurrency || offer.currencyCode || 'NGN';

    // Don't show if no downpayment required
    if (offer.downpaymentStatus === 'none') return null;

    const handleMarkPaid = async () => {
        setLoading(true);
        try {
            const updated = await offersApi.markPaid(offer.id);
            addToast('success', 'Downpayment marked as paid! Seller has been notified.');
            onUpdate(updated);
        } catch (error: any) {
            addToast('error', error.response?.data?.message || 'Failed to mark as paid');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmReceipt = async () => {
        setLoading(true);
        try {
            const updated = await offersApi.confirmReceipt(offer.id);
            addToast('success', 'Downpayment receipt confirmed! Buyer has been notified.');
            onUpdate(updated);
        } catch (error: any) {
            addToast('error', error.response?.data?.message || 'Failed to confirm receipt');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Downpayment: {currency} {downpaymentAmount}
                </h4>
                {currentStep === 2 && (
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        Complete
                    </span>
                )}
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-1 mb-4">
                {STEPS.map((step, idx) => {
                    const isComplete = currentStep > idx;
                    const isCurrent = currentStep === idx;

                    return (
                        <div key={step.key} className="flex items-center flex-1">
                            {/* Step circle */}
                            <div className="flex flex-col items-center flex-1">
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                                    ${isComplete
                                        ? 'bg-green-500 text-white shadow-md'
                                        : isCurrent
                                            ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-300 ring-offset-1'
                                            : 'bg-gray-200 text-gray-400'
                                    }
                                `}>
                                    {isComplete ? '✓' : step.icon}
                                </div>
                                <span className={`text-[10px] mt-1 text-center font-medium ${isComplete ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-400'
                                    }`}>
                                    {step.label}
                                </span>
                            </div>
                            {/* Connector line */}
                            {idx < STEPS.length - 1 && (
                                <div className={`h-0.5 flex-1 mx-1 mt-[-14px] transition-all ${currentStep > idx ? 'bg-green-400' : 'bg-gray-200'
                                    }`} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Timestamps */}
            {offer.downpaymentPaidAt && (
                <p className="text-[10px] text-gray-500 mb-1">
                    💰 Paid: {new Date(offer.downpaymentPaidAt).toLocaleString()}
                </p>
            )}
            {offer.downpaymentConfirmedAt && (
                <p className="text-[10px] text-gray-500 mb-1">
                    ✅ Confirmed: {new Date(offer.downpaymentConfirmedAt).toLocaleString()}
                </p>
            )}

            {/* Action Buttons */}
            {isBuyer && offer.downpaymentStatus === 'awaiting_payment' && (
                <button
                    onClick={handleMarkPaid}
                    disabled={loading}
                    className="w-full mt-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                        <>💰 Mark Downpayment as Paid</>
                    )}
                </button>
            )}

            {isSeller && offer.downpaymentStatus === 'paid' && (
                <button
                    onClick={handleConfirmReceipt}
                    disabled={loading}
                    className="w-full mt-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                        <>✅ Confirm Downpayment Received</>
                    )}
                </button>
            )}

            {/* Status messages for non-actionable party */}
            {isSeller && offer.downpaymentStatus === 'awaiting_payment' && (
                <p className="text-xs text-gray-500 italic mt-2 text-center">
                    Waiting for buyer to send the downpayment...
                </p>
            )}
            {isBuyer && offer.downpaymentStatus === 'paid' && (
                <p className="text-xs text-gray-500 italic mt-2 text-center">
                    Waiting for seller to confirm receipt...
                </p>
            )}
        </div>
    );
}
