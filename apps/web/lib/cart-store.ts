import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string; // Listing ID
    title: string;
    price: number;
    currency: string;
    image: string;
    sellerId: string;
    sellerName: string;
    sellerAvatar?: string;
    quantity: number;
    maxQuantity: number;
}

interface CartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'quantity'>) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    clearSellerItems: (sellerId: string) => void;
    getTotal: () => number;
    getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (newItem) => {
                set((state) => {
                    const existingItem = state.items.find((item) => item.id === newItem.id);

                    if (existingItem) {
                        // If item exists, increment quantity if within limits
                        if (existingItem.quantity < existingItem.maxQuantity) {
                            return {
                                items: state.items.map((item) =>
                                    item.id === newItem.id
                                        ? { ...item, quantity: item.quantity + 1 }
                                        : item
                                ),
                            };
                        }
                        return state; // Max quantity reached
                    }

                    // Add new item
                    return {
                        items: [...state.items, { ...newItem, quantity: 1 }],
                    };
                });
            },

            removeItem: (id) => {
                set((state) => ({
                    items: state.items.filter((item) => item.id !== id),
                }));
            },

            updateQuantity: (id, quantity) => {
                set((state) => ({
                    items: state.items.map((item) => {
                        if (item.id === id) {
                            // Ensure quantity is within bounds [1, maxQuantity]
                            const newQuantity = Math.max(1, Math.min(quantity, item.maxQuantity));
                            return { ...item, quantity: newQuantity };
                        }
                        return item;
                    }),
                }));
            },

            clearCart: () => set({ items: [] }),

            clearSellerItems: (sellerId) => {
                set((state) => ({
                    items: state.items.filter((item) => item.sellerId !== sellerId),
                }));
            },

            getTotal: () => {
                return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
            },

            getItemCount: () => {
                return get().items.reduce((count, item) => count + item.quantity, 0);
            },
        }),
        {
            name: 'barterwave-cart-storage', // unique name for local storage
        }
    )
);
