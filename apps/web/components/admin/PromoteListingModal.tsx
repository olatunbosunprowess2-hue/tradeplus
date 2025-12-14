'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';

interface PromoteListingModalProps {
    listingId: string;
    listingTitle: string;
    onClose: () => void;
    onSuccess: () => void;
}

const PLACEMENTS = [
    { value: 'homepage', label: 'Homepage', description: 'Featured on the main homepage' },
    { value: 'category', label: 'Category Page', description: 'Top of category listings' },
    { value: 'search', label: 'Search Results', description: 'Boosted in search results' },
    { value: 'all', label: 'All Placements', description: 'Maximum exposure everywhere' },
];

const DURATIONS = [
    { value: 1, label: '1 Day', description: 'Quick boost' },
    { value: 3, label: '3 Days', description: 'Weekend special' },
    { value: 7, label: '7 Days', description: 'Week-long campaign' },
];

export default function PromoteListingModal({
    listingId,
    listingTitle,
    onClose,
    onSuccess,
}: PromoteListingModalProps) {
    const [placement, setPlacement] = useState('homepage');
    const [duration, setDuration] = useState(3);
    const [price, setPrice] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [promoting, setPromoting] = useState(false);

    useEffect(() => {
        fetchPrice();
    }, [placement, duration]);

    const fetchPrice = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/promoted-listings/price?duration=${duration}&placement=${placement}`);
            setPrice(res.data.priceCents);
        } catch (error) {
            console.error('Failed to fetch price:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = async () => {
        setPromoting(true);
        try {
            await apiClient.post('/promoted-listings/promote', {
                listingId,
                placement,
                durationDays: duration,
            });
            onSuccess();
            onClose();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to promote listing');
        } finally {
            setPromoting(false);
        }
    };

    const formatPrice = (cents: number) => {
        return `₦${(cents / 100).toLocaleString()}`;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
                    <h2 className="text-xl font-bold">⭐ Promote Listing</h2>
                    <p className="text-sm text-white/80 mt-1 truncate">{listingTitle}</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Placement Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Select Placement
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {PLACEMENTS.map((p) => (
                                <button
                                    key={p.value}
                                    onClick={() => setPlacement(p.value)}
                                    className={`p-3 rounded-xl border-2 text-left transition ${placement === p.value
                                            ? 'border-amber-500 bg-amber-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="font-medium text-gray-900">{p.label}</span>
                                    <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Duration Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Duration
                        </label>
                        <div className="flex gap-3">
                            {DURATIONS.map((d) => (
                                <button
                                    key={d.value}
                                    onClick={() => setDuration(d.value)}
                                    className={`flex-1 p-3 rounded-xl border-2 text-center transition ${duration === d.value
                                            ? 'border-amber-500 bg-amber-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="font-bold text-gray-900">{d.label}</span>
                                    <p className="text-xs text-gray-500">{d.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price Display */}
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className="text-sm text-gray-500 mb-1">Total Price</p>
                        {loading ? (
                            <div className="animate-pulse h-8 w-24 bg-gray-200 rounded mx-auto"></div>
                        ) : (
                            <p className="text-3xl font-bold text-gray-900">
                                {price ? formatPrice(price) : '—'}
                            </p>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
                        <span className="font-bold">✨ Benefits of Promotion:</span>
                        <ul className="mt-1 ml-4 list-disc space-y-0.5">
                            <li>Featured badge on listing</li>
                            <li>Priority placement in search</li>
                            <li>Increased visibility and views</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4 flex gap-3 justify-end bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePromote}
                        disabled={promoting || !price}
                        className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg transition disabled:opacity-50"
                    >
                        {promoting ? 'Promoting...' : `Promote for ${price ? formatPrice(price) : '...'}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
