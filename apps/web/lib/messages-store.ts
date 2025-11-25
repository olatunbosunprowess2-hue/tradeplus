import { create } from 'zustand';
import { messagesApi } from './messages-api';

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: number;
    read: boolean;
    type: 'text' | 'image' | 'listing';
    listingId?: string;
    listingTitle?: string;
    listingImage?: string;
}

export interface Conversation {
    id: string;
    participantId: string;
    participantName: string;
    participantAvatar?: string;
    lastMessage?: {
        id: string;
        content: string;
        timestamp: number;
        senderId: string;
        read: boolean;
    };
    unreadCount: number;
    listingContext?: {
        id: string;
        title: string;
        image: string;
    };
}

interface MessagesState {
    conversations: Conversation[];
    messages: Message[];
    isLoading: boolean;
    error: string | null;
    fetchConversations: () => Promise<void>;
    fetchMessages: (conversationId: string) => Promise<void>;
    sendMessage: (receiverId: string, content: string, listingId?: string) => Promise<void>;
    markAsRead: (conversationId: string) => Promise<void>;
    createConversation: (participantId: string, participantName: string, participantAvatar?: string, listingContext?: { id: string; title: string; image: string }) => void;
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
    conversations: [],
    messages: [],
    isLoading: false,
    error: null,

    fetchConversations: async () => {
        set({ isLoading: true, error: null });
        try {
            const conversations = await messagesApi.getConversations();
            set({ conversations, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to fetch conversations', isLoading: false });
        }
    },

    fetchMessages: async (conversationId) => {
        set({ isLoading: true, error: null });
        try {
            const messages = await messagesApi.getMessages(conversationId);
            set({ messages, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to fetch messages', isLoading: false });
        }
    },

    sendMessage: async (receiverId, content, listingId) => {
        try {
            const newMessage = await messagesApi.sendMessage({ receiverId, content, listingId });

            // Optimistic update or re-fetch
            // For simplicity, we'll append to messages if we are in that conversation
            set((state) => ({
                messages: [...state.messages, newMessage],
            }));

            // Refresh conversations to update last message
            get().fetchConversations();
        } catch (error) {
            set({ error: 'Failed to send message' });
            throw error;
        }
    },

    createConversation: (participantId: string, participantName: string, participantAvatar?: string, listingContext?: { id: string; title: string; image: string }) => {
        set((state) => {
            const exists = state.conversations.some(c => c.participantId === participantId);
            if (exists) return state;

            const newConv: Conversation = {
                id: `temp-${Date.now()}`,
                participantId,
                participantName,
                participantAvatar,
                unreadCount: 0,
                listingContext
            };
            return { conversations: [newConv, ...state.conversations] };
        });
    },

    markAsRead: async (conversationId) => {
        try {
            // Skip API call for temp conversations
            if (conversationId.startsWith('temp-')) return;

            await messagesApi.markAsRead(conversationId);
            set((state) => ({
                conversations: state.conversations.map((conv) =>
                    conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
                ),
            }));
        } catch (error) {
            set({ error: 'Failed to mark as read' });
        }
    },
}));

