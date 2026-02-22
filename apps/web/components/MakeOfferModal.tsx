'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { listingsApi } from '@/lib/listings-api';
import type { Listing } from '@/lib/types';
import { sanitizeUrl } from '@/lib/utils';

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
        downpaymentCents?: number;
        currencyCode?: string;
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
    const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
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
                    setUserListings(response.data || []);
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

    // Enforce downpayment rules
    useEffect(() => {
        if (isOpen && listing.downpaymentCents && listing.downpaymentCents > 0) {
            // Cannot be barter-only if downpayment is required
            if (offerType === 'barter') {
                setOfferType('both');
            }
        }
    }, [isOpen, listing, offerType]);

    if (!isOpen) return null;

    const toggleListingSelection = (listingId: string) => {
        setSelectedItems(prev => {
            const next = { ...prev };
            if (next[listingId]) {
                delete next[listingId];
            } else {
                next[listingId] = 1;
            }
            return next;
        });
    };

    const updateItemQuantity = (listingId: string, quantity: number) => {
        setSelectedItems(prev => {
            if (!prev[listingId]) return prev;
            return {
                ...prev,
                [listingId]: Math.max(1, quantity)
            };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const offeredItems = barterMethod === 'select' ? Object.entries(selectedItems).map(([id, qty]) => ({
            listingId: id,
            quantity: qty
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

        // Validate Downpayment
        if (listing.downpaymentCents && listing.downpaymentCents > 0) {
            const cashCents = parsedCashAmount ? Math.round(parsedCashAmount * 100) : 0;
            if (cashCents < listing.downpaymentCents) {
                alert(`This listing requires a minimum downpayment of ${(listing.currencyCode || 'NGN')} ${(listing.downpaymentCents / 100).toLocaleString()}. Please increase your cash offer.`);
                return;
            }
        }

        const offerData = {
            offerType,
            cashAmount: parsedCashAmount,
            currency: (offerType === 'cash' || offerType === 'both') ? currency : undefined,
            offeredItems,
            message: message ?? '',
        };

        onSubmit(offerData);

        // Reset form
        setCashAmount('');
        setSelectedItems({});
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-[95%] max-w-lg p-0 shadow-2xl max-h-[85vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200 mx-auto">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Make an Offer</h2>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">Negotiate a deal with the seller</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-lg"
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
                            src={sanitizeUrl(listing.image)}
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

                    {/* Downpayment Warning */}
                    {listing.downpaymentCents && listing.downpaymentCents > 0 && (
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
                            <span className="text-xl">💰</span>
                            <div>
                                <p className="text-sm font-bold text-gray-900">
                                    Downpayment Required
                                </p>
                                <p className="text-xs text-amber-800 mt-0.5">
                                    The seller requires a minimum of <strong>{listing.currencyCode} {(listing.downpaymentCents / 100).toLocaleString()}</strong> paid upfront.
                                </p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Offer Type Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Choose Payment Method
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {listing.allowCash && (
                                    <button
                                        type="button"
                                        onClick={() => setOfferType('cash')}
                                        className={`relative py-3.5 px-2 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border flex flex-col items-center gap-1.5 ${offerType === 'cash'
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-lg">💵</span>
                                        <span>Cash</span>
                                    </button>
                                )}
                                {listing.allowBarter && (!listing.downpaymentCents || listing.downpaymentCents === 0) && (
                                    <button
                                        type="button"
                                        onClick={() => setOfferType('barter')}
                                        className={`relative py-3.5 px-2 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border flex flex-col items-center gap-1.5 ${offerType === 'barter'
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-lg">🔄</span>
                                        <span>Barter</span>
                                    </button>
                                )}
                                {listing.allowCashPlusBarter && (
                                    <button
                                        type="button"
                                        onClick={() => setOfferType('both')}
                                        className={`relative py-3.5 px-2 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border flex flex-col items-center gap-1.5 ${offerType === 'both'
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-lg">⚖️</span>
                                        <span>Both</span>
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
                                                        className={`group flex items-center p-3 rounded-xl border-2 transition-all duration-200 ${selectedItems[item.id]
                                                            ? 'bg-gray-50 border-gray-900 shadow-sm'
                                                            : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <div
                                                            className="flex-1 min-w-0 flex items-center cursor-pointer"
                                                            onClick={() => toggleListingSelection(item.id)}
                                                        >
                                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 transition-colors shrink-0 ${selectedItems[item.id]
                                                                ? 'bg-gray-900 border-gray-900'
                                                                : 'border-gray-300 group-hover:border-gray-400'
                                                                }`}>
                                                                {selectedItems[item.id] && (
                                                                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <img
                                                                src={item.images?.[0]?.url ? sanitizeUrl(item.images[0].url) : 'https://via.placeholder.com/50'}
                                                                alt={item.title}
                                                                className="w-12 h-12 rounded-lg object-cover mr-3 bg-gray-100 shrink-0"
                                                            />
                                                            <div className="flex-1 min-w-0 pr-2">
                                                                <p className={`text-sm font-bold truncate ${selectedItems[item.id] ? 'text-gray-900' : 'text-gray-700'}`}>
                                                                    {item.title}
                                                                </p>
                                                                <p className="text-xs text-gray-500 font-medium">
                                                                    {item.currencyCode} {((item.priceCents || 0) / 100).toLocaleString()} • {item.quantity} available
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Quantity Input */}
                                                        {selectedItems[item.id] && (
                                                            <div className="shrink-0 flex items-center gap-2 pl-3 border-l border-gray-200" onClick={e => e.stopPropagation()}>
                                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Qty</label>
                                                                <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateItemQuantity(item.id, selectedItems[item.id] - 1)}
                                                                        disabled={selectedItems[item.id] <= 1}
                                                                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        max={item.quantity}
                                                                        value={selectedItems[item.id]}
                                                                        onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                                                        className="w-10 h-8 text-center text-sm font-bold text-gray-900 border-x border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateItemQuantity(item.id, selectedItems[item.id] + 1)}
                                                                        disabled={selectedItems[item.id] >= item.quantity}
                                                                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
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
                                className="flex-1 px-6 py-3.5 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-95 text-xs uppercase tracking-wider"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    (offerType !== 'cash' && barterMethod === 'select' && Object.keys(selectedItems).length === 0) ||
                                    (offerType !== 'cash' && barterMethod === 'manual' && manualDescription.trim().length === 0)
                                }
                                className="flex-1 px-6 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-95 text-xs uppercase tracking-wider"
                            >
                                Send Offer
                            </button>
                        </div>
                    </form>
                </div>
            </div >
        </div >
    );
}
