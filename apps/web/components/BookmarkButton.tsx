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

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

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
                className={`p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all shadow-md hover:shadow-lg ${className}`}
                aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
                {bookmarked ? (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3-7 3V5z" />
                    </svg>
                )}
            </button>

            {showMessage && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-down">
                    <div className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                        </svg>
                        <span className="font-medium">Bookmark saved! View in Wants page</span>
                    </div>
                </div>
            )}
        </>
    );
}
