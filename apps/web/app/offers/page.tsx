'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOffersStore } from '@/lib/offers-store';
import { useAuthStore } from '@/lib/auth-store';
import { useMessagesStore } from '@/lib/messages-store';
import { BarterOffer } from '@/lib/types';
import OfferCard from '@/components/OfferCard';
import CounterOfferModal from '@/components/CounterOfferModal';
import OfferActionModal from '@/components/OfferActionModal';
import toast from 'react-hot-toast';

type Tab = 'received' | 'sent' | 'history';

export default function OffersPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<Tab>('received');
    const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState<BarterOffer | null>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState<'accept' | 'reject'>('accept');
    const [isProcessingAction, setIsProcessingAction] = useState(false);

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
        const offer = receivedOffers.find(o => o.id === id);
        if (offer) {
            setSelectedOffer(offer);
            setActionType('accept');
            setIsActionModalOpen(true);
        }
    };

    const handleConfirmAccept = async () => {
        if (!selectedOffer) return;
        setIsProcessingAction(true);
        try {
            await acceptOffer(selectedOffer.id);

            // Create conversation context and redirect to chat
            const buyer = selectedOffer.buyer;
            const listing = selectedOffer.listing;

            createConversation(
                buyer.id,
                buyer.profile?.displayName || buyer.email,
                buyer.profile?.avatarUrl,
                {
                    id: listing.id,
                    title: listing.title,
                    image: listing.images[0]?.url || ''
                }
            );

            toast.success('Offer accepted! Redirecting to chat...');
            setIsActionModalOpen(false);
            setSelectedOffer(null);

            // Short delay to let the toast be seen
            setTimeout(() => {
                router.push(`/messages/${buyer.id}`);
            }, 1000);

        } catch (error) {
            console.error('Failed to accept offer:', error);
            toast.error('Failed to accept offer');
        } finally {
            setIsProcessingAction(false);
        }
    };

    const handleReject = async (id: string) => {
        const offer = receivedOffers.find(o => o.id === id);
        if (offer) {
            setSelectedOffer(offer);
            setActionType('reject');
            setIsActionModalOpen(true);
        }
    };

    const handleConfirmReject = async () => {
        if (!selectedOffer) return;
        setIsProcessingAction(true);
        try {
            await rejectOffer(selectedOffer.id);
            setIsActionModalOpen(false);
            setSelectedOffer(null);
        } catch (error) {
            console.error('Failed to reject offer:', error);
        } finally {
            setIsProcessingAction(false);
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
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white">
                <div className="container mx-auto px-4 max-w-4xl py-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Trade Offers</h1>
                            <p className="text-purple-100">Manage your trade offers and barter deals</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-4xl">
                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl shadow-md border border-gray-100">
                    <button
                        onClick={() => setActiveTab('received')}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${activeTab === 'received'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        📥 Received
                        {receivedOffers.length > 0 && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'received' ? 'bg-white text-purple-600' : 'bg-purple-50 text-purple-600'
                                }`}>
                                {receivedOffers.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('sent')}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${activeTab === 'sent'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        📤 Sent
                        {sentOffers.length > 0 && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'sent' ? 'bg-white text-purple-600' : 'bg-purple-50 text-purple-600'
                                }`}>
                                {sentOffers.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${activeTab === 'history'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        📜 History
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

            {/* Offer Action Confirmation Modal */}
            <OfferActionModal
                isOpen={isActionModalOpen}
                onClose={() => {
                    setIsActionModalOpen(false);
                    setSelectedOffer(null);
                }}
                onConfirm={actionType === 'accept' ? handleConfirmAccept : handleConfirmReject}
                offer={selectedOffer}
                action={actionType}
                isProcessing={isProcessingAction}
            />
        </div>
    );
}
