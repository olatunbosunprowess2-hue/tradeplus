'use client';

import { useState } from 'react';
import type { BarterOffer } from '@/lib/types';
import Image from 'next/image';

interface OfferReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    offer: BarterOffer;
    onAccept: (offerId: string) => void;
    onDecline: (offerId: string) => void;
    onCounter: (offerId: string) => void;
    isProcessing?: boolean;
}

export default function OfferReviewModal({
    isOpen,
    onClose,
    offer,
    onAccept,
    onDecline,
    onCounter,
    isProcessing = false
}: OfferReviewModalProps) {
    if (!isOpen) return null;

    const isCashOnly = offer.items.length === 0 && offer.offeredCashCents > 0;
    const isBarterOnly = offer.items.length > 0 && offer.offeredCashCents === 0;
    const isMixed = offer.items.length > 0 && offer.offeredCashCents > 0;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Review Offer</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Received from <span className="font-semibold text-blue-600">{offer.buyer.profile?.displayName || offer.buyer.name || offer.buyer.email}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-full"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {/* Offer Summary Card */}
                    <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-6 mb-8">
                        <div className="flex items-center justify-center gap-8">
                            {/* Target Item (Yours) */}
                            <div className="text-center">
                                <div className="relative inline-block">
                                    <img
                                        src={offer.listing.images[0]?.url || 'https://via.placeholder.com/150'}
                                        alt={offer.listing.title}
                                        className="w-24 h-24 rounded-xl object-cover shadow-md border-2 border-white"
                                    />
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100 text-xs font-bold text-gray-600 whitespace-nowrap">
                                        Your Item
                                    </div>
                                </div>
                                <p className="mt-4 font-bold text-gray-900 text-sm max-w-[120px] truncate mx-auto">{offer.listing.title}</p>
                            </div>

                            {/* Exchange Icon */}
                            <div className="flex flex-col items-center justify-center text-blue-500">
                                <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </div>

                            {/* Offered Items (Theirs) */}
                            <div className="text-center">
                                {isCashOnly ? (
                                    <div className="w-24 h-24 rounded-xl bg-green-100 flex items-center justify-center border-2 border-green-200 shadow-md">
                                        <span className="text-3xl">💵</span>
                                    </div>
                                ) : (
                                    <div className="relative inline-block">
                                        <img
                                            src={offer.items[0]?.offeredListing.images[0]?.url || 'https://via.placeholder.com/150'}
                                            alt="Offered Item"
                                            className="w-24 h-24 rounded-xl object-cover shadow-md border-2 border-white"
                                        />
                                        {offer.items.length > 1 && (
                                            <div className="absolute -top-2 -right-2 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">
                                                +{offer.items.length - 1}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="mt-4 font-bold text-gray-900 text-sm">
                                    {isCashOnly ? (
                                        <span className="text-green-600 text-lg">
                                            {offer.currencyCode} {(offer.offeredCashCents / 100).toLocaleString()}
                                        </span>
                                    ) : (
                                        <span className="max-w-[120px] truncate block mx-auto">
                                            {offer.items[0]?.offeredListing.title}
                                            {offer.items.length > 1 && ' & more'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="space-y-6">
                        <h3 className="font-bold text-gray-900 border-b pb-2">Offer Details</h3>

                        {/* Cash Component */}
                        {(isCashOnly || isMixed) && (
                            <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-100">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">💰</span>
                                    <div>
                                        <p className="font-bold text-green-900">Cash Offer</p>
                                        <p className="text-xs text-green-700">Direct payment</p>
                                    </div>
                                </div>
                                <span className="font-bold text-xl text-green-700">
                                    {offer.currencyCode} {(offer.offeredCashCents / 100).toLocaleString()}
                                </span>
                            </div>
                        )}

                        {/* Items Component */}
                        {(isBarterOnly || isMixed) && (
                            <div className="space-y-3">
                                <p className="text-sm font-bold text-gray-700">Items Offered:</p>
                                {offer.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                        <img
                                            src={item.offeredListing.images[0]?.url || 'https://via.placeholder.com/50'}
                                            alt={item.offeredListing.title}
                                            className="w-12 h-12 rounded-lg object-cover"
                                        />
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900">{item.offeredListing.title}</p>
                                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                        <a
                                            href={`/listings/${item.offeredListingId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-700 text-sm font-bold hover:underline"
                                        >
                                            View Item
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Message */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Message from Buyer</p>
                            <p className="text-gray-700 italic">"{offer.message}"</p>
                        </div>
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex gap-3">
                    <button
                        onClick={() => onDecline(offer.id)}
                        disabled={isProcessing}
                        className="flex-1 px-6 py-3 border-2 border-red-100 text-red-600 rounded-xl font-bold hover:bg-red-50 hover:border-red-200 transition disabled:opacity-50"
                    >
                        Decline
                    </button>
                    <button
                        onClick={() => onCounter(offer.id)}
                        disabled={isProcessing}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-white hover:border-gray-400 transition disabled:opacity-50"
                    >
                        Counter Offer
                    </button>
                    <button
                        onClick={() => onAccept(offer.id)}
                        disabled={isProcessing}
                        className="flex-[2] px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-200 disabled:opacity-50"
                    >
                        {isProcessing ? 'Processing...' : 'Accept Offer'}
                    </button>
                </div>
            </div>
        </div>
    );
}
