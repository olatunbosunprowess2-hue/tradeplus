import { apiClient } from './api-client';
import { Conversation, Message } from './messages-store';

export const messagesApi = {
    getConversations: async () => {
        const response = await apiClient.get<Conversation[]>('/messages/conversations');
        return response.data;
    },

    getMessages: async (conversationId: string) => {
        const response = await apiClient.get<Message[]>(`/messages/${conversationId}`);
        return response.data;
    },

    sendMessage: async (data: { receiverId: string; content: string; listingId?: string }) => {
        const response = await apiClient.post<Message>('/messages', data);
        return response.data;
    },

    markAsRead: async (conversationId: string) => {
        await apiClient.patch(`/messages/${conversationId}/read`);
    },
};
