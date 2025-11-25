'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOffersStore } from '@/lib/offers-store';
import { useAuthStore } from '@/lib/auth-store';
import { useMessagesStore } from '@/lib/messages-store';
import { BarterOffer } from '@/lib/types';
import OfferCard from '@/components/OfferCard';
import CounterOfferModal from '@/components/CounterOfferModal';

type Tab = 'received' | 'sent' | 'history';

export default function OffersPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<Tab>('received');
    const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState<BarterOffer | null>(null);

    const {
        fetchOffers,
        getReceivedOffers,
        getSentOffers,
        getHistoryOffers,
        acceptOffer,
        rejectOffer,
        counterOffer,
    } = useOffersStore();

    const { createConversation } = useMessagesStore();

    useEffect(() => {
        fetchOffers();
    }, [fetchOffers]);

    const receivedOffers = user ? getReceivedOffers(user.id) : [];
    const sentOffers = user ? getSentOffers(user.id) : [];
    const historyOffers = user ? getHistoryOffers(user.id) : [];

    const handleCounter = (offer: BarterOffer) => {
        setSelectedOffer(offer);
        setIsCounterModalOpen(true);
    };

    const handleCounterSubmit = (data: {
        offeredItems?: { listingId: string; quantity: number }[];
        amount?: number;
        message?: string;
    }) => {
        if (selectedOffer) {
            counterOffer(selectedOffer.id, {
                offeredCashCents: data.amount ? Math.round(data.amount * 100) : undefined,
                offeredItems: data.offeredItems,
                message: data.message,
            });
            setIsCounterModalOpen(false);
        }
    };

    const handleMessage = (offer: BarterOffer) => {
        if (!user) return;
        const participantId = offer.buyerId === user.id ? offer.sellerId : offer.buyerId;
        const participantName = offer.buyerId === user.id
            ? (offer.seller.profile?.displayName || offer.seller.email)
            : (offer.buyer.profile?.displayName || offer.buyer.email);

        // Create or get conversation
        createConversation(participantId, participantName, undefined, {
            id: offer.listingId,
            title: offer.listing.title,
            image: offer.listing.images[0]?.url || '',
        });

        // Navigate to chat
        router.push(`/messages/${participantId}`);
    };

    const handleAccept = async (id: string) => {
        if (confirm('Accept this offer?')) {
            await acceptOffer(id);
            alert('Offer accepted! You can now arrange to meet the buyer.');
        }
    };

    const handleReject = async (id: string) => {
        if (confirm('Reject this offer?')) {
            await rejectOffer(id);
        }
    };

    const renderContent = () => {
        if (activeTab === 'received') {
            if (receivedOffers.length === 0) {
                return (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-4xl">📭</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No offers yet</h3>
                        <p className="text-gray-600 max-w-md mb-6">
                            Your listings haven't received any offers. Share them to get more views!
                        </p>
                        <button
                            onClick={() => router.push('/listings')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                            View My Listings
                        </button>
                    </div>
                );
            }

            return (
                <div className="space-y-4">
                    {receivedOffers.map((offer) => (
                        <OfferCard
                            key={offer.id}
                            offer={offer}
                            type="received"
                            onAccept={handleAccept}
                            onReject={handleReject}
                            onCounter={handleCounter}
                            onMessage={handleMessage}
                        />
                    ))}
                </div>
            );
        }

        if (activeTab === 'sent') {
            if (sentOffers.length === 0) {
                return (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-4xl">🔍</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">You haven't made any offers yet</h3>
                        <p className="text-gray-600 max-w-md mb-6">
                            Browse listings and make your first trade offer!
                        </p>
                        <button
                            onClick={() => router.push('/listings')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                            Browse Listings
                        </button>
                    </div>
                );
            }

            return (
                <div className="space-y-4">
                    {sentOffers.map((offer) => (
                        <OfferCard
                            key={offer.id}
                            offer={offer}
                            type="sent"
                            onMessage={handleMessage}
                        />
                    ))}
                </div>
            );
        }

        if (activeTab === 'history') {
            if (historyOffers.length === 0) {
                return (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-4xl">📜</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No history yet</h3>
                        <p className="text-gray-600 max-w-md">
                            Completed and rejected offers will appear here.
                        </p>
                    </div>
                );
            }

            return (
                <div className="space-y-4">
                    {historyOffers.map((offer) => (
                        <OfferCard
                            key={offer.id}
                            offer={offer}
                            type="history"
                        />
                    ))}
                </div>
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="container mx-auto px-4 py-6 max-w-4xl">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">My Offers</h1>
                    <p className="text-gray-600 font-medium">Manage your trade offers and deals</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg shadow-sm border border-gray-200">
                    <button
                        onClick={() => setActiveTab('received')}
                        className={`flex-1 py-3 px-4 rounded-md font-semibold text-sm transition-all ${activeTab === 'received'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Received
                        {receivedOffers.length > 0 && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'received' ? 'bg-white text-blue-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                {receivedOffers.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('sent')}
                        className={`flex-1 py-3 px-4 rounded-md font-semibold text-sm transition-all ${activeTab === 'sent'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Sent
                        {sentOffers.length > 0 && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'sent' ? 'bg-white text-blue-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                {sentOffers.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 px-4 rounded-md font-semibold text-sm transition-all ${activeTab === 'history'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        History
                    </button>
                </div>

                {/* Content */}
                {renderContent()}
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
