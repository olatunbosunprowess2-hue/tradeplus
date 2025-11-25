import { create } from 'zustand';
import { BarterOffer } from './types';
import { offersApi, CreateOfferDto, CounterOfferDto } from './offers-api';

interface OffersState {
    offers: BarterOffer[];
    isLoading: boolean;
    error: string | null;

    fetchOffers: (role?: 'buyer' | 'seller') => Promise<void>;
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
    isLoading: false,
    error: null,

    fetchOffers: async (role) => {
        set({ isLoading: true, error: null });
        try {
            const offers = await offersApi.getAll({ role });
            set({ offers, isLoading: false });
        } catch (error: any) {
            set({ isLoading: false, error: error.message || 'Failed to fetch offers' });
        }
    },

    acceptOffer: async (id) => {
        try {
            const updatedOffer = await offersApi.accept(id);
            set((state) => ({
                offers: state.offers.map((o) => (o.id === id ? updatedOffer : o)),
            }));
        } catch (error: any) {
            console.error('Failed to accept offer:', error);
            throw error;
        }
    },

    rejectOffer: async (id) => {
        try {
            const updatedOffer = await offersApi.reject(id);
            set((state) => ({
                offers: state.offers.map((o) => (o.id === id ? updatedOffer : o)),
            }));
        } catch (error: any) {
            console.error('Failed to reject offer:', error);
            throw error;
        }
    },

    counterOffer: async (id, data) => {
        try {
            const updatedOffer = await offersApi.counter(id, data);
            set((state) => ({
                offers: state.offers.map((o) => (o.id === id ? updatedOffer : o)),
            }));
        } catch (error: any) {
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

