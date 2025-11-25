import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BookmarkedListing {
    id: string;
    title: string;
    priceCents?: number;
    currencyCode: string;
    images: { url: string }[];
    sellerId: string;
    sellerName: string;
    location?: string;
    bookmarkedAt: string;
}

interface BookmarksState {
    bookmarks: BookmarkedListing[];
    addBookmark: (listing: BookmarkedListing) => void;
    removeBookmark: (listingId: string) => void;
    isBookmarked: (listingId: string) => boolean;
}

export const useBookmarksStore = create<BookmarksState>()(
    persist(
        (set, get) => ({
            bookmarks: [],

            addBookmark: (listing) => {
                set((state) => ({
                    bookmarks: [...state.bookmarks, { ...listing, bookmarkedAt: new Date().toISOString() }],
                }));
            },

            removeBookmark: (listingId) => {
                set((state) => ({
                    bookmarks: state.bookmarks.filter((b) => b.id !== listingId),
                }));
            },

            isBookmarked: (listingId) => {
                return get().bookmarks.some((b) => b.id === listingId);
            },
        }),
        {
            name: 'bookmarks-storage',
        }
    )
);
