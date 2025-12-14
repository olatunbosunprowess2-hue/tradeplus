'use client';

import { useState } from 'react';
import { useBookmarksStore } from '@/lib/bookmarks-store';
import type { BookmarkedListing } from '@/lib/bookmarks-store';

interface BookmarkButtonProps {
    listing: BookmarkedListing;
    className?: string;
    showToast?: boolean;
}

export default function BookmarkButton({ listing, className = '', showToast = true }: BookmarkButtonProps) {
    const { addBookmark, removeBookmark, isBookmarked } = useBookmarksStore();
    const bookmarked = isBookmarked(listing.id);
    const [showMessage, setShowMessage] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Trigger animation
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);

        if (bookmarked) {
            removeBookmark(listing.id);
        } else {
            addBookmark(listing);
            if (showToast) {
                setShowMessage(true);
                setTimeout(() => setShowMessage(false), 3000);
            }
        }
    };

    return (
        <>
            <button
                onClick={handleToggle}
                className={className || `group flex items-center justify-center w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-gray-200/50 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 ${isAnimating ? 'scale-110' : ''}`}
                aria-label={bookmarked ? 'Remove from saved' : 'Save this listing'}
            >
                {bookmarked ? (
                    <svg
                        className={`w-[18px] h-[18px] text-rose-500 transition-transform ${isAnimating ? 'scale-125' : ''}`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                    </svg>
                ) : (
                    <svg
                        className="w-[18px] h-[18px] text-gray-600 group-hover:text-rose-500 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                    </svg>
                )}
            </button>

            {/* Saved Notification Toast */}
            {showMessage && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                            </svg>
                        </div>
                        <div>
                            <span className="font-semibold">Saved to Wants!</span>
                            <p className="text-xs text-white/80">View your saved items anytime</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
