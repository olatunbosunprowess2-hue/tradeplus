import { create } from 'zustand';
import { notificationsApi, Notification } from './notifications-api';

interface NotificationsState {
    notifications: Notification[];
    unreadCounts: {
        total: number;
        messages: number;
        offers: number;
        system: number;
    };
    isLoading: boolean;
    error: string | null;

    fetchNotifications: () => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
    notifications: [],
    unreadCounts: {
        total: 0,
        messages: 0,
        offers: 0,
        system: 0,
    },
    isLoading: false,
    error: null,

    fetchNotifications: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await notificationsApi.getAll();
            set({ notifications: response.data, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to fetch notifications', isLoading: false });
        }
    },

    fetchUnreadCount: async () => {
        try {
            const response = await notificationsApi.getUnreadCount();
            // Handle both old (number) and new (object) API responses for smooth deployment
            const data = response.data;
            if (typeof data === 'number') {
                set({
                    unreadCounts: {
                        total: data,
                        messages: 0,
                        offers: 0,
                        system: data, // Default to system if unknown
                    }
                });
            } else {
                set({ unreadCounts: data });
            }
        } catch (error: any) {
            // Silently ignore 401 (unauthenticated) or 0 (network error) status
            const status = error?.response?.status;
            if (status !== 401 && error?.message !== 'Network Error') {
                console.warn('Notification count sync paused:', error.message);
            }
            // Reset count
            set({
                unreadCounts: {
                    total: 0,
                    messages: 0,
                    offers: 0,
                    system: 0,
                }
            });
        }
    },

    markAsRead: async (id: string) => {
        try {
            await notificationsApi.markAsRead(id);
            set((state) => {
                const notification = state.notifications.find((n) => n.id === id);
                if (notification && !notification.readAt) {
                    const type = notification.type;
                    const isOffer = ['NEW_OFFER', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'OFFER_COUNTERED', 'offer'].includes(type);
                    // Messages in notification table are just notifications ABOUT messages, not the messages themselves.
                    // But our count logic sums message count from DB + offer count + system count.
                    // If we read a "NEW_MESSAGE" notification, does it mark the message as read? No.
                    // But does it decrement the notification count?
                    // The backend `getUnreadCount` method EXCLUDES "message" type notifications from the "system" count.
                    // And it ADDS the real message count.
                    // So reading a "NEW_MESSAGE" notification has NO EFFECT on the counts returned by backend (because they are ignored).
                    // So we only care about Offer and System types.

                    const newCounts = { ...state.unreadCounts };

                    if (isOffer) {
                        newCounts.offers = Math.max(0, newCounts.offers - 1);
                        newCounts.total = Math.max(0, newCounts.total - 1);
                    } else if (type !== 'message' && type !== 'NEW_MESSAGE') {
                        newCounts.system = Math.max(0, newCounts.system - 1);
                        newCounts.total = Math.max(0, newCounts.total - 1);
                    }

                    return {
                        notifications: state.notifications.map((n) =>
                            n.id === id ? { ...n, readAt: new Date().toISOString() } : n
                        ),
                        unreadCounts: newCounts,
                    };
                }
                return state;
            });
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    },

    markAllAsRead: async () => {
        try {
            await notificationsApi.markAllAsRead();
            set((state) => ({
                notifications: state.notifications.map((n) => ({
                    ...n,
                    readAt: new Date().toISOString(),
                })),
                unreadCounts: {
                    ...state.unreadCounts,
                    total: state.unreadCounts.messages, // Only real messages remain unread
                    offers: 0,
                    system: 0
                },
            }));
        } catch (error) {
            console.error('Failed to mark all notifications as read', error);
        }
    },
}));
