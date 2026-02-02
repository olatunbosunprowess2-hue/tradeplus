'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import EditProfileModal from '@/components/EditProfileModal';
import ReviewList from '@/components/ReviewList';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';
import { DistressBoostModal, SpotlightModal } from '@/components/PaywallModal';
import { initializePayment, redirectToPaystack, useSpotlightCredit } from '@/lib/payments-api';
import { Check, Sparkles } from 'lucide-react';

interface Listing {
    id: string;
    title: string;
    priceCents: number | null;
    currencyCode: string;
    status: string;
    images: Array<{
        id: string;
        url: string;
        sortOrder: number;
    }>;
    isDistressSale?: boolean;
    isFeatured?: boolean;
    spotlightExpiry?: string;
    isCrossListed?: boolean;
}

export default function ProfilePage() {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [listings, setListings] = useState<Listing[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    // Promote modal state
    const [promoteModal, setPromoteModal] = useState<'distress' | 'spotlight' | null>(null);
    const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);


    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted && !isAuthenticated) {
            router.push('/login');
        }
    }, [isMounted, isAuthenticated, router]);

    // Fetch user listings
    useEffect(() => {
        const fetchListings = async () => {
            if (user) {
                try {
                    setLoading(true);
                    const response = await apiClient.get(`/listings/my-listings?page=${page}&limit=10`);
                    if (page === 1) {
                        setListings(response.data.data);
                    } else {
                        setListings(prev => [...prev, ...response.data.data]);
                    }
                    setTotalPages(response.data.meta.totalPages);
                } catch (error) {
                    console.error('Failed to fetch listings:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchListings();
    }, [user, page]);


    const handleMarkAsSold = async (listingId: string) => {
        try {
            await apiClient.patch(`/listings/${listingId}`, { status: 'sold' });
            setListings(prev => prev.map(listing =>
                listing.id === listingId ? { ...listing, status: 'sold' } : listing
            ));
            toast.success('Listing marked as sold');
        } catch (error) {
            console.error('Failed to mark as sold:', error);
            toast.error('Failed to update listing');
        }
    };

    const handleReactivate = async (listingId: string) => {
        try {
            await apiClient.patch(`/listings/${listingId}`, { status: 'active' });
            setListings(prev => prev.map(listing =>
                listing.id === listingId ? { ...listing, status: 'active' } : listing
            ));
            toast.success('Listing reactivated');
        } catch (error) {
            console.error('Failed to reactivate:', error);
            toast.error('Failed to update listing');
        }
    };

    const handleDelete = async (listingId: string) => {
        if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
            return;
        }

        try {
            await apiClient.delete(`/listings/${listingId}`);
            setListings(prev => prev.filter(listing => listing.id !== listingId));
            toast.success('Listing deleted successfully');
        } catch (error) {
            console.error('Failed to delete listing:', error);
            toast.error('Failed to delete listing');
        }
    };

    const formatPrice = (priceCents: number | null, currencyCode: string) => {
        if (!priceCents) return 'Free';
        const price = priceCents / 100;
        if (currencyCode === 'NGN') {
            return `₦${price.toLocaleString()}`;
        }
        return `${currencyCode} ${price.toLocaleString()}`;
    };

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

    const handleUseCredit = async (optionId: string) => {
        if (!selectedListingId) return;

        setIsPaymentLoading(true);
        try {
            const result = await useSpotlightCredit(selectedListingId);
            if (result.success) {
                toast.success(result.message);
                // Refresh listings to show boosted status
                const response = await apiClient.get(`/listings/my-listings?page=${page}&limit=10`);
                setListings(response.data.data);
                setPromoteModal(null);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Credit usage failed:', error);
            toast.error('Failed to use credit. Please try again.');
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

    if (!isMounted || !user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
            {/* Header / Cover */}
            <div className="h-48 relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10"></div>
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/30 to-transparent"></div>
            </div>

            <div className="container mx-auto px-4 max-w-5xl -mt-16 relative z-10">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
                                {user.profile?.avatarUrl ? (
                                    <img
                                        src={user.profile.avatarUrl.startsWith('http')
                                            ? user.profile.avatarUrl
                                            : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api').replace(/\/api$/, '')}${user.profile.avatarUrl}`
                                        }
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold">
                                        {user.profile?.displayName?.[0]?.toUpperCase() || user.firstName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-2 right-2 bg-green-500 w-5 h-5 rounded-full border-2 border-white" title="Online"></div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 pt-2">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                        {user.profile?.displayName || 'User'}
                                        {user.verificationStatus === 'VERIFIED' && (
                                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </h1>
                                    <p className="text-gray-500 flex items-center gap-1 mt-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {user.locationAddress || 'Lagos, Nigeria'}
                                    </p>

                                </div>
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition shadow-sm">
                                    Edit Profile
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-6 py-4 border-t border-gray-100">
                                <div>
                                    <span className="block text-2xl font-bold text-gray-900">{user.profile?.responseRate || 100}%</span>
                                    <span className="text-sm text-gray-500">Response Rate</span>
                                </div>
                                <div>
                                    <span className="block text-2xl font-bold text-gray-900">{user.profile?.rating || 5.0}</span>
                                    <span className="text-sm text-gray-500">Rating ({user.profile?.reviewCount || 0} reviews)</span>
                                </div>
                                <div>
                                    <span className="block text-2xl font-bold text-gray-900">
                                        {new Date(user.createdAt).getFullYear()}
                                    </span>
                                    <span className="text-sm text-gray-500">Member Since</span>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-t border-gray-200 px-6">
                        <button
                            onClick={() => setActiveTab('listings')}
                            className={`px-6 py-4 font-medium text-sm border-b-2 transition ${activeTab === 'listings'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}>
                            My Listings ({listings.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`px-6 py-4 font-medium text-sm border-b-2 transition ${activeTab === 'reviews'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}>
                            Reviews
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {activeTab === 'listings' && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loading ? (
                                <div className="col-span-full flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <>
                                    {listings.map((listing) => (
                                        <div key={listing.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
                                            <div className="aspect-video bg-gray-100 relative">
                                                {listing.images[0] ? (
                                                    <img src={listing.images[0].url} alt={listing.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        No Image
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${listing.status === 'active' ? 'bg-green-100 text-green-700' : listing.status === 'sold' ? 'bg-blue-100 text-blue-700 line-through' : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {listing.status === 'sold' ? 'SOLD' : listing.status.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h3 className={`font-bold text-gray-900 mb-1 ${listing.status === 'sold' ? 'line-through opacity-60' : ''}`}>{listing.title}</h3>
                                                <p className={`text-blue-600 font-bold text-sm mb-4 ${listing.status === 'sold' ? 'line-through opacity-60' : ''}`}>
                                                    {formatPrice(listing.priceCents, listing.currencyCode)}
                                                </p>
                                                <div className="flex flex-col gap-2">
                                                    {/* Promote Button - Only for active listings */}
                                                    {listing.status === 'active' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handlePromote(listing);
                                                            }}
                                                            disabled={!!isAlreadyBoosted(listing)}
                                                            className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 shadow-xl overflow-hidden group/btn ${isAlreadyBoosted(listing)
                                                                ? 'bg-emerald-500 text-white cursor-default shadow-emerald-100'
                                                                : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]'
                                                                }`}
                                                        >
                                                            {!isAlreadyBoosted(listing) && (
                                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] transition-transform" />
                                                            )}

                                                            {isAlreadyBoosted(listing) ? (
                                                                <>
                                                                    <div className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center">
                                                                        <Check className="w-2.5 h-2.5" />
                                                                    </div>
                                                                    ACTIVE BOOST
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Sparkles className="w-3 h-3 text-amber-400 group-hover/btn:rotate-12 transition-transform" />
                                                                    BOOST VISIBILITY
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                    <div className="flex gap-2">
                                                        {listing.status === 'active' && (
                                                            <button
                                                                onClick={() => handleMarkAsSold(listing.id)}
                                                                className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition">
                                                                Mark as Sold
                                                            </button>
                                                        )}
                                                        {listing.status === 'sold' && (
                                                            <button
                                                                onClick={() => handleReactivate(listing.id)}
                                                                className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition">
                                                                Reactivate
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(listing.id)}
                                                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Load More */}
                                    {page < totalPages && (
                                        <div className="col-span-full flex justify-center mt-4">
                                            <button
                                                onClick={() => setPage(p => p + 1)}
                                                disabled={loading}
                                                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                                            >
                                                {loading ? 'Loading...' : 'Load More Listings'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Add New Card */}
                                    <Link href="/listings/create" className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-8 hover:border-blue-600 hover:bg-blue-50 transition group min-h-[200px]">

                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                        <span className="font-bold text-gray-900">Create New Listing</span>
                                    </Link>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Reviews Received</h2>
                            <ReviewList userId={user.id} />
                        </div>
                    )}
                </div>
            </div>

            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
            />

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
                onUseCredit={handleUseCredit}
                creditsAvailable={user?.spotlightCredits}
                isLoading={isPaymentLoading}
            />
        </div>
    );
}
