'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { apiClient } from '@/lib/api-client';
import ListingCard from '@/components/ListingCard';
import Link from 'next/link';
import { DistressBoostModal, SpotlightModal } from '@/components/PaywallModal';
import { initializePayment, redirectToPaystack } from '@/lib/payments-api';
import { toast } from 'react-hot-toast';
import { Check, Sparkles } from 'lucide-react';

interface Listing {
    id: string;
    title: string;
    priceCents: number;
    currencyCode: string;
    images: { url: string }[];
    status: string;
    createdAt: string;
    isDistressSale?: boolean;
    isFeatured?: boolean;
    spotlightExpiry?: string;
    isCrossListed?: boolean;
    _count?: { views: number };
}

export default function MyListingsPage() {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [listings, setListings] = useState<Listing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'sold' | 'draft'>('all');

    // Promote modal state
    const [promoteModal, setPromoteModal] = useState<'distress' | 'spotlight' | null>(null);
    const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        const fetchListings = async () => {
            try {
                const response = await apiClient.get(`/listings/user/${user?.id}`);
                setListings(response.data);
            } catch (error) {
                console.error('Failed to fetch listings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchListings();
    }, [isAuthenticated, user?.id, router]);

    const filteredListings = listings.filter(listing => {
        if (filter === 'all') return true;
        return listing.status === filter;
    });

    const getStatusCounts = () => {
        return {
            all: listings.length,
            active: listings.filter(l => l.status === 'active').length,
            sold: listings.filter(l => l.status === 'sold').length,
            draft: listings.filter(l => l.status === 'draft').length,
        };
    };

    const counts = getStatusCounts();

    // Handle Promote button click
    const handlePromote = (listing: Listing) => {
        setSelectedListingId(listing.id);
        if (listing.isDistressSale) {
            setPromoteModal('distress');
        } else {
            setPromoteModal('spotlight');
        }
    };

    // Handle payment selection
    const handlePaywallSelect = async (optionId: string, currency: 'NGN' | 'USD') => {
        if (!selectedListingId) return;

        setIsPaymentLoading(true);
        try {
            const result = await initializePayment(optionId as any, selectedListingId, currency);
            redirectToPaystack(result.authorizationUrl);
        } catch (error) {
            console.error('Payment initialization failed:', error);
            toast.error('Failed to initialize payment. Please try again.');
        } finally {
            setIsPaymentLoading(false);
        }
    };

    const handleModalClose = () => {
        setPromoteModal(null);
        setSelectedListingId(null);
    };

    // Check if listing is already boosted
    const isAlreadyBoosted = (listing: Listing): boolean => {
        if (listing.isDistressSale) {
            return !!listing.isCrossListed;
        }
        return !!(listing.isFeatured || (listing.spotlightExpiry && new Date(listing.spotlightExpiry) > new Date()));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your listings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="container mx-auto px-4 py-6 max-w-6xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
                        <p className="text-gray-600">Manage your items for sale</p>
                    </div>
                    <Link
                        href="/listings/create"
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Listing
                    </Link>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'active', label: 'Active' },
                        { key: 'sold', label: 'Sold' },
                        { key: 'draft', label: 'Drafts' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key as any)}
                            className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${filter === tab.key
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {tab.label}
                            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${filter === tab.key ? 'bg-white/20' : 'bg-gray-100'
                                }`}>
                                {counts[tab.key as keyof typeof counts]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Listings Grid */}
                {filteredListings.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">📦</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {filter === 'all' ? 'No listings yet' : `No ${filter} listings`}
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            {filter === 'all'
                                ? "Start selling by creating your first listing!"
                                : `You don't have any ${filter} listings at the moment.`}
                        </p>
                        {filter === 'all' && (
                            <Link
                                href="/listings/create"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                            >
                                Create Your First Listing
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredListings.map((listing) => (
                            <div key={listing.id} className="relative">
                                <ListingCard listing={listing as any} />

                                {/* Status Badge */}
                                {listing.status !== 'active' && (
                                    <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-bold ${listing.status === 'sold' ? 'bg-green-500 text-white' :
                                        listing.status === 'draft' ? 'bg-yellow-500 text-white' :
                                            'bg-gray-500 text-white'
                                        }`}>
                                        {listing.status.toUpperCase()}
                                    </div>
                                )}

                                {listing.status === 'active' && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handlePromote(listing);
                                        }}
                                        disabled={!!isAlreadyBoosted(listing)}
                                        className={`absolute bottom-3 left-3 right-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 shadow-xl overflow-hidden group/btn ${isAlreadyBoosted(listing)
                                            ? 'bg-emerald-500 text-white cursor-default shadow-emerald-100'
                                            : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]'
                                            }`}
                                    >
                                        {!isAlreadyBoosted(listing) && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] transition-transform" />
                                        )}

                                        {isAlreadyBoosted(listing) ? (
                                            <>
                                                <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                                                    <Check className="w-2.5 h-2.5" />
                                                </div>
                                                ACTIVE BOOST
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover/btn:rotate-12 transition-transform" />
                                                BOOST VISIBILITY
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Promote Modals */}
            <DistressBoostModal
                isOpen={promoteModal === 'distress'}
                onClose={handleModalClose}
                onSelectOption={handlePaywallSelect}
                isLoading={isPaymentLoading}
            />
            <SpotlightModal
                isOpen={promoteModal === 'spotlight'}
                onClose={handleModalClose}
                onSelectOption={handlePaywallSelect}
                isLoading={isPaymentLoading}
            />
        </div>
    );
}
