import { apiClient } from './api-client';
import { Conversation, Message } from './messages-store';

export const messagesApi = {
    getConversations: async () => {
        const response = await apiClient.get<Conversation[]>('/messages/conversations');
        return response.data;
    },

    getConversationByParticipant: async (participantId: string) => {
        const response = await apiClient.get<Conversation | null>(`/messages/conversation/with/${participantId}`);
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

    startConversation: async (data: { participantId: string; listingId?: string; initialMessage?: string }) => {
        const response = await apiClient.post<{ id: string }>('/messages/start', data);
        return response.data;
    },

    markAsRead: async (conversationId: string) => {
        await apiClient.patch(`/messages/${conversationId}/read`);
    },
};
