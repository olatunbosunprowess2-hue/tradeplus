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
  ExternalLink,
  Clock,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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

function parseOfferContent(text: string): { cleanText: string; imageUrls: string[] } {
  const photoRegex = /\[Photo\]:\s*(\S+)/g;
  const imageUrls: string[] = [];
  let match;

  while ((match = photoRegex.exec(text)) !== null) {
    imageUrls.push(match[1]);
  }

  const cleanText = text.replace(photoRegex, '').trim();
  return { cleanText, imageUrls };
}

function getTraderInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function OffersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();

  const tabParam = searchParams.get('tab') as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(
    tabParam && ['received', 'sent', 'community', 'history'].includes(tabParam)
      ? tabParam
      : 'received'
  );

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

  const handleTabChange = (newTab: Tab) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.replace(`/offers?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    const currentTabParam = searchParams.get('tab') as Tab | null;
    if (
      currentTabParam &&
      ['received', 'sent', 'community', 'history'].includes(currentTabParam) &&
      currentTabParam !== activeTab
    ) {
      setActiveTab(currentTabParam);
    }
  }, [searchParams, activeTab]);

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
      handleTabChange('received');
    } else if (foundInSent) {
      handleTabChange('sent');
    } else if (foundInHistory) {
      handleTabChange('history');
    } else if (foundInCommunity) {
      handleTabChange('community');
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
        <div className="space-y-4">
          {communityOffers.map((offer) => {
            const isSent = offer.type === 'sent';
            const otherPerson = isSent ? offer.post.author : offer.offerer;
            const otherName =
              otherPerson.profile?.displayName ||
              [otherPerson.firstName, otherPerson.lastName].filter(Boolean).join(' ') ||
              'Trader';
            const otherAvatar = otherPerson.profile?.avatarUrl ? sanitizeUrl(otherPerson.profile.avatarUrl) : null;
            const { cleanText, imageUrls } = parseOfferContent(offer.message);
            const postPreview =
              offer.post.content.length > 90
                ? offer.post.content.slice(0, 90) + '...'
                : offer.post.content;

            return (
              <div
                key={offer.id}
                id={`offer-${offer.id}`}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors p-5 sm:p-6 scroll-mt-24"
              >
                <div className="flex items-start gap-4">
                  {/* Trader Avatar / Initials */}
                  {otherAvatar ? (
                    <img
                      src={otherAvatar}
                      alt={otherName}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
                      {getTraderInitials(otherName)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Top Meta Row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            isSent
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isSent ? 'Sent' : 'Received'}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {new Date(offer.createdAt).toLocaleDateString()}
                        </span>
                        {otherPerson.isVerified && (
                          <span
                            title="Verified Identity"
                            className="p-0.5 rounded bg-blue-50 border border-blue-200 text-blue-600 flex items-center"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {otherPerson.brandVerificationStatus === 'VERIFIED_BRAND' && (
                          <BrandBadge size="xs" />
                        )}
                        {otherPerson.tier === 'premium' && <PremiumBadge size="xs" />}
                      </div>
                    </div>

                    {/* Who Offered Header */}
                    <p className="text-sm sm:text-base font-semibold text-slate-800 mt-1">
                      {isSent ? `You offered to @${otherName}` : `@${otherName} offered you`}
                    </p>

                    {/* Proposal Text Area (Clean White Card with Subtle Border & Clear Font) */}
                    <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 my-3 shadow-2xs">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded mb-2">
                        <Tag className="w-3 h-3 text-slate-500" />
                        Offered Deal
                      </span>
                      <p className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed font-sans">
                        {cleanText}
                      </p>

                      {/* Render Attached Offer Photos */}
                      {imageUrls.length > 0 && (
                        <div className="flex items-center gap-2.5 mt-3.5 pt-3 border-t border-slate-100">
                          {imageUrls.map((url, idx) => (
                            <a
                              key={idx}
                              href={sanitizeUrl(url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-slate-200 block group shadow-2xs"
                            >
                              <Image
                                src={sanitizeUrl(url)}
                                alt="Trade Item Photo"
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* On Request Dedicated Context Section */}
                    <div className="my-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 block mb-1">
                        On Request
                      </span>
                      <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed bg-slate-50 border border-slate-200/90 rounded-md p-3">
                        {postPreview}
                      </p>
                    </div>

                    {/* Action Buttons Toolbar */}
                    <div className="flex flex-wrap items-center gap-2.5 mt-3.5">
                      <button
                        onClick={() => router.push(`/messages/${otherPerson.id}`)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md font-bold text-xs transition-colors shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Open Direct Chat</span>
                      </button>

                      <Link
                        href={`/post/${offer.postId}`}
                        className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 font-semibold transition-colors px-3.5 py-2.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Post</span>
                      </Link>

                      <button
                        onClick={() => router.push(`/messages/${otherPerson.id}?action=counter`)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-md transition-colors"
                      >
                        <Repeat className="w-3.5 h-3.5" />
                        <span>Counter Offer</span>
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
                onClick={() => handleTabChange(tab.id as Tab)}
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
