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
        allowCash?: boolean;
        allowBarter?: boolean;
        allowCashPlusBarter?: boolean;
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

    // Initialize offer type based on what's allowed
    const [offerType, setOfferType] = useState<'cash' | 'barter' | 'both'>(() => {
        if (listing.allowCash) return 'cash';
        if (listing.allowBarter) return 'barter';
        if (listing.allowCashPlusBarter) return 'both';
        return 'cash'; // Fallback
    });

    const [cashAmount, setCashAmount] = useState('');
    const [currency, setCurrency] = useState('NGN');

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
                    const response = await listingsApi.getAll({ sellerId: user.id });
                    // Handle both paginated and non-paginated responses
                    const listings = Array.isArray(response) ? response : (response.data || []);
                    setUserListings(listings);
                } catch (error) {
                    console.error('Failed to fetch user listings:', error);
                    setUserListings([]); // Set to empty array on error
                } finally {
                    setIsLoadingListings(false);
                }
            };
            fetchListings();
        }
    }, [isOpen, user, offerType]);

    // Reset offer type when modal opens if needed
    useEffect(() => {
        if (isOpen) {
            if (listing.allowCash) setOfferType('cash');
            else if (listing.allowBarter) setOfferType('barter');
            else if (listing.allowCashPlusBarter) setOfferType('both');
        }
    }, [isOpen, listing]);

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

        // If using manual barter entry, pass description as message
        const message = (offerType === 'barter' || offerType === 'both') && barterMethod === 'manual'
            ? `I'm offering: ${manualDescription}`
            : undefined;

        let parsedCashAmount: number | undefined = undefined;
        if (offerType === 'cash' || offerType === 'both') {
            parsedCashAmount = parseFloat(cashAmount);
            if (isNaN(parsedCashAmount)) {
                alert('Please enter a valid cash amount');
                return;
            }
        }

        const offerData = {
            offerType,
            cashAmount: parsedCashAmount,
            currency: (offerType === 'cash' || offerType === 'both') ? currency : undefined,
            offeredItems,
            message,
        };

        onSubmit(offerData);

        // Reset form
        setCashAmount('');
        setSelectedListingIds(new Set());
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-[95%] max-w-lg p-0 shadow-2xl max-h-[85vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200 mx-auto">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Make an Offer</h2>
                        <p className="text-xs text-gray-500 mt-1">Negotiate a fair deal with the seller</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-full"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar">
                    {/* Target Listing Card */}
                    <div className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 items-center">
                        <img
                            src={listing.image}
                            alt={listing.title}
                            className="w-16 h-16 rounded-lg object-cover shadow-sm border border-white"
                        />
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">Target Item</p>
                            <h3 className="font-bold text-gray-900 text-base leading-tight">{listing.title}</h3>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-600">
                                <span className="font-medium">{listing.sellerName}</span>
                                <span>•</span>
                                <span>{listing.sellerLocation}</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Offer Type Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                How do you want to pay?
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {listing.allowCash && (
                                    <button
                                        type="button"
                                        onClick={() => setOfferType('cash')}
                                        className={`relative py-3 px-2 rounded-xl font-bold text-xs transition-all border-2 flex flex-col items-center gap-1 ${offerType === 'cash'
                                            ? 'bg-gray-900 text-white border-gray-900 shadow-lg scale-[1.02]'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-xl">💵</span>
                                        <span>Cash</span>
                                        {offerType === 'cash' && (
                                            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                        )}
                                    </button>
                                )}
                                {listing.allowBarter && (
                                    <button
                                        type="button"
                                        onClick={() => setOfferType('barter')}
                                        className={`relative py-3 px-2 rounded-xl font-bold text-xs transition-all border-2 flex flex-col items-center gap-1 ${offerType === 'barter'
                                            ? 'bg-gray-900 text-white border-gray-900 shadow-lg scale-[1.02]'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-xl">🔄</span>
                                        <span>Barter</span>
                                        {offerType === 'barter' && (
                                            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                        )}
                                    </button>
                                )}
                                {listing.allowCashPlusBarter && (
                                    <button
                                        type="button"
                                        onClick={() => setOfferType('both')}
                                        className={`relative py-3 px-2 rounded-xl font-bold text-xs transition-all border-2 flex flex-col items-center gap-1 ${offerType === 'both'
                                            ? 'bg-gray-900 text-white border-gray-900 shadow-lg scale-[1.02]'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-xl">⚖️</span>
                                        <span>Both</span>
                                        {offerType === 'both' && (
                                            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Cash Amount Input */}
                        {(offerType === 'cash' || offerType === 'both') && (
                            <div className="animate-in slide-in-from-top-2 duration-200">
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Cash Amount
                                </label>
                                <div className="flex rounded-xl shadow-sm">
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="px-4 py-3 bg-gray-50 border-2 border-r-0 border-gray-200 rounded-l-xl font-bold text-gray-700 focus:ring-0 focus:border-gray-300 transition-colors cursor-pointer hover:bg-gray-100"
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
                                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-r-xl focus:ring-0 focus:border-gray-900 text-gray-900 font-bold text-lg placeholder:text-gray-300 transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Barter Items Section */}
                        {(offerType === 'barter' || offerType === 'both') && (
                            <div className="animate-in slide-in-from-top-2 duration-200 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="block text-sm font-bold text-gray-900">
                                        Your Offering
                                    </label>
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => setBarterMethod('select')}
                                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${barterMethod === 'select'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            Select Item
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBarterMethod('manual')}
                                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${barterMethod === 'manual'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            Manual Entry
                                        </button>
                                    </div>
                                </div>

                                {barterMethod === 'select' ? (
                                    <div className="space-y-3">
                                        {isLoadingListings ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mb-2"></div>
                                                <span className="text-sm font-medium">Loading your inventory...</span>
                                            </div>
                                        ) : userListings.length === 0 ? (
                                            <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                                <p className="text-gray-500 font-medium mb-2">No active listings found</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setBarterMethod('manual')}
                                                    className="text-gray-900 hover:text-black font-bold text-sm hover:underline"
                                                >
                                                    Describe your item manually →
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                                                {userListings.map(item => (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => toggleListingSelection(item.id)}
                                                        className={`group flex items-center p-3 rounded-xl cursor-pointer border-2 transition-all duration-200 ${selectedListingIds.has(item.id)
                                                            ? 'bg-gray-50 border-gray-900 shadow-sm'
                                                            : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${selectedListingIds.has(item.id)
                                                            ? 'bg-gray-900 border-gray-900'
                                                            : 'border-gray-300 group-hover:border-gray-400'
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
                                                            className="w-12 h-12 rounded-lg object-cover mr-3 bg-gray-100"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-bold truncate ${selectedListingIds.has(item.id) ? 'text-gray-900' : 'text-gray-700'}`}>
                                                                {item.title}
                                                            </p>
                                                            <p className="text-xs text-gray-500 font-medium">
                                                                {item.currencyCode} {((item.priceCents || 0) / 100).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <textarea
                                            value={manualDescription}
                                            onChange={(e) => setManualDescription(e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-gray-900 text-gray-900 placeholder:text-gray-400 font-medium resize-none transition-all bg-gray-50 focus:bg-white"
                                            placeholder="Describe what you're offering (e.g., 'Brand new iPhone 13, Blue, 128GB')"
                                        />
                                        <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-medium">
                                            Manual Entry
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}


                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3.5 border-2 border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    (offerType !== 'cash' && barterMethod === 'select' && selectedListingIds.size === 0) ||
                                    (offerType !== 'cash' && barterMethod === 'manual' && manualDescription.trim().length === 0)
                                }
                                className="flex-1 px-6 py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform active:scale-[0.98]"
                            >
                                Send Offer 🚀
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
