'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { listingsApi } from '@/lib/listings-api';
import type { Listing } from '@/lib/types';

interface MakeOfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    listing: {
        id: string;
        title: string;
        image: string;
        sellerName: string;
        sellerLocation: string;
    };
    onSubmit: (offerData: {
        offerType: 'cash' | 'barter' | 'both';
        cashAmount?: number;
        currency?: string;
        offeredItems?: { listingId: string; quantity: number }[];
        message: string;
    }) => void;
}

export default function MakeOfferModal({ isOpen, onClose, listing, onSubmit }: MakeOfferModalProps) {
    const { user } = useAuthStore();
    const [offerType, setOfferType] = useState<'cash' | 'barter' | 'both'>('cash');
    const [cashAmount, setCashAmount] = useState('');
    const [currency, setCurrency] = useState('NGN');
    const [message, setMessage] = useState('');

    // Barter selection state
    const [userListings, setUserListings] = useState<Listing[]>([]);
    const [selectedListingIds, setSelectedListingIds] = useState<Set<string>>(new Set());
    const [isLoadingListings, setIsLoadingListings] = useState(false);
    const [barterMethod, setBarterMethod] = useState<'select' | 'manual'>('select');
    const [manualDescription, setManualDescription] = useState('');

    // Fetch user listings when modal opens and barter is involved
    useEffect(() => {
        if (isOpen && user && (offerType === 'barter' || offerType === 'both')) {
            const fetchListings = async () => {
                setIsLoadingListings(true);
                try {
                    const listings = await listingsApi.getAll({ sellerId: user.id });
                    setUserListings(listings);
                } catch (error) {
                    console.error('Failed to fetch user listings:', error);
                } finally {
                    setIsLoadingListings(false);
                }
            };
            fetchListings();
        }
    }, [isOpen, user, offerType]);

    if (!isOpen) return null;

    const toggleListingSelection = (listingId: string) => {
        const newSelected = new Set(selectedListingIds);
        if (newSelected.has(listingId)) {
            newSelected.delete(listingId);
        } else {
            newSelected.add(listingId);
        }
        setSelectedListingIds(newSelected);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const offeredItems = barterMethod === 'select' ? Array.from(selectedListingIds).map(id => ({
            listingId: id,
            quantity: 1
        })) : undefined;

        let finalMessage = message;
        if ((offerType === 'barter' || offerType === 'both') && barterMethod === 'manual') {
            finalMessage = `[OFFERED ITEM]: ${manualDescription}\n\n${message}`;
        }

        const offerData = {
            offerType,
            cashAmount: (offerType === 'cash' || offerType === 'both') ? parseFloat(cashAmount) : undefined,
            currency: (offerType === 'cash' || offerType === 'both') ? currency : undefined,
            offeredItems,
            message: finalMessage,
        };

        onSubmit(offerData);

        // Reset form
        setCashAmount('');
        setSelectedListingIds(new Set());
        setMessage('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Make an Offer</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Listing Info */}
                <div className="flex gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <img src={listing.image} alt={listing.title} className="w-16 h-16 rounded-lg object-cover" />
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm">{listing.title}</h3>
                        <p className="text-xs text-gray-600">by {listing.sellerName}</p>
                        <p className="text-xs text-gray-500">{listing.sellerLocation}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Offer Type */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">
                            Offer Type <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            {(['cash', 'barter', 'both'] as const).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setOfferType(type)}
                                    className={`flex-1 py-2.5 px-3 rounded-lg font-semibold text-sm transition-all border-2 ${offerType === type
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                                        }`}
                                >
                                    {type === 'cash' ? 'Cash' : type === 'barter' ? (
                                        <span className="flex items-center justify-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7H4m0 0l4-4m-4 4l4 4m0 6h12m0 0l-4 4m4-4l-4-4" />
                                            </svg>
                                            Barter
                                        </span>
                                    ) : 'Both'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cash Amount */}
                    {(offerType === 'cash' || offerType === 'both') && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Cash Amount <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="px-3 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg font-bold text-gray-700 cursor-pointer"
                                >
                                    <option value="NGN">₦ NGN</option>
                                    <option value="USD">$ USD</option>
                                    <option value="GHS">₵ GHS</option>
                                    <option value="KES">KSh KES</option>
                                    <option value="ZAR">R ZAR</option>
                                </select>
                                <input
                                    type="number"
                                    required={offerType === 'cash' || offerType === 'both'}
                                    min="0"
                                    step="0.01"
                                    value={cashAmount}
                                    onChange={(e) => setCashAmount(e.target.value)}
                                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-gray-900 font-medium transition-colors"
                                    placeholder="Enter amount"
                                />
                            </div>
                        </div>
                    )}

                    {/* Barter Items Selection */}
                    {(offerType === 'barter' || offerType === 'both') && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                What are you offering? <span className="text-red-500">*</span>
                            </label>

                            {/* Method Toggle */}
                            <div className="flex gap-2 mb-3 bg-gray-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setBarterMethod('select')}
                                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${barterMethod === 'select'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Select from Listings
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBarterMethod('manual')}
                                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${barterMethod === 'manual'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Describe Item
                                </button>
                            </div>

                            {barterMethod === 'select' ? (
                                <>
                                    {isLoadingListings ? (
                                        <div className="text-center py-4 text-gray-500">Loading your listings...</div>
                                    ) : userListings.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                            You have no active listings to offer.
                                            <button
                                                type="button"
                                                onClick={() => setBarterMethod('manual')}
                                                className="block mx-auto mt-2 text-blue-600 hover:underline text-sm"
                                            >
                                                Describe item instead
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                                            {userListings.map(item => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => toggleListingSelection(item.id)}
                                                    className={`flex items-center p-2 rounded-lg cursor-pointer border transition-all ${selectedListingIds.has(item.id)
                                                        ? 'bg-blue-50 border-blue-600'
                                                        : 'hover:bg-gray-50 border-transparent'
                                                        }`}
                                                >
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${selectedListingIds.has(item.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                                        }`}>
                                                        {selectedListingIds.has(item.id) && (
                                                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <img
                                                        src={item.images?.[0]?.url || 'https://via.placeholder.com/50'}
                                                        alt={item.title}
                                                        className="w-10 h-10 rounded object-cover mr-3"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {item.currencyCode} {((item.priceCents || 0) / 100).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {selectedListingIds.size === 0 && (
                                        <p className="text-xs text-red-500 mt-1">Please select at least one item to offer.</p>
                                    )}
                                </>
                            ) : (
                                <div>
                                    <textarea
                                        value={manualDescription}
                                        onChange={(e) => setManualDescription(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-gray-900 placeholder:text-gray-500 font-medium resize-none transition-colors"
                                        placeholder="Describe the item or service you are offering..."
                                    />
                                    {manualDescription.length === 0 && (
                                        <p className="text-xs text-red-500 mt-1">Please describe your item.</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-2">
                                        💡 You can upload images in the chat after the offer is accepted.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Message */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Message <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-gray-900 placeholder:text-gray-500 font-medium resize-none transition-colors"
                            placeholder="Introduce yourself and explain your offer..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={
                                (offerType !== 'cash' && barterMethod === 'select' && selectedListingIds.size === 0) ||
                                (offerType !== 'cash' && barterMethod === 'manual' && manualDescription.trim().length === 0)
                            }
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Send Offer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
