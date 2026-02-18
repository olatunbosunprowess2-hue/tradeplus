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
import { initializePayment, redirectToPaystack, useSpotlightCredit, PurchaseType } from '@/lib/payments-api';
import { Check, Sparkles, Pencil } from 'lucide-react';
import EditPostModal from '@/components/home/EditPostModal';
import { CommunityPost } from '@/lib/types';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sanitizeUrl } from '@/lib/utils';

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
    const queryClient = useQueryClient();

    // UI State
    const [promoteModal, setPromoteModal] = useState<'distress' | 'spotlight' | null>(null);
    const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'listings' | 'reviews' | 'posts'>('listings');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);

    // Initial Mount Check
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted && !isAuthenticated) {
            router.push('/login');
        }
    }, [isMounted, isAuthenticated, router]);

    // ============================================================================
    // QUERIES
    // ============================================================================

    // Listings Query
    const {
        data: listingsData,
        fetchNextPage: fetchNextListings,
        hasNextPage: hasNextListings,
        isFetchingNextPage: isFetchingNextListings,
        isLoading: isListingsLoading
    } = useInfiniteQuery({
        queryKey: ['my-listings', user?.id],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await apiClient.get(`/listings?sellerId=${user?.id}&page=${pageParam}&limit=12&includeAll=true`);
            return res.data;
        },
        getNextPageParam: (lastPage) => {
            const meta = lastPage.meta || { totalPages: 1, page: 1 };
            const currentPage = meta.page || 1;
            const totalPages = meta.totalPages || 1;
            return currentPage < totalPages ? currentPage + 1 : undefined;
        },
        enabled: !!user && activeTab === 'listings',
        initialPageParam: 1,
        staleTime: 60 * 1000, // 1 minute stale time
    });

    const listings = listingsData?.pages.flatMap(page => page.data || page) || [];

    // Posts Query
    const {
        data: postsData,
        fetchNextPage: fetchNextPosts,
        hasNextPage: hasNextPosts,
        isFetchingNextPage: isFetchingNextPosts,
        isLoading: isPostsLoading
    } = useInfiniteQuery({
        queryKey: ['my-posts', user?.id],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await apiClient.get(`/community-posts/user/my-posts?page=${pageParam}&limit=10`);
            return res.data;
        },
        getNextPageParam: (lastPage) => {
            const meta = lastPage.meta || { totalPages: 1, page: 1 };
            const currentPage = meta.page || meta.currentPage || 1;
            const totalPages = meta.totalPages || 1;
            return currentPage < totalPages ? currentPage + 1 : undefined;
        },
        enabled: !!user && activeTab === 'posts',
        initialPageParam: 1,
        staleTime: 60 * 1000,
    });

    const posts = postsData?.pages.flatMap(page => page.data || []) || [];

    // ============================================================================
    // MUTATIONS
    // ============================================================================

    const updateListingMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            return apiClient.patch(`/listings/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-listings'] });
            toast.success('Listing updated successfully');
        },
        onError: () => toast.error('Failed to update listing'),
    });

    const deleteListingMutation = useMutation({
        mutationFn: async (id: string) => {
            return apiClient.delete(`/listings/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-listings'] });
            toast.success('Listing deleted');
        },
        onError: () => toast.error('Failed to delete listing'),
    });

    const updatePostMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            return apiClient.patch(`/community-posts/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-posts'] });
            toast.success('Post updated');
        },
        onError: () => toast.error('Failed to update post'),
    });

    const deletePostMutation = useMutation({
        mutationFn: async (id: string) => {
            return apiClient.delete(`/community-posts/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-posts'] });
            toast.success('Post deleted');
        },
        onError: () => toast.error('Failed to delete post'),
    });

    // ============================================================================
    // HANDLERS
    // ============================================================================

    const formatPrice = (cents: number | null, currency: string) => {
        if (!cents) return 'Free / Barter';
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: currency || 'NGN' }).format(cents / 100);
    };

    const isAlreadyBoosted = (listing: Listing) => {
        if (listing.isDistressSale) return 'distress';
        if (listing.spotlightExpiry && new Date(listing.spotlightExpiry) > new Date()) return 'spotlight';
        if (listing.isFeatured) return 'featured';
        return null;
    };

    const handlePromote = (listing: Listing) => {
        setSelectedListingId(listing.id);
        setPromoteModal('spotlight');
    };

    const handleMarkAsSold = (listingId: string) => {
        updateListingMutation.mutate({ id: listingId, data: { status: 'sold' } });
    };

    const handleReactivate = (listingId: string) => {
        updateListingMutation.mutate({ id: listingId, data: { status: 'active' } });
    };

    const handleDelete = (listingId: string) => {
        if (!confirm('Are you sure you want to delete this listing?')) return;
        deleteListingMutation.mutate(listingId);
    };

    const handleTogglePostStatus = (postId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'resolved' : 'active';
        updatePostMutation.mutate({ id: postId, data: { status: newStatus } });
    };

    const handleDeletePost = (postId: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        deletePostMutation.mutate(postId);
    };

    const handleModalClose = () => {
        setPromoteModal(null);
        setSelectedListingId(null);
        setIsPaymentLoading(false);
    };

    const handlePaywallSelect = async (type: string, currency: 'NGN' | 'USD' = 'NGN') => {
        if (!selectedListingId) return;
        setIsPaymentLoading(true);
        try {
            const result = await initializePayment(type as PurchaseType, selectedListingId, currency);
            if (result?.authorizationUrl) {
                redirectToPaystack(result.authorizationUrl);
            }
        } catch (error) {
            toast.error('Payment initialization failed');
        } finally {
            setIsPaymentLoading(false);
        }
    };

    const handleUseCredit = async () => {
        if (!selectedListingId) return;
        setIsPaymentLoading(true);
        try {
            await useSpotlightCredit(selectedListingId);
            toast.success('Spotlight applied!');
            handleModalClose();
            queryClient.invalidateQueries({ queryKey: ['my-listings'] });
            // Optimistic update of user credits if needed, or invalidate user query
        } catch (error) {
            toast.error('Failed to apply spotlight');
        } finally {
            setIsPaymentLoading(false);
        }
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
                                        src={sanitizeUrl(user.profile.avatarUrl)}
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
                                    className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-gray-50 hover:text-gray-900 transition shadow-sm active:scale-95">
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
                    <div className="flex border-t border-gray-200 px-6 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('listings')}
                            className={`px-6 py-4 font-medium text-sm border-b-2 transition whitespace-nowrap ${activeTab === 'listings'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}>
                            My Listings ({listings.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`px-6 py-4 font-medium text-sm border-b-2 transition whitespace-nowrap ${activeTab === 'posts'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}>
                            My Posts
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`px-6 py-4 font-medium text-sm border-b-2 transition whitespace-nowrap ${activeTab === 'reviews'
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
                            {isListingsLoading ? (
                                <div className="col-span-full flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <>
                                    {listings.map((listing: Listing) => (
                                        <div key={listing.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
                                            <div className="aspect-video bg-gray-100 relative">
                                                {listing.images && listing.images[0] ? (
                                                    <img src={sanitizeUrl(listing.images[0].url)} alt={listing.title} className="w-full h-full object-cover" />
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
                                                                className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-100 transition active:scale-95">
                                                                Mark as Sold
                                                            </button>
                                                        )}
                                                        {listing.status === 'sold' && (
                                                            <button
                                                                onClick={() => handleReactivate(listing.id)}
                                                                className="flex-1 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-100 transition active:scale-95">
                                                                Reactivate
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(listing.id)}
                                                            className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition active:scale-90">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Load More */}
                                    {hasNextListings && (
                                        <div className="col-span-full flex justify-center mt-4">
                                            <button
                                                onClick={() => fetchNextListings()}
                                                disabled={isFetchingNextListings}
                                                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                                            >
                                                {isFetchingNextListings ? 'Loading...' : 'Load More Listings'}
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

                    {activeTab === 'posts' && (
                        <div className="flex flex-col gap-6">
                            {isPostsLoading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <>
                                    {posts.length === 0 ? (
                                        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">No Posts Yet</h3>
                                            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                                                Share your thoughts, ask questions, or start a discussion with the community.
                                            </p>
                                            <Link href="/community" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">
                                                Create Post
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {posts.map((post: any) => (
                                                <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                                                    <div className="p-4 flex-1">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-gray-400">
                                                                    {new Date(post.createdAt).toLocaleDateString()}
                                                                </span>
                                                                {post.status === 'resolved' ? (
                                                                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 uppercase tracking-wide">
                                                                        Resolved
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 uppercase tracking-wide">
                                                                        Active
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-gray-800 line-clamp-3 mb-4">{post.content}</p>
                                                        {post.images && post.images.length > 0 && (
                                                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4 relative">
                                                                <img src={sanitizeUrl(post.images[0])} alt="Post attachment" className="w-full h-full object-cover" />
                                                                {post.images.length > 1 && (
                                                                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md font-bold">
                                                                        +{post.images.length - 1} more
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                                            <div className="flex items-center gap-1">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                                </svg>
                                                                {post._count?.comments || 0}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                {post._count?.offers || 0}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 border-t border-gray-100 flex gap-2">
                                                        <button
                                                            onClick={() => handleTogglePostStatus(post.id, post.status)}
                                                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wide transition ${post.status === 'active'
                                                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                                }`}
                                                        >
                                                            {post.status === 'active' ? 'Mark Resolved' : 'Mark Active'}
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingPost(post)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                            title="Edit Post"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePost(post.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                            title="Delete Post"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Load More Posts */}
                                    {hasNextPosts && (
                                        <div className="flex justify-center mt-4">
                                            <button
                                                onClick={() => fetchNextPosts()}
                                                disabled={isFetchingNextPosts}
                                                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                                            >
                                                {isFetchingNextPosts ? 'Loading...' : 'Load More Posts'}
                                            </button>
                                        </div>
                                    )}
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
            {editingPost && (
                <EditPostModal
                    post={editingPost}
                    onClose={() => setEditingPost(null)}
                    onSaved={() => {
                        queryClient.invalidateQueries({ queryKey: ['my-posts'] });
                        setEditingPost(null);
                        toast.success('Post updated successfully');
                    }}
                />
            )}
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
        </div >
    );
}
