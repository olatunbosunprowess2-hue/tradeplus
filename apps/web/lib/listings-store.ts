import { create } from 'zustand';
import type { Listing } from './types';

interface ListingsState {
    listings: Listing[];
    addListing: (listing: Listing) => void;
    setListings: (listings: Listing[]) => void;
    getListings: (search?: string) => Listing[];
    getPaginatedListings: (page: number, limit: number, search?: string, type?: string, condition?: string, paymentMode?: string, minPrice?: string, maxPrice?: string, category?: string) => { data: Listing[], total: number, hasMore: boolean };
}

export const useListingsStore = create<ListingsState>()(
    (set, get) => ({
        listings: [],

        addListing: (listing) => {
            set((state) => ({
                listings: [listing, ...state.listings]
            }));
        },

        setListings: (listings) => {
            set({ listings });
        },

        getListings: (search) => {
            const { listings } = get();
            if (!search) return listings;

            const lowerSearch = search.toLowerCase();
            return listings.filter(item =>
                item.title.toLowerCase().includes(lowerSearch) ||
                item.description?.toLowerCase().includes(lowerSearch) ||
                item.category.name.toLowerCase().includes(lowerSearch)
            );
        },

        getPaginatedListings: (page: number, limit: number, search?: string, type?: string, condition?: string, paymentMode?: string, minPrice?: string, maxPrice?: string, category?: string) => {
            const { listings } = get();
            let filtered = listings;

            // Filter by Search
            if (search) {
                const lowerSearch = search.toLowerCase();
                filtered = filtered.filter(item =>
                    item.title.toLowerCase().includes(lowerSearch) ||
                    item.description?.toLowerCase().includes(lowerSearch) ||
                    item.category.name.toLowerCase().includes(lowerSearch)
                );
            }

            // Filter by Category
            if (category && category !== 'All') {
                filtered = filtered.filter(item => item.category.name === category);
            }

            // Filter by Type
            if (type) {
                filtered = filtered.filter(item => item.type === type);
            }

            // Filter by Condition
            if (condition) {
                filtered = filtered.filter(item => item.condition === condition);
            }

            // Filter by Payment Mode
            if (paymentMode) {
                if (paymentMode === 'cash') filtered = filtered.filter(item => item.allowCash);
                else if (paymentMode === 'barter') filtered = filtered.filter(item => item.allowBarter);
                else if (paymentMode === 'cash_plus_barter') filtered = filtered.filter(item => item.allowCashPlusBarter);
            }

            // Filter by Price
            if (minPrice) {
                filtered = filtered.filter(item => (item.priceCents || 0) >= parseInt(minPrice) * 100);
            }
            if (maxPrice) {
                filtered = filtered.filter(item => (item.priceCents || 0) <= parseInt(maxPrice) * 100);
            }

            const start = (page - 1) * limit;
            const end = start + limit;
            return {
                data: filtered.slice(start, end),
                total: filtered.length,
                hasMore: end < filtered.length
            };
        }
    })
);
