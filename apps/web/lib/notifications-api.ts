import apiClient from './api-client';

export interface Notification {
    id: string;
    userId: string;
    type: string;
    data: any;
    readAt: string | null;
    createdAt: string;
}

export const notificationsApi = {
    getAll: async () => {
        return apiClient.get<Notification[]>('/notifications');
    },

    getUnreadCount: async () => {
        return apiClient.get<number>('/notifications/unread-count');
    },

    markAsRead: async (id: string) => {
        return apiClient.patch(`/notifications/${id}/read`);
    },

    markAllAsRead: async () => {
        return apiClient.patch('/notifications/read-all');
    },
};
