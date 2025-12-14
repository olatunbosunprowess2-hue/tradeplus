'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import apiClient from '@/lib/api-client';
import type { BarterOffer } from '@/lib/types';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import CounterOfferModal from '@/components/CounterOfferModal';
import ReceiptModal from '@/components/ReceiptModal';
import OfferCard from '@/components/OfferCard';
import { confirmTrade, getReceipt } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function BarterOffersPage() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');
    const [selectedOffer, setSelectedOffer] = useState<BarterOffer | null>(null);
    const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [receiptOffer, setReceiptOffer] = useState<BarterOffer | null>(null);
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
        enabled: isAuthenticated,
    });

    const acceptMutation = useMutation({
        mutationFn: (offerId: string) =>
            apiClient.patch(`/barter/offers/${offerId}/accept`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['barter-offers'] });
            toast.success('Offer accepted!');
        },
    });

    const rejectMutation = useMutation({
        mutationFn: (offerId: string) =>
            apiClient.patch(`/barter/offers/${offerId}/reject`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['barter-offers'] });
            toast.success('Offer rejected');
        },
    });

    const counterMutation = useMutation({
        mutationFn: ({ offerId, data }: { offerId: string, data: any }) =>
            apiClient.post(`/barter/offers/${offerId}/counter`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['barter-offers'] });
            setIsCounterModalOpen(false);
            setSelectedOffer(null);
            toast.success('Counter offer sent!');
        },
    });

    const confirmMutation = useMutation({
        mutationFn: (offerId: string) => confirmTrade(offerId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['barter-offers'] });
            toast.success('Item receipt confirmed!');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to confirm receipt');
        },
    });

    const receiptMutation = useMutation({
        mutationFn: (offerId: string) => getReceipt(offerId),
        onSuccess: (response: any) => {
            setReceiptOffer(response.data);
            setIsReceiptModalOpen(true);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to generate receipt');
        },
    });

    if (!isAuthenticated) {
        router.push('/login');
        return null;
    }

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
                                <OfferCard
                                    key={offer.id}
                                    offer={offer}
                                    type={isSent ? 'sent' : 'received'}
                                    currentUserId={user?.id}
                                    onAccept={(id) => acceptMutation.mutate(id)}
                                    onReject={(id) => rejectMutation.mutate(id)}
                                    onCounter={handleCounterClick}
                                    onMessage={() => toast('Messaging not implemented yet')}
                                    onConfirm={(id) => confirmMutation.mutate(id)}
                                    onViewReceipt={(offer: BarterOffer) => receiptMutation.mutate(offer.id)}
                                />
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

            {/* Receipt Modal */}
            {receiptOffer && (
                <ReceiptModal
                    isOpen={isReceiptModalOpen}
                    onClose={() => {
                        setIsReceiptModalOpen(false);
                        setReceiptOffer(null);
                    }}
                    offer={receiptOffer}
                />
            )}
        </div>
    );
}
