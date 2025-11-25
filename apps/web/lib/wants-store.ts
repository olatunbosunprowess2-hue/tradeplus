import { create } from 'zustand';
import { wantsApi } from './wants-api';

export type TradeMethod = 'cash' | 'barter' | 'both';
export type Condition = 'new' | 'used' | 'any';

export interface WantItem {
    id: string;
    title: string;
    category: string;
    tradeMethod: TradeMethod;
    condition: Condition;
    country: string;
    state: string;
    notes?: string;
    isFulfilled: boolean;
    createdAt: string; // Changed to string for ISO date from API
}

interface WantsState {
    items: WantItem[];
    isLoading: boolean;
    error: string | null;
    fetchWants: () => Promise<void>;
    addItem: (item: Omit<WantItem, 'id' | 'createdAt' | 'isFulfilled'>) => Promise<void>;
    removeItem: (id: string) => Promise<void>;
    toggleFulfilled: (id: string) => Promise<void>;
    updateItem: (id: string, updates: Partial<WantItem>) => Promise<void>;
}

export const useWantsStore = create<WantsState>((set, get) => ({
    items: [],
    isLoading: false,
    error: null,

    fetchWants: async () => {
        set({ isLoading: true, error: null });
        try {
            const items = await wantsApi.getAll();
            set({ items, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to fetch wants', isLoading: false });
        }
    },

    addItem: async (itemData) => {
        set({ isLoading: true, error: null });
        try {
            const newItem = await wantsApi.create(itemData);
            set((state) => ({
                items: [newItem, ...state.items],
                isLoading: false,
            }));
        } catch (error) {
            set({ error: 'Failed to add want', isLoading: false });
            throw error;
        }
    },

    removeItem: async (id) => {
        try {
            await wantsApi.delete(id);
            set((state) => ({
                items: state.items.filter((item) => item.id !== id),
            }));
        } catch (error) {
            set({ error: 'Failed to remove want' });
        }
    },

    toggleFulfilled: async (id) => {
        const item = get().items.find((i) => i.id === id);
        if (!item) return;

        try {
            const updatedItem = await wantsApi.update(id, { isFulfilled: !item.isFulfilled });
            set((state) => ({
                items: state.items.map((i) => (i.id === id ? updatedItem : i)),
            }));
        } catch (error) {
            set({ error: 'Failed to update want status' });
        }
    },

    updateItem: async (id, updates) => {
        try {
            const updatedItem = await wantsApi.update(id, updates);
            set((state) => ({
                items: state.items.map((i) => (i.id === id ? updatedItem : i)),
            }));
        } catch (error) {
            set({ error: 'Failed to update want' });
        }
    },
}));

