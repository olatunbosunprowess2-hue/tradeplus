'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import apiClient from '@/lib/api-client';
import type { BarterOffer } from '@/lib/types';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import CounterOfferModal from '@/components/CounterOfferModal';

export default function BarterOffersPage() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');
    const [selectedOffer, setSelectedOffer] = useState<BarterOffer | null>(null);
    const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: offers, isLoading } = useQuery({
        queryKey: ['barter-offers', filter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filter === 'sent') params.append('type', 'sent');
            if (filter === 'received') params.append('type', 'received');

            const response = await apiClient.get<BarterOffer[]>(
                `/barter/offers?${params.toString()}`
            );
            return response.data;
        },
        enabled: isAuthenticated, // Only run if authenticated
    });

    const acceptMutation = useMutation({
        mutationFn: (offerId: string) =>
            apiClient.patch(`/barter/offers/${offerId}/accept`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['barter-offers'] });
        },
    });

    const rejectMutation = useMutation({
        mutationFn: (offerId: string) =>
            apiClient.patch(`/barter/offers/${offerId}/reject`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['barter-offers'] });
        },
    });

    const counterMutation = useMutation({
        mutationFn: ({ offerId, data }: { offerId: string, data: any }) =>
            apiClient.post(`/barter/offers/${offerId}/counter`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['barter-offers'] });
            setIsCounterModalOpen(false);
            setSelectedOffer(null);
        },
    });

    if (!isAuthenticated) {
        router.push('/login');
        return null;
    }

    const formatPrice = (cents: number) => {
        return `$${(cents / 100).toFixed(2)}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'accepted': return 'bg-green-100 text-green-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            case 'countered': return 'bg-blue-50 text-blue-800';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handleCounterClick = (offer: BarterOffer) => {
        setSelectedOffer(offer);
        setIsCounterModalOpen(true);
    };

    const handleCounterSubmit = (data: any) => {
        if (selectedOffer) {
            counterMutation.mutate({
                offerId: selectedOffer.id,
                data: {
                    offeredCashCents: data.amount ? Math.round(data.amount * 100) : undefined,
                    offeredItems: data.offeredItems,
                    message: data.message,
                }
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Barter Offers</h1>

                {/* Filter Tabs */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-6 py-2 rounded-lg font-semibold transition ${filter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        All Offers
                    </button>
                    <button
                        onClick={() => setFilter('sent')}
                        className={`px-6 py-2 rounded-lg font-semibold transition ${filter === 'sent'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Sent
                    </button>
                    <button
                        onClick={() => setFilter('received')}
                        className={`px-6 py-2 rounded-lg font-semibold transition ${filter === 'received'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Received
                    </button>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {/* Empty State */}
                {offers && offers.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg shadow-md">
                        <p className="text-xl text-gray-600 mb-4">No offers found</p>
                        <button
                            onClick={() => router.push('/listings')}
                            className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                            Browse listings to make an offer
                        </button>
                    </div>
                )}

                {/* Offers List */}
                {offers && offers.length > 0 && (
                    <div className="space-y-4">
                        {offers.map((offer) => {
                            const isSent = offer.buyerId === user?.id;
                            const isReceived = offer.sellerId === user?.id;

                            return (
                                <div key={offer.id} className="bg-white rounded-lg shadow-md p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900">
                                                    {offer.listing.title}
                                                </h3>
                                                <span className={`px-3 py-1 rounded text-sm font-semibold ${getStatusColor(offer.status)}`}>
                                                    {offer.status}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-sm">
                                                {isSent ? `To: ${offer.seller.profile?.displayName || offer.seller.email}` :
                                                    `From: ${offer.buyer.profile?.displayName || offer.buyer.email}`}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Offer Details */}
                                    <div className="grid md:grid-cols-2 gap-6 mb-4">
                                        {/* Target Listing */}
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Target Item</h4>
                                            <div className="flex gap-3">
                                                {offer.listing.images[0] && (
                                                    <img
                                                        src={offer.listing.images[0].url}
                                                        alt={offer.listing.title}
                                                        className="w-20 h-20 object-cover rounded"
                                                    />
                                                )}
                                                <div>
                                                    <p className="font-medium">{offer.listing.title}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {formatPrice(offer.listing.priceCents || 0)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Offered Items */}
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Offering</h4>
                                            {offer.offeredCashCents > 0 && (
                                                <p className="text-lg font-bold text-green-600 mb-2">
                                                    💵 {formatPrice(offer.offeredCashCents)}
                                                </p>
                                            )}
                                            {offer.items && offer.items.length > 0 && (
                                                <div className="space-y-2">
                                                    {offer.items.map((item) => (
                                                        <div key={item.id} className="flex gap-2 items-center">
                                                            {item.offeredListing.images[0] && (
                                                                <img
                                                                    src={item.offeredListing.images[0].url}
                                                                    alt={item.offeredListing.title}
                                                                    className="w-12 h-12 object-cover rounded"
                                                                />
                                                            )}
                                                            <div>
                                                                <p className="text-sm font-medium">{item.offeredListing.title}</p>
                                                                <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Message */}
                                    {offer.message && (
                                        <div className="mb-4 p-3 bg-gray-50 rounded">
                                            <p className="text-sm text-gray-700">{offer.message}</p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    {isReceived && offer.status === 'pending' && (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => acceptMutation.mutate(offer.id)}
                                                disabled={acceptMutation.isPending}
                                                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                                            >
                                                {acceptMutation.isPending ? 'Accepting...' : 'Accept Offer'}
                                            </button>
                                            <button
                                                onClick={() => rejectMutation.mutate(offer.id)}
                                                disabled={rejectMutation.isPending}
                                                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                                            >
                                                {rejectMutation.isPending ? 'Rejecting...' : 'Reject Offer'}
                                            </button>
                                            <button
                                                onClick={() => handleCounterClick(offer)}
                                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                                            >
                                                Counter Offer
                                            </button>
                                        </div>
                                    )}

                                    {isSent && offer.status === 'pending' && (
                                        <div className="text-center text-gray-600 text-sm">
                                            Waiting for response...
                                        </div>
                                    )}

                                    {offer.status === 'accepted' && (
                                        <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                                            <p className="text-green-700 font-semibold">✓ Offer Accepted!</p>
                                            <p className="text-sm text-green-600 mt-1">
                                                You can now proceed with the exchange
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Counter Offer Modal */}
            {selectedOffer && (
                <CounterOfferModal
                    isOpen={isCounterModalOpen}
                    onClose={() => {
                        setIsCounterModalOpen(false);
                        setSelectedOffer(null);
                    }}
                    offer={selectedOffer}
                    onSubmit={handleCounterSubmit}
                />
            )}
        </div>
    );
}
