'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SideMenu from '@/components/SideMenu';
import { useOffersStore } from '@/lib/offers-store';
import { useAuthStore } from '@/lib/auth-store';
import { useMessagesStore } from '@/lib/messages-store';
import { useNotificationsStore } from '@/lib/notifications-store';
import { BarterOffer } from '@/lib/types';
import apiClient from '@/lib/api-client';
import OfferCard from '@/components/OfferCard';
import CounterOfferModal from '@/components/CounterOfferModal';
import OfferActionModal from '@/components/OfferActionModal';
import toast from 'react-hot-toast';
import PremiumBadge from '@/components/PremiumBadge';
import BrandBadge from '@/components/BrandBadge';
import { sanitizeUrl } from '@/lib/utils';
import {
  Inbox,
  Send,
  History,
  MessageSquare,
  Repeat,
  ShieldCheck,
  Package,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

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

  const { createConversation } = useMessagesStore();

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const clearOfferNotifications = async () => {
      try {
        await useNotificationsStore.getState().fetchNotifications();
        const currentNotifications = useNotificationsStore.getState().notifications;
        const offerTypes = [
          'NEW_OFFER',
          'OFFER_ACCEPTED',
          'OFFER_REJECTED',
          'OFFER_COUNTERED',
          'offer',
        ];
        const unreadOfferNotifications = currentNotifications.filter(
          (n) => !n.readAt && offerTypes.includes(n.type)
        );

        if (unreadOfferNotifications.length > 0) {
          await Promise.all(
            unreadOfferNotifications.map((n) =>
              useNotificationsStore.getState().markAsRead(n.id)
            )
          );
          await useNotificationsStore.getState().fetchUnreadCount();
        }
      } catch (err) {
        console.error('Failed to clear offer notifications:', err);
      }
    };

    clearOfferNotifications();
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchOffers();
    if (communityOffers.length === 0) setLoadingCommunity(true);
    fetchCommunityOffers();

    const interval = setInterval(() => {
      fetchOffers(undefined, true);
      fetchCommunityOffers();
    }, 15000);

    return () => clearInterval(interval);

    function fetchCommunityOffers() {
      apiClient
        .get('/community-posts/user/my-offers')
        .then((r) => {
          setCommunityOffers((prev) => {
            if (JSON.stringify(r.data) !== JSON.stringify(prev)) {
              return r.data;
            }
            return prev;
          });
        })
        .catch(() => {})
        .finally(() => setLoadingCommunity(false));
    }
  }, [fetchOffers, isAuthenticated]);

  const receivedOffers = user ? getReceivedOffers(user.id) : [];
  const sentOffers = user ? getSentOffers(user.id) : [];
  const historyOffers = user ? getHistoryOffers(user.id) : [];

  useEffect(() => {
    const offerId = searchParams.get('id');
    if (!offerId || isLoading || loadingCommunity) return;

    const foundInReceived = receivedOffers.find((o) => o.id === offerId);
    const foundInSent = sentOffers.find((o) => o.id === offerId);
    const foundInHistory = historyOffers.find((o) => o.id === offerId);
    const foundInCommunity = communityOffers.find((o) => o.id === offerId);

    if (foundInReceived) {
      setActiveTab('received');
    } else if (foundInSent) {
      setActiveTab('sent');
    } else if (foundInHistory) {
      setActiveTab('history');
    } else if (foundInCommunity) {
      setActiveTab('community');
    }

    if (foundInReceived || foundInSent || foundInHistory || foundInCommunity) {
      setTimeout(() => {
        const element = document.getElementById(`offer-${offerId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-blue-600', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-blue-600', 'ring-offset-2');
          }, 3000);
        }
      }, 500);
    }
  }, [
    searchParams,
    isLoading,
    loadingCommunity,
    receivedOffers,
    sentOffers,
    historyOffers,
    communityOffers,
  ]);

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
    const participantName =
      offer.buyerId === user.id
        ? offer.seller?.profile?.displayName || offer.seller?.email || 'Seller'
        : offer.buyer?.profile?.displayName || offer.buyer?.email || 'Buyer';

    createConversation(participantId, participantName, undefined, {
      id: offer.listingId,
      title: offer.listing?.title || 'Listing',
      image: sanitizeUrl(offer.listing?.images?.[0]?.url) || '',
    });

    router.push(`/messages/${participantId}`);
  };

  const handleAccept = async (id: string) => {
    const offer = receivedOffers.find((o) => o.id === id);
    if (offer) {
      setSelectedOffer(offer);
      setActionType('accept');
      setIsActionModalOpen(true);
    }
  };

  const handleConfirmAccept = async () => {
    if (!selectedOffer) return;
    const offerIdToAccept = selectedOffer.id;
    const offerToNavigate = selectedOffer;

    setIsActionModalOpen(false);
    setSelectedOffer(null);

    try {
      await acceptOffer(offerIdToAccept);
      toast.success('Offer accepted! Opening message thread...');
      handleMessage(offerToNavigate);
    } catch (error) {
      console.error('Failed to accept offer:', error);
      toast.error('Failed to accept offer. Please try again.');
    }
  };

  const handleReject = async (id: string) => {
    const offer = receivedOffers.find((o) => o.id === id);
    if (offer) {
      setSelectedOffer(offer);
      setActionType('reject');
      setIsActionModalOpen(true);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedOffer) return;
    const offerIdToReject = selectedOffer.id;

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
    setActionType('view' as any);
    setIsActionModalOpen(true);
  };

  const OfferSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 bg-slate-200 rounded-md shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    if (!_hasHydrated || isLoading) {
      return <OfferSkeleton />;
    }

    if (activeTab === 'received') {
      if (receivedOffers.length === 0) {
        return (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No offers received yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed">
              Your listings have not received any swap or cash proposals yet. Share your listings to get more visibility!
            </p>
            <button
              onClick={() => router.push('/my-listings')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs transition-colors shadow-xs"
            >
              View My Listings
            </button>
          </div>
        );
      }

      return (
        <div className="space-y-3">
          {receivedOffers.map((offer) => (
            <div key={offer.id} id={`offer-${offer.id}`} className="scroll-mt-24">
              <OfferCard
                offer={offer}
                type="received"
                onAccept={handleAccept}
                onReject={handleReject}
                onCounter={handleCounter}
                onMessage={handleMessage}
                onViewDetails={handleViewDetails}
                currentUserId={user?.id}
              />
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'sent') {
      if (sentOffers.length === 0) {
        return (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No sent offers</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed">
              You haven't made any offers on marketplace listings yet. Browse items and make a barter proposal!
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs transition-colors shadow-xs"
            >
              Browse Marketplace
            </button>
          </div>
        );
      }

      return (
        <div className="space-y-3">
          {sentOffers.map((offer) => (
            <div key={offer.id} id={`offer-${offer.id}`} className="scroll-mt-24">
              <OfferCard
                offer={offer}
                type="sent"
                onMessage={handleMessage}
                onViewDetails={handleViewDetails}
                currentUserId={user?.id}
              />
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'community') {
      if (communityOffers.length === 0) {
        return (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Repeat className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No board trade offers</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed">
              Offers you make or receive on the Trade Requests &amp; Wants Board will appear here.
            </p>
            <button
              onClick={() => router.push('/?tab=community')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs transition-colors shadow-xs"
            >
              Browse Trade Requests Board
            </button>
          </div>
        );
      }

      return (
        <div className="space-y-3">
          {communityOffers.map((offer) => {
            const isSent = offer.type === 'sent';
            const otherPerson = isSent ? offer.post.author : offer.offerer;
            const otherName =
              otherPerson.profile?.displayName ||
              [otherPerson.firstName, otherPerson.lastName].filter(Boolean).join(' ') ||
              'Trader';
            const otherAvatar =
              sanitizeUrl(otherPerson.profile?.avatarUrl) ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherPerson.id}`;
            const postPreview =
              offer.post.content.length > 90
                ? offer.post.content.slice(0, 90) + '...'
                : offer.post.content;

            return (
              <div
                key={offer.id}
                id={`offer-${offer.id}`}
                className="bg-white rounded-lg border border-slate-200 shadow-2xs p-4 scroll-mt-24 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={otherAvatar}
                    alt={otherName}
                    className="w-9 h-9 rounded-md object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                          isSent
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {isSent ? 'Sent' : 'Received'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {new Date(offer.createdAt).toLocaleDateString()}
                      </span>
                      {otherPerson.isVerified && (
                        <span className="p-0.5 rounded bg-blue-50 border border-blue-200 text-blue-600">
                          <ShieldCheck className="w-2.5 h-2.5" />
                        </span>
                      )}
                      {otherPerson.brandVerificationStatus === 'VERIFIED_BRAND' && (
                        <BrandBadge size="xs" />
                      )}
                      {otherPerson.tier === 'premium' && <PremiumBadge size="xs" />}
                    </div>

                    <p className="text-xs font-bold text-slate-900">
                      {isSent ? `You offered to @${otherName}` : `@${otherName} offered you`}
                    </p>

                    <div className="bg-slate-50 border border-slate-200/90 rounded-md p-2.5 text-xs text-slate-800 mt-1.5 leading-relaxed">
                      {offer.message}
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2 truncate">
                      <span className="font-semibold text-slate-600">On Request:</span> {postPreview}
                    </p>

                    <div className="mt-2.5">
                      <button
                        onClick={() => router.push(`/messages/${otherPerson.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs transition-colors shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Open Direct Chat</span>
                      </button>
                    </div>
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
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No transaction history yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Accepted, rejected, and completed barter offers will be archived here.
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-3">
          {historyOffers.map((offer) => (
            <div key={offer.id} id={`offer-${offer.id}`} className="scroll-mt-24">
              <OfferCard
                offer={offer}
                type="history"
                currentUserId={user?.id}
                onViewDetails={handleViewDetails}
              />
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Mobile Header */}
      <div className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
        <h1 className="text-lg font-bold text-slate-900">Trade Offers</h1>
        <SideMenu />
      </div>

      {/* Desktop Header Card */}
      <div className="hidden md:block container mx-auto px-4 max-w-4xl pt-6 pb-2">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Trade &amp; Swap Offers</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage incoming barter bids, counter-offers, and trade board proposals.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-2 max-w-4xl">
        {/* Segmented Switcher Tabs */}
        <div className="flex gap-1.5 mb-5 bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs overflow-x-auto scrollbar-hide">
          {[
            { id: 'received', label: 'Received', count: receivedOffers.length, icon: Inbox },
            { id: 'sent', label: 'Sent', count: sentOffers.length, icon: Send },
            { id: 'community', label: 'Board Offers', count: communityOffers.length, icon: Repeat },
            { id: 'history', label: 'History', count: 0, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex-1 min-w-[100px] py-2 px-3 rounded-md font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      isActive ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
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
        currentUserId={user?.id}
        onSetAction={(act) => setActionType(act as any)}
        onCounter={handleCounter}
        onMessage={handleMessage}
      />
    </div>
  );
}
