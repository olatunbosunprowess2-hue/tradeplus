'use client';

import { useState, useEffect } from 'react';
import { useWantsStore } from '@/lib/wants-store';
import { useBookmarksStore } from '@/lib/bookmarks-store';
import { useAuthStore } from '@/lib/auth-store';
import WantCard from '@/components/WantCard';
import AddWantModal from '@/components/AddWantModal';
import Link from 'next/link';

export default function WantsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'wants' | 'bookmarks'>('wants');
    const wants = useWantsStore((state) => state.items);
    const bookmarks = useBookmarksStore((state) => state.bookmarks);
    const removeBookmark = useBookmarksStore((state) => state.removeBookmark);
    const [mounted, setMounted] = useState(false);

    const fetchWants = useWantsStore((state) => state.fetchWants);

    // Hydration fix for persisted store & fetch data
    useEffect(() => {
        setMounted(true);
        fetchWants();
    }, [fetchWants]);

    if (!mounted) return null;

    const activeWants = wants.filter((i) => !i.isFulfilled);
    const fulfilledWants = wants.filter((i) => i.isFulfilled);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Wants & Bookmarks</h1>
                        <p className="text-gray-700 font-medium">
                            Track items you're looking for and save interesting listings
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                const user = useAuthStore.getState().user;
                                const url = `${window.location.origin}/share/${user?.id}/wants`;

                                // Dynamic share text based on active tab
                                const shareContent = activeTab === 'wants'
                                    ? {
                                        title: `${user?.profile?.displayName || 'My'} TradePlus Bucketlist 🎯`,
                                        text: `Hey! 👋 Check out my bucketlist on TradePlus.`,
                                    }
                                    : {
                                        title: `${user?.profile?.displayName || 'My'} Saved Items on TradePlus 💎`,
                                        text: `Found some amazing items on TradePlus! 🌟 Take a look at what caught my eye. You might love them too!`,
                                    };

                                if (navigator.share) {
                                    navigator.share({
                                        title: shareContent.title,
                                        text: shareContent.text,
                                        url,
                                    }).catch(console.error);
                                } else {
                                    const fullMessage = `${shareContent.title}\n\n${shareContent.text}\n\n${url}`;
                                    navigator.clipboard.writeText(fullMessage);
                                    alert('Link copied to clipboard with message!');
                                }
                            }}
                            className="flex items-center gap-2 bg-white text-blue-600 border border-blue-200 px-6 py-3 rounded-full font-bold hover:bg-blue-50 transition-transform hover:scale-105 shadow-sm"
                        >
                            <span className="text-xl">📤</span>
                            Share {activeTab === 'wants' ? 'Wishlist' : 'Bookmarks'}
                        </button>
                        {activeTab === 'wants' && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="hidden md:flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full font-bold hover:bg-blue-700 transition-transform hover:scale-105 shadow-lg"
                            >
                                <span className="text-xl">✒️</span>
                                Add New Want
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('wants')}
                        className={`px-6 py-3 font-bold transition-colors relative ${activeTab === 'wants'
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
                        className={`px-6 py-3 font-bold transition-colors relative ${activeTab === 'bookmarks'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Bookmarked Items
                        {bookmarks.length > 0 && (
                            <span className="ml-2 bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                {bookmarks.length}
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
                        {bookmarks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                                    <svg className="w-12 h-12 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">No bookmarks yet</h2>
                                <p className="text-gray-600 font-medium max-w-md mb-8">
                                    Browse listings and bookmark items you're interested in for later
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
                                {bookmarks.map((bookmark) => (
                                    <div
                                        key={bookmark.id}
                                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition group"
                                    >
                                        <Link href={`/listings/${bookmark.id}`} className="block">
                                            {bookmark.images?.[0] && (
                                                <div className="relative">
                                                    <img
                                                        src={bookmark.images[0].url}
                                                        alt={bookmark.title}
                                                        className="w-full h-48 object-cover"
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            removeBookmark(bookmark.id);
                                                        }}
                                                        className="absolute top-2 right-2 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all shadow-md hover:shadow-lg"
                                                    >
                                                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                            <div className="p-4">
                                                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                                                    {bookmark.title}
                                                </h3>
                                                {bookmark.priceCents && bookmark.priceCents > 0 && (
                                                    <p className="text-blue-600 font-bold text-xl mb-2">
                                                        ₦{(bookmark.priceCents / 100).toLocaleString()}
                                                    </p>
                                                )}
                                                <p className="text-gray-600 text-sm">
                                                    {bookmark.sellerName}
                                                </p>
                                                {bookmark.location && (
                                                    <p className="text-gray-500 text-xs mt-1">
                                                        📍 {bookmark.location}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    </div>
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
