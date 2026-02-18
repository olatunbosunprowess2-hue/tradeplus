'use client';

import { useState, useEffect } from 'react';
import { useWantsStore } from '@/lib/wants-store';
import { useBookmarksStore } from '@/lib/bookmarks-store';
import { useAuthStore } from '@/lib/auth-store';
import WantCard from '@/components/WantCard';
import AddWantModal from '@/components/AddWantModal';
import PostCard from '@/components/home/PostCard'; // Imported PostCard
import apiClient from '@/lib/api-client'; // Imported apiClient
import { CommunityPost } from '@/lib/types'; // Imported types
import Link from 'next/link';
import { sanitizeUrl } from '@/lib/utils';

export default function WantsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'wants' | 'bookmarks' | 'saved-posts'>('wants'); // Added saved-posts tab
    const wants = useWantsStore((state) => state.items);
    const bookmarks = useBookmarksStore((state) => state.bookmarks);
    const removeBookmark = useBookmarksStore((state) => state.removeBookmark);
    const [savedPosts, setSavedPosts] = useState<CommunityPost[]>([]); // State for saved posts
    const [loadingSavedPosts, setLoadingSavedPosts] = useState(false);
    const [mounted, setMounted] = useState(false);

    const fetchWants = useWantsStore((state) => state.fetchWants);

    // Hydration fix for persisted store & fetch data
    useEffect(() => {
        setMounted(true);
        fetchWants();
    }, [fetchWants]);

    // Fetch valid bookmarks from API when tab is active
    const [validBookmarks, setValidBookmarks] = useState<any[]>([]);
    const [loadingBookmarks, setLoadingBookmarks] = useState(false);

    useEffect(() => {
        if (activeTab === 'bookmarks' && bookmarks.length > 0) {
            setLoadingBookmarks(true);
            const ids = bookmarks.map(b => b.id).join(',');

            // OPTIMIZATION: Only fetch if we have IDs
            if (!ids) {
                setValidBookmarks([]);
                setLoadingBookmarks(false);
                return;
            }

            apiClient.get(`/listings?ids=${ids}&limit=100`)
                .then(r => {
                    // Update valid bookmarks with fresh data from API
                    // This automatically filters out deleted items (which cause 404s)
                    setValidBookmarks(r.data.data);
                })
                .catch(err => {
                    console.error('Failed to fetch bookmarks:', err);
                    // Fallback to local data if API fails, but this might risk 404s
                    // Better to show empty or error state than broken links?
                    // For now, let's stick to validBookmarks state
                })
                .finally(() => setLoadingBookmarks(false));
        } else if (activeTab === 'bookmarks' && bookmarks.length === 0) {
            setValidBookmarks([]);
        }
    }, [activeTab, bookmarks]);

    // ... (rest of component)

    const activeWants = wants.filter((i) => !i.isFulfilled);
    const fulfilledWants = wants.filter((i) => i.isFulfilled);

    // Handlers for PostCard
    const handlePostUpdated = (updatedPost: CommunityPost) => {
        setSavedPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    };

    const handlePostDeleted = (id: string) => {
        setSavedPosts(prev => prev.filter(p => p.id !== id));
    };

    // Allow unsaving directly from the list
    const handleToggleSave = (id: string, saved: boolean) => {
        if (!saved) {
            setSavedPosts(prev => prev.filter(p => p.id !== id));
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Bookmarks</h1>
                        <p className="text-gray-700 font-medium">
                            Track items you want, saving listings, and community posts.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                const user = useAuthStore.getState().user;
                                const url = `${window.location.origin}/share/${user?.id}/wants`;
                                let shareContent = { title: 'BarterWave', text: 'Check this out!' };

                                if (activeTab === 'wants') {
                                    shareContent = {
                                        title: `${user?.profile?.displayName || 'My'} Wishlist 🎯`,
                                        text: `Hey! 👋 Check out my wishlist.`,
                                    };
                                } else if (activeTab === 'bookmarks') {
                                    shareContent = {
                                        title: `${user?.profile?.displayName || 'My'} Saved Items 💎`,
                                        text: `Found some amazing items! 🌟 Take a look at what caught my eye.`,
                                    };
                                } else {
                                    shareContent = {
                                        title: `${user?.profile?.displayName || 'My'} Saved Posts 📌`,
                                        text: `Interesting discussions and trades I'm following.`,
                                    };
                                }

                                if (navigator.share) {
                                    navigator.share({
                                        title: shareContent.title,
                                        text: shareContent.text,
                                        url,
                                    }).catch(console.error);
                                } else {
                                    const fullMessage = `${shareContent.title}\n\n${shareContent.text}\n\n${url}`;
                                    navigator.clipboard.writeText(fullMessage);
                                    alert('Link copied to clipboard!');
                                }
                            }}
                            className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Share
                        </button>
                        {activeTab === 'wants' && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="hidden md:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Want
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('wants')}
                        className={`px-6 py-3 font-bold transition-colors whitespace-nowrap relative ${activeTab === 'wants'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        My Wants
                        {activeWants.length > 0 && (
                            <span className="ml-2 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                {activeWants.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('bookmarks')}
                        className={`px-6 py-3 font-bold transition-colors whitespace-nowrap relative ${activeTab === 'bookmarks'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Saved Listings
                        {bookmarks.length > 0 && (
                            <span className="ml-2 bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                {bookmarks.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('saved-posts')}
                        className={`px-6 py-3 font-bold transition-colors whitespace-nowrap relative ${activeTab === 'saved-posts'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Saved Posts
                        {savedPosts.length > 0 && (
                            <span className="ml-2 bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                {savedPosts.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Wants Tab */}
                {activeTab === 'wants' && (
                    <div>
                        {wants.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                                    <span className="text-4xl">📝</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Your wants list is empty</h2>
                                <p className="text-gray-600 font-medium max-w-md mb-8">
                                    Start adding items you want to trade or buy. We'll help you find them!
                                </p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors shadow-lg"
                                >
                                    Add Your First Want
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Active Wants */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {activeWants.map((item) => (
                                        <WantCard key={item.id} item={item} />
                                    ))}
                                </div>

                                {/* Fulfilled Wants */}
                                {fulfilledWants.length > 0 && (
                                    <div className="pt-8 border-t border-gray-200">
                                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>✅</span> Fulfilled Items
                                        </h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-75">
                                            {fulfilledWants.map((item) => (
                                                <WantCard key={item.id} item={item} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Bookmarks Tab */}
                {activeTab === 'bookmarks' && (
                    <div>
                        {loadingBookmarks ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden h-80 animate-pulse">
                                        <div className="h-48 bg-gray-200" />
                                        <div className="p-4 space-y-3">
                                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : validBookmarks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                                    <svg className="w-12 h-12 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">No active bookmarks</h2>
                                <p className="text-gray-600 font-medium max-w-md mb-8">
                                    Items you bookmark will appear here. If an item is sold or deleted, it will be removed from this list.
                                </p>
                                <Link
                                    href="/listings"
                                    className="bg-purple-600 text-white px-8 py-3 rounded-full font-bold hover:bg-purple-700 transition-colors shadow-lg"
                                >
                                    Browse Listings
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {validBookmarks.map((bookmark) => (
                                    <div
                                        key={bookmark.id}
                                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition group relative"
                                    >
                                        <Link href={`/listings/${bookmark.id}`} className="block">
                                            {bookmark.images?.[0] ? (
                                                <div className="relative">
                                                    <img
                                                        src={sanitizeUrl(bookmark.images[0].url)}
                                                        alt={bookmark.title}
                                                        className="w-full h-48 object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                                                    <span className="text-4xl">📦</span>
                                                </div>
                                            )}
                                            <div className="p-4">
                                                <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-900">
                                                    {bookmark.title}
                                                </h3>
                                                {bookmark.priceCents !== undefined && (
                                                    <p className="text-blue-600 font-bold text-xl mb-2">
                                                        {bookmark.currencyCode} {(bookmark.priceCents / 100).toLocaleString()}
                                                    </p>
                                                )}
                                                <div className="flex justify-between items-center mt-2">
                                                    <p className="text-gray-500 text-xs">
                                                        {bookmark.seller?.profile?.displayName || 'Unknown Seller'}
                                                    </p>
                                                    {bookmark.region?.name && (
                                                        <p className="text-gray-400 text-xs">
                                                            📍 {bookmark.region.name}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                removeBookmark(bookmark.id);
                                                // Optimistic update
                                                setValidBookmarks(prev => prev.filter(b => b.id !== bookmark.id));
                                            }}
                                            className="absolute top-2 right-2 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all shadow-md hover:shadow-lg text-red-500 hover:text-red-600 z-10"
                                            title="Remove Bookmark"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Saved Posts Tab */}
                {activeTab === 'saved-posts' && (
                    <div className="max-w-2xl mx-auto">
                        {loadingSavedPosts ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                            <div>
                                                <div className="h-3 w-24 bg-gray-200 rounded mb-1" />
                                                <div className="h-2 w-16 bg-gray-100 rounded" />
                                            </div>
                                        </div>
                                        <div className="h-3 w-full bg-gray-100 rounded mb-2" />
                                        <div className="h-3 w-3/4 bg-gray-100 rounded" />
                                    </div>
                                ))}
                            </div>
                        ) : savedPosts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                                    <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">No saved posts</h2>
                                <p className="text-gray-600 font-medium max-w-md mb-8">
                                    Save interesting posts from the Community Feed to read them later.
                                </p>
                                <Link
                                    href="/listings?tab=community"
                                    className="bg-emerald-600 text-white px-8 py-3 rounded-full font-bold hover:bg-emerald-700 transition-colors shadow-lg"
                                >
                                    Go to Community Feed
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {savedPosts.map(post => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        onDelete={handlePostDeleted}
                                        onUpdate={handlePostUpdated}
                                        savedIds={savedPosts.map(p => p.id)}
                                        onToggleSave={handleToggleSave}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Mobile Floating Action Button */}
            {
                activeTab === 'wants' && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-blue-700 transition-transform active:scale-95 z-40"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                )
            }

            <AddWantModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div >
    );
}
