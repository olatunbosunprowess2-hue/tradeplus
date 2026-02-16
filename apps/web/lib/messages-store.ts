import { create } from 'zustand';
import { messagesApi } from './messages-api';
import { useAuthStore } from './auth-store';

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: number;
    read: boolean;
    type: 'text' | 'image' | 'listing' | 'system';
    listingId?: string;
    listingTitle?: string;
    listingImage?: string;
    mediaUrl?: string; // New field
    mediaType?: 'image' | 'video' | 'file'; // New field
}

export interface Conversation {
    id: string;
    participantId: string;
    participantName: string;
    participantAvatar?: string;
    participantLastActiveAt?: string;
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
    barterOffer?: {
        id: string;
        status: string;
    };
}

interface MessagesState {
    conversations: Conversation[];
    messages: Message[];
    isLoading: boolean;
    error: string | null;
    fetchConversations: () => Promise<void>;
    fetchMessages: (conversationId: string) => Promise<void>;
    sendMessage: (receiverId: string, content: string, listingId?: string, file?: File) => Promise<void>;
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

    sendMessage: async (receiverId, content, listingId, file) => {
        const { user } = useAuthStore.getState();
        if (!user) return;

        // Create optimistic message
        const optimisticId = `opt-${Date.now()}`;
        const optimisticMessage: Message = {
            id: optimisticId,
            conversationId: get().messages[0]?.conversationId || 'temp',
            senderId: user.id,
            receiverId,
            content,
            timestamp: Date.now(),
            read: false,
            type: file ? 'image' : 'text', // Simple heuristic for optimistic UI
            mediaUrl: file ? URL.createObjectURL(file) : undefined,
            mediaType: file ? (file.type.startsWith('video/') ? 'video' : 'image') : undefined,
        };

        // Add optimistic message to state
        set((state) => ({
            messages: [...state.messages, optimisticMessage],
        }));

        try {
            const newMessage = await messagesApi.sendMessage({ receiverId, content, listingId, file });

            // Replace optimistic message with actual data from server
            set((state) => ({
                messages: state.messages.map((m) => (m.id === optimisticId ? newMessage : m)),
            }));

            // Refresh conversations to update last message
            get().fetchConversations();
        } catch (error) {
            // Remove optimistic message on failure
            set((state) => ({
                messages: state.messages.filter((m) => m.id !== optimisticId),
                error: 'Failed to send message',
            }));
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

