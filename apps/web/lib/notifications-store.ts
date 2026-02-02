import { create } from 'zustand';
import { notificationsApi, Notification } from './notifications-api';

interface NotificationsState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;

    fetchNotifications: () => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
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
            set({ unreadCount: response.data });
        } catch (error: any) {
            // Silently ignore 401 (unauthenticated) or 0 (network error) status
            const status = error?.response?.status;
            if (status !== 401 && error?.message !== 'Network Error') {
                console.warn('Notification count sync paused:', error.message);
            }
            // Reset count to prevent false indicators
            set({ unreadCount: 0 });
        }
    },

    markAsRead: async (id: string) => {
        try {
            await notificationsApi.markAsRead(id);
            set((state) => {
                const notification = state.notifications.find((n) => n.id === id);
                if (notification && !notification.readAt) {
                    return {
                        notifications: state.notifications.map((n) =>
                            n.id === id ? { ...n, readAt: new Date().toISOString() } : n
                        ),
                        unreadCount: Math.max(0, state.unreadCount - 1),
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
                unreadCount: 0,
            }));
        } catch (error) {
            console.error('Failed to mark all notifications as read', error);
        }
    },
}));
