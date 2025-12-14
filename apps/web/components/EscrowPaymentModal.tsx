'use client';

import { useState } from 'react';
import apiClient from '@/lib/api-client';
import { toast } from 'react-hot-toast';

interface EscrowPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    listing: {
        id: string;
        title: string;
        priceCents: number;
        currencyCode: string;
        images?: { url: string }[];
        seller?: {
            profile?: {
                displayName?: string;
            };
            email?: string;
        };
    };
    onSuccess?: (escrowData: any) => void;
}

/**
 * Modal for initiating escrow-protected purchase of distress sale listings
 */
export default function EscrowPaymentModal({
    isOpen,
    onClose,
    listing,
    onSuccess
}: EscrowPaymentModalProps) {
    const [loading, setLoading] = useState(false);
    const [fees, setFees] = useState<{
        itemPrice: number;
        protectionFee: number;
        totalToPay: number;
    } | null>(null);

    // Calculate fees on open
    useState(() => {
        if (isOpen && listing.priceCents) {
            // Simple fee calculation (mirrors backend)
            const price = listing.priceCents;
            let protectionFeePercent = price < 10_000_000 ? 1.5 : price < 50_000_000 ? 1 : 0;
            let protectionFee = protectionFeePercent > 0
                ? Math.max(price * protectionFeePercent / 100, 50_000)
                : 500_000; // Flat ₦5,000 for high value

            setFees({
                itemPrice: price / 100,
                protectionFee: protectionFee / 100,
                totalToPay: (price + protectionFee) / 100,
            });
        }
    });

    const handlePurchase = async () => {
        setLoading(true);
        try {
            const response = await apiClient.post('/escrow/initiate', {
                listingId: listing.id,
                paymentProvider: 'mock', // Use mock for now, will switch to paystack later
                shippingMethod: 'meet_in_person',
            });

            toast.success('Purchase successful! Check your notifications for the confirmation code.');
            onSuccess?.(response.data);
            onClose();
        } catch (error: any) {
            console.error('Escrow initiation failed:', error);
            toast.error(error.response?.data?.message || 'Failed to initiate purchase');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: listing.currencyCode || 'NGN',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-5 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Escrow-Protected Purchase</h2>
                            <p className="text-white/80 text-sm">Your money is safe until you confirm receipt</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5">
                    {/* Product Info */}
                    <div className="flex gap-3 mb-5 p-3 bg-gray-50 rounded-xl">
                        {listing.images?.[0] && (
                            <img
                                src={listing.images[0].url}
                                alt={listing.title}
                                className="w-16 h-16 rounded-lg object-cover"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{listing.title}</h3>
                            <p className="text-sm text-gray-500">
                                Seller: {listing.seller?.profile?.displayName || listing.seller?.email || 'Unknown'}
                            </p>
                        </div>
                    </div>

                    {/* Fee Breakdown */}
                    <div className="space-y-3 mb-5">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Item Price</span>
                            <span className="font-semibold text-gray-900">
                                {formatCurrency(fees?.itemPrice || listing.priceCents / 100)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1">
                                <span className="text-gray-600">Protection Fee</span>
                                <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                    Your Safety
                                </span>
                            </div>
                            <span className="font-semibold text-green-600">
                                +{formatCurrency(fees?.protectionFee || 0)}
                            </span>
                        </div>
                        <div className="border-t border-gray-200 pt-3">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-900">Total to Pay</span>
                                <span className="text-xl font-bold text-gray-900">
                                    {formatCurrency(fees?.totalToPay || listing.priceCents / 100)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* How it Works */}
                    <div className="bg-blue-50 rounded-xl p-4 mb-5">
                        <h4 className="font-semibold text-blue-900 mb-2">🛡️ How Escrow Protection Works</h4>
                        <ol className="text-sm text-blue-800 space-y-1.5">
                            <li className="flex items-start gap-2">
                                <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                                <span>You pay → Money is held securely (not with seller)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                                <span>Meet seller & inspect item</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                                <span>Enter code to release payment to seller</span>
                            </li>
                        </ol>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handlePurchase}
                            disabled={loading}
                            className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Pay Securely
                                </>
                            )}
                        </button>
                    </div>

                    <p className="text-xs text-center text-gray-500 mt-3">
                        If the item isn't as described, you get a full refund.
                    </p>
                </div>
            </div>
        </div>
    );
}
