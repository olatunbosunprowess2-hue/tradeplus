'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SideMenu from '@/components/SideMenu';
import { useOffersStore } from '@/lib/offers-store';
import { useAuthStore } from '@/lib/auth-store';
import { useMessagesStore } from '@/lib/messages-store';
import { BarterOffer } from '@/lib/types';
import apiClient from '@/lib/api-client';
import OfferCard from '@/components/OfferCard';
import DownpaymentTracker from '@/components/DownpaymentTracker';
import CounterOfferModal from '@/components/CounterOfferModal';
import OfferActionModal from '@/components/OfferActionModal';
import toast from 'react-hot-toast';
import PremiumBadge from '@/components/PremiumBadge';
import BrandBadge from '@/components/BrandBadge';
import { sanitizeUrl } from '@/lib/utils';

type Tab = 'received' | 'sent' | 'history' | 'community';

interface CommunityOffer {
    id: string;
    postId: string;
    offererId: string;
    message: string;
    createdAt: string;
    type: 'sent' | 'received';
    offerer: {
        id: string;
        firstName: string;
        lastName: string;
        tier?: 'free' | 'premium';
        isVerified: boolean;
        brandVerificationStatus?: string;
        profile?: { displayName?: string; avatarUrl?: string };
    };
    post: {
        id: string;
        content: string;
        authorId: string;
        author: {
            id: string;
            firstName: string;
            lastName: string;
            tier?: 'free' | 'premium';
            isVerified: boolean;
            brandVerificationStatus?: string;
            profile?: { displayName?: string; avatarUrl?: string };
        };
    };
}

export default function OffersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthenticated, _hasHydrated } = useAuthStore();
    const [activeTab, setActiveTab] = useState<Tab>('received');
    const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState<BarterOffer | null>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState<'accept' | 'reject'>('accept');
    const [isProcessingAction, setIsProcessingAction] = useState(false);
    const [communityOffers, setCommunityOffers] = useState<CommunityOffer[]>([]);
    const [loadingCommunity, setLoadingCommunity] = useState(false);

    const {
        fetchOffers,
        getReceivedOffers,
        getSentOffers,
        getHistoryOffers,
        acceptOffer,
        rejectOffer,
        counterOffer,
        isLoading,
    } = useOffersStore();

    const OfferSkeleton = () => (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg shrink-0" />
                        <div className="flex-1 space-y-3">
                            <div className="flex justify-between">
                                <div className="h-4 bg-gray-200 rounded w-1/3" />
                                <div className="h-4 bg-gray-200 rounded w-1/4" />
                            </div>
                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                            <div className="flex gap-2">
                                <div className="h-8 bg-gray-200 rounded-lg w-20" />
                                <div className="h-8 bg-gray-200 rounded-lg w-20" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const { createConversation } = useMessagesStore();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (_hasHydrated && !isAuthenticated) {
            router.push('/login');
        }
    }, [_hasHydrated, isAuthenticated, router]);

    // Fetch offers
    useEffect(() => {
        if (isAuthenticated) {
            fetchOffers();
            // Fetch community offers (don't set loading if we already have data to avoid glitches)
            if (communityOffers.length === 0) {
                setLoadingCommunity(true);
            }
            apiClient.get('/community-posts/user/my-offers')
                .then(r => {
                    // Only update if data changed to prevent flicker
                    if (JSON.stringify(r.data) !== JSON.stringify(communityOffers)) {
                        setCommunityOffers(r.data);
                    }
                })
                .catch(() => { })
                .finally(() => setLoadingCommunity(false));
        }
    }, [fetchOffers, isAuthenticated]); // Removed communityOffers from dep array since it would cause loop

    const receivedOffers = user ? getReceivedOffers(user.id) : [];
    const sentOffers = user ? getSentOffers(user.id) : [];
    const historyOffers = user ? getHistoryOffers(user.id) : [];

    // Deep link handling
    useEffect(() => {
        const offerId = searchParams.get('id');
        if (!offerId || isLoading || loadingCommunity) return;

        // Find which tab the offer belongs to
        const foundInReceived = receivedOffers.find(o => o.id === offerId);
        const foundInSent = sentOffers.find(o => o.id === offerId);
        const foundInHistory = historyOffers.find(o => o.id === offerId);
        const foundInCommunity = communityOffers.find(o => o.id === offerId);

        if (foundInReceived) {
            setActiveTab('received');
        } else if (foundInSent) {
            setActiveTab('sent');
        } else if (foundInHistory) {
            setActiveTab('history');
        } else if (foundInCommunity) {
            setActiveTab('community');
        }

        // Scroll to offer after a short delay to allow render
        if (foundInReceived || foundInSent || foundInHistory || foundInCommunity) {
            setTimeout(() => {
                const element = document.getElementById(`offer-${offerId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
                    setTimeout(() => {
                        element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
                    }, 3000);
                }
            }, 500);
        }
    }, [searchParams, isLoading, loadingCommunity, receivedOffers, sentOffers, historyOffers, communityOffers]);

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
            ? (offer.seller?.profile?.displayName || offer.seller?.email || 'Unknown')
            : (offer.buyer?.profile?.displayName || offer.buyer?.email || 'Unknown');

        // Create or get conversation
        createConversation(participantId, participantName, undefined, {
            id: offer.listingId,
            title: offer.listing?.title || 'Listing',
            image: sanitizeUrl(offer.listing?.images?.[0]?.url) || '',
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

        // Optimistic UI: Close modal immediately and show an engaging success message
        const buyer = selectedOffer.buyer;
        const listing = selectedOffer.listing;
        const offerIdToAccept = selectedOffer.id;

        setIsActionModalOpen(false);
        setSelectedOffer(null);
        toast.success('Trade Accepted! Initiating secure chat...', { icon: '🚀', duration: 3000 });

        try {
            // Process the acceptance cleanly in the background
            await acceptOffer(offerIdToAccept);

            // Create conversation context and redirect to chat
            createConversation(
                buyer?.id || selectedOffer.buyerId,
                buyer?.profile?.displayName || buyer?.email || 'Unknown',
                sanitizeUrl(buyer?.profile?.avatarUrl),
                {
                    id: listing?.id || selectedOffer.listingId,
                    title: listing?.title || 'Listing',
                    image: sanitizeUrl(listing?.images?.[0]?.url) || ''
                }
            );

            router.push(`/messages/${buyer.id}`);

        } catch (error) {
            console.error('Failed to accept offer:', error);
            toast.error('Network delay: Failed to finalize offer. Please try again.');
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

        const offerIdToReject = selectedOffer.id;

        // Optimistic UI: instant close
        setIsActionModalOpen(false);
        setSelectedOffer(null);

        try {
            await rejectOffer(offerIdToReject);
        } catch (error) {
            console.error('Failed to reject offer:', error);
        }
    };

    const handleViewDetails = (offer: BarterOffer) => {
        setSelectedOffer(offer);
        setActionType('view' as any); // Reusing the state for the view mode
        setIsActionModalOpen(true);
    };

    const renderContent = () => {
        if (!_hasHydrated || isLoading) {
            return <OfferSkeleton />;
        }

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
                        <div key={offer.id} id={`offer-${offer.id}`} className="scroll-mt-24 transition-all duration-500 rounded-xl">
                            <OfferCard
                                offer={offer}
                                type="received"
                                onAccept={handleAccept}
                                onReject={handleReject}
                                onCounter={handleCounter}
                                onMessage={handleMessage}
                                onViewDetails={handleViewDetails}
                            />
                            {offer.status === 'accepted' && offer.downpaymentStatus && offer.downpaymentStatus !== 'none' && user && (
                                <DownpaymentTracker
                                    offer={offer}
                                    currentUserId={user.id}
                                    onUpdate={() => fetchOffers()}
                                />
                            )}
                        </div>
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
                        <div key={offer.id} id={`offer-${offer.id}`} className="scroll-mt-24 transition-all duration-500 rounded-xl">
                            <OfferCard
                                offer={offer}
                                type="sent"
                                onMessage={handleMessage}
                                onViewDetails={handleViewDetails}
                            />
                            {offer.status === 'accepted' && offer.downpaymentStatus && offer.downpaymentStatus !== 'none' && user && (
                                <DownpaymentTracker
                                    offer={offer}
                                    currentUserId={user.id}
                                    onUpdate={() => fetchOffers()}
                                />
                            )}
                        </div>
                    ))}
                </div>
            );
        }

        if (activeTab === 'community') {
            if (loadingCommunity) {
                return (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                    <div className="flex-1">
                                        <div className="h-3 bg-gray-200 rounded w-1/4 mb-2" />
                                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }

            if (communityOffers.length === 0) {
                return (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-4xl">🏷️</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No community offers yet</h3>
                        <p className="text-gray-600 max-w-md mb-6">
                            Offers you make or receive on community posts will appear here.
                        </p>
                        <button
                            onClick={() => router.push('/listings')}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                        >
                            Browse Community Feed
                        </button>
                    </div>
                );
            }

            return (
                <div className="space-y-3">
                    {communityOffers.map(offer => {
                        const isSent = offer.type === 'sent';
                        const otherPerson = isSent ? offer.post.author : offer.offerer;
                        const otherName = otherPerson.profile?.displayName || [otherPerson.firstName, otherPerson.lastName].filter(Boolean).join(' ') || 'User';
                        const otherAvatar = sanitizeUrl(otherPerson.profile?.avatarUrl) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherPerson.id}`;
                        const postPreview = offer.post.content.length > 80 ? offer.post.content.slice(0, 80) + '...' : offer.post.content;

                        return (
                            <div key={offer.id} id={`offer-${offer.id}`} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 scroll-mt-24 transition-all duration-500">
                                <div className="flex items-start gap-3">
                                    <img src={otherAvatar} alt={otherName} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${isSent ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                                {isSent ? '📤 Sent' : '📥 Received'}
                                            </span>
                                            <span className="text-xs text-gray-400">{new Date(offer.createdAt).toLocaleDateString()}</span>
                                            {otherPerson.isVerified && (
                                                <span className="flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[8px] font-bold border border-blue-100">
                                                    <svg className="w-2 h-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    Verified
                                                </span>
                                            )}
                                            {otherPerson.brandVerificationStatus === 'VERIFIED_BRAND' && <BrandBadge size="xs" />}
                                            {otherPerson.tier === 'premium' && <PremiumBadge size="xs" />}
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900">{isSent ? `You offered to ${otherName}` : `${otherName} offered you`}</p>
                                        <p className="text-sm text-gray-700 mt-1 bg-gray-50 rounded-lg p-2 italic">&ldquo;{offer.message}&rdquo;</p>
                                        <p className="text-xs text-gray-400 mt-1.5">On post: {postPreview}</p>
                                        <button
                                            onClick={() => router.push(`/messages/${otherPerson.id}`)}
                                            className="mt-2 text-xs font-semibold text-purple-600 hover:text-purple-800 transition"
                                        >
                                            💬 Open Chat
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
                        <div key={offer.id} id={`offer-${offer.id}`} className="scroll-mt-24 transition-all duration-500 rounded-xl">
                            <OfferCard
                                offer={offer}
                                type="history"
                            />
                        </div>
                    ))}
                </div>
            );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
            {/* Mobile Header */}
            <div className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Offers
                </h1>
                <SideMenu />
            </div>

            {/* Desktop Header */}
            <div className="hidden md:block container mx-auto px-4 max-w-4xl pt-5 pb-3 border-b border-gray-200">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Offers
                </h1>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-4xl">
                {/* Tabs */}
                <div className="flex gap-1.5 mb-6 bg-white p-1 rounded-2xl shadow-md border border-gray-100">
                    <button
                        onClick={() => setActiveTab('received')}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-sm transition-all ${activeTab === 'received'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Received
                        {receivedOffers.length > 0 && (
                            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${activeTab === 'received' ? 'bg-white text-purple-600' : 'bg-purple-50 text-purple-600'
                                }`}>
                                {receivedOffers.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('sent')}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-sm transition-all ${activeTab === 'sent'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Sent
                        {sentOffers.length > 0 && (
                            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${activeTab === 'sent' ? 'bg-white text-purple-600' : 'bg-purple-50 text-purple-600'
                                }`}>
                                {sentOffers.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('community')}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-sm transition-all ${activeTab === 'community'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Community
                        {communityOffers.length > 0 && (
                            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${activeTab === 'community' ? 'bg-white text-purple-600' : 'bg-purple-50 text-purple-600'}`}>
                                {communityOffers.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-sm transition-all ${activeTab === 'history'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
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
