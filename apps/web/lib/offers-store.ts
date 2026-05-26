import { create } from 'zustand';
import { BarterOffer } from './types';
import { offersApi, CreateOfferDto, CounterOfferDto } from './offers-api';

interface OffersState {
    offers: BarterOffer[];
    localStatusOverrides: Record<string, BarterOffer['status']>; // Maps offerId -> status to prevent polling race conditions
    isLoading: boolean;
    error: string | null;

    fetchOffers: (role?: 'buyer' | 'seller', silent?: boolean) => Promise<void>;
    acceptOffer: (id: string) => Promise<void>;
    rejectOffer: (id: string) => Promise<void>;
    counterOffer: (id: string, data: CounterOfferDto) => Promise<void>;
    makeOffer: (data: CreateOfferDto) => Promise<void>;

    // Selectors
    getReceivedOffers: (userId: string) => BarterOffer[];
    getSentOffers: (userId: string) => BarterOffer[];
    getHistoryOffers: (userId: string) => BarterOffer[];
}

export const useOffersStore = create<OffersState>((set, get) => ({
    offers: [],
    localStatusOverrides: {},
    isLoading: false,
    error: null,

    fetchOffers: async (role, silent = false) => {
        if (!silent) set({ isLoading: true, error: null });
        try {
            const offers = await offersApi.getAll({ role });
            const { localStatusOverrides } = get();

            // Apply any active local status overrides to the fetched offers
            const overriddenOffers = offers.map((o) => {
                const overrideStatus = localStatusOverrides[o.id];
                if (overrideStatus) {
                    // If the server has caught up and now matches our local override status,
                    // we can safely clear the override.
                    if (o.status === overrideStatus) {
                        set((state) => {
                            const newOverrides = { ...state.localStatusOverrides };
                            delete newOverrides[o.id];
                            return { localStatusOverrides: newOverrides };
                        });
                    } else {
                        // Otherwise, override the server's status with our local optimistic status
                        return { ...o, status: overrideStatus as BarterOffer['status'] };
                    }
                }
                return o;
            });

            set({ offers: overriddenOffers, isLoading: false, error: null });
        } catch (error: any) {
            if (!silent) set({ isLoading: false, error: error.message || 'Failed to fetch offers' });
            else set({ error: error.message || 'Failed to fetch offers' });
        }
    },

    acceptOffer: async (id) => {
        // Optimistic update
        set((state) => ({
            localStatusOverrides: { ...state.localStatusOverrides, [id]: 'accepted' as BarterOffer['status'] },
            offers: state.offers.map((o) => (o.id === id ? { ...o, status: 'accepted' as BarterOffer['status'] } : o)),
        }));

        try {
            const updatedOffer = await offersApi.accept(id);
            set((state) => {
                const newOverrides = { ...state.localStatusOverrides };
                // If backend returned the same status, clear the override
                if (updatedOffer.status === 'accepted') {
                    delete newOverrides[id];
                } else {
                    newOverrides[id] = updatedOffer.status;
                }
                return {
                    localStatusOverrides: newOverrides,
                    offers: state.offers.map((o) => (o.id === id ? updatedOffer : o)),
                };
            });
        } catch (error: any) {
            // Rollback optimistic update
            set((state) => {
                const newOverrides = { ...state.localStatusOverrides };
                delete newOverrides[id];
                return {
                    localStatusOverrides: newOverrides,
                    offers: state.offers.map((o) => (o.id === id ? { ...o, status: 'pending' as BarterOffer['status'] } : o)),
                };
            });
            console.error('Failed to accept offer:', error);
            throw error;
        }
    },

    rejectOffer: async (id) => {
        // Optimistic update
        set((state) => ({
            localStatusOverrides: { ...state.localStatusOverrides, [id]: 'rejected' as BarterOffer['status'] },
            offers: state.offers.map((o) => (o.id === id ? { ...o, status: 'rejected' as BarterOffer['status'] } : o)),
        }));

        try {
            const updatedOffer = await offersApi.reject(id);
            set((state) => {
                const newOverrides = { ...state.localStatusOverrides };
                if (updatedOffer.status === 'rejected') {
                    delete newOverrides[id];
                } else {
                    newOverrides[id] = updatedOffer.status;
                }
                return {
                    localStatusOverrides: newOverrides,
                    offers: state.offers.map((o) => (o.id === id ? updatedOffer : o)),
                };
            });
        } catch (error: any) {
            // Rollback optimistic update
            set((state) => {
                const newOverrides = { ...state.localStatusOverrides };
                delete newOverrides[id];
                return {
                    localStatusOverrides: newOverrides,
                    offers: state.offers.map((o) => (o.id === id ? { ...o, status: 'pending' as BarterOffer['status'] } : o)),
                };
            });
            console.error('Failed to reject offer:', error);
            throw error;
        }
    },

    counterOffer: async (id, data) => {
        // Optimistic update of the original offer to countered
        set((state) => ({
            localStatusOverrides: { ...state.localStatusOverrides, [id]: 'countered' as BarterOffer['status'] },
            offers: state.offers.map((o) => (o.id === id ? { ...o, status: 'countered' as BarterOffer['status'] } : o)),
        }));

        try {
            const updatedOffer = await offersApi.counter(id, data);
            set((state) => {
                const newOverrides = { ...state.localStatusOverrides };
                delete newOverrides[id];
                return {
                    localStatusOverrides: newOverrides,
                    offers: [updatedOffer, ...state.offers.map((o) => (o.id === id ? { ...o, status: 'countered' as BarterOffer['status'] } : o))],
                };
            });
        } catch (error: any) {
            // Rollback optimistic update
            set((state) => {
                const newOverrides = { ...state.localStatusOverrides };
                delete newOverrides[id];
                return {
                    localStatusOverrides: newOverrides,
                    offers: state.offers.map((o) => (o.id === id ? { ...o, status: 'pending' as BarterOffer['status'] } : o)),
                };
            });
            console.error('Failed to counter offer:', error);
            throw error;
        }
    },

    makeOffer: async (data) => {
        try {
            const newOffer = await offersApi.create(data);
            set((state) => ({
                offers: [newOffer, ...state.offers],
            }));
        } catch (error: any) {
            console.error('Failed to make offer:', error);
            throw error;
        }
    },

    getReceivedOffers: (userId) => {
        const { offers } = get();
        return offers.filter(
            (offer) => offer.sellerId === userId && offer.status === 'pending'
        );
    },

    getSentOffers: (userId) => {
        const { offers } = get();
        return offers.filter(
            (offer) => offer.buyerId === userId && offer.status === 'pending'
        );
    },

    getHistoryOffers: (userId) => {
        const { offers } = get();
        return offers.filter(
            (offer) => ['accepted', 'rejected', 'cancelled'].includes(offer.status)
        );
    },
}));

