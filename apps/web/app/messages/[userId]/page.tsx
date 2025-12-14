'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMessagesStore } from '@/lib/messages-store';
import { useAuthStore } from '@/lib/auth-store';
import { messagesApi } from '@/lib/messages-api';
import Link from 'next/link';
import Image from 'next/image';

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const participantId = params.userId as string;
    const { user } = useAuthStore();
    const currentUserId = user?.id;

    const {
        conversations,
        messages,
        fetchConversations,
        fetchMessages,
        sendMessage,
        markAsRead,
        isLoading
    } = useMessagesStore();

    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [conversationData, setConversationData] = useState<any>(null);
    const [isLoadingConversation, setIsLoadingConversation] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Find conversation with this participant
    const conversation = conversations.find(c => c.participantId === participantId) || conversationData;
    const conversationId = conversation?.id;

    // Fetch conversation data directly if not in store
    useEffect(() => {
        const loadConversation = async () => {
            setIsLoadingConversation(true);
            try {
                // First try to find in existing conversations
                if (conversations.length === 0) {
                    await fetchConversations();
                }

                // If still not found, fetch directly
                const existingConv = conversations.find(c => c.participantId === participantId);
                if (!existingConv) {
                    const conv = await messagesApi.getConversationByParticipant(participantId);
                    if (conv) {
                        setConversationData(conv);
                    }
                }
            } catch (error) {
                console.error('Failed to load conversation:', error);
            } finally {
                setIsLoadingConversation(false);
            }
        };

        loadConversation();
    }, [participantId, conversations.length]);

    // Fetch messages when conversation is found
    useEffect(() => {
        if (conversationId && !conversationId.startsWith('temp-')) {
            fetchMessages(conversationId);
            markAsRead(conversationId);
        }
    }, [conversationId]);

    // Polling for new messages every 5 seconds
    useEffect(() => {
        if (!conversationId || conversationId.startsWith('temp-')) return;

        const interval = setInterval(() => {
            fetchMessages(conversationId);
        }, 5000);

        return () => clearInterval(interval);
    }, [conversationId, fetchMessages]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages.length]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || isSending) return;

        setIsSending(true);
        try {
            await sendMessage(participantId, messageText.trim());
            setMessageText('');
            // Refetch messages after sending
            if (conversationId) {
                setTimeout(() => fetchMessages(conversationId), 500);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const getTimeDisplay = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = date.toDateString() === yesterday.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        if (isYesterday) {
            return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    // Loading state
    if ((isLoading || isLoadingConversation) && !conversation && conversations.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading conversation...</p>
                </div>
            </div>
        );
    }

    // No conversation found - show option to start one
    if (!conversation && !isLoading && !isLoadingConversation) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md px-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">💬</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Start a New Conversation</h2>
                    <p className="text-gray-600 mb-6">
                        You haven't chatted with this user yet. Start a conversation from a listing or an accepted offer.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => router.back()}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                        >
                            Go Back
                        </button>
                        <Link
                            href="/listings"
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
                        >
                            Browse Listings
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!conversation) return null;

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm sticky top-0 z-10">
                <div className="container mx-auto max-w-4xl flex items-center gap-3">
                    <button
                        onClick={() => router.push('/messages')}
                        className="text-gray-600 hover:text-gray-900 transition p-1 -ml-1"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {conversation.participantAvatar ? (
                        <Image
                            src={conversation.participantAvatar}
                            alt={conversation.participantName}
                            width={44}
                            height={44}
                            className="rounded-full object-cover ring-2 ring-white shadow-sm"
                        />
                    ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                            {conversation.participantName?.charAt(0) || '?'}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-gray-900 truncate">{conversation.participantName}</h2>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Online
                        </p>
                    </div>

                    {/* Quick Actions */}
                    {conversation.barterOffer?.status === 'accepted' && (
                        <Link
                            href="/offers"
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200 hover:bg-green-100 transition"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Trade Active
                        </Link>
                    )}
                </div>
            </div>

            {/* Listing Context Card */}
            {conversation.listingContext && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 px-4 py-2">
                    <div className="container mx-auto max-w-4xl">
                        <Link
                            href={`/listings/${conversation.listingContext.id}`}
                            className="flex items-center gap-3 hover:bg-white/50 rounded-lg p-2 -m-2 transition"
                        >
                            {conversation.listingContext.image && (
                                <Image
                                    src={conversation.listingContext.image}
                                    alt={conversation.listingContext.title}
                                    width={40}
                                    height={40}
                                    className="rounded-lg object-cover ring-1 ring-blue-200"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-blue-700 mb-0.5">📦 About this listing:</p>
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {conversation.listingContext.title}
                                </p>
                            </div>
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4">
                <div className="container mx-auto max-w-4xl space-y-3">
                    {messages.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">👋</span>
                            </div>
                            <p className="text-gray-600 font-medium">Say hello to start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((message, index) => {
                            const isOwn = message.senderId === currentUserId;
                            const isSystemMessage = message.type === 'system';
                            const showTimestamp = index === 0 ||
                                messages[index - 1].timestamp < message.timestamp - 5 * 60 * 1000;

                            // System message (special styling)
                            if (isSystemMessage) {
                                return (
                                    <div key={message.id} className="flex justify-center my-4">
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full px-4 py-2 max-w-sm">
                                            <p className="text-sm text-green-800 text-center font-medium">
                                                {message.content}
                                            </p>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={message.id}>
                                    {showTimestamp && (
                                        <div className="text-center my-4">
                                            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                                                {getTimeDisplay(message.timestamp)}
                                            </span>
                                        </div>
                                    )}
                                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${isOwn
                                                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md'
                                                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                                                }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                                {message.content}
                                            </p>
                                            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                                                <p className={`text-[10px] ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                                                    {new Date(message.timestamp).toLocaleTimeString('en-US', {
                                                        hour: 'numeric',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                                {isOwn && (
                                                    <svg className={`w-3 h-3 ${message.read ? 'text-blue-200' : 'text-blue-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Quick Replies for New Conversations */}
            {messages.length === 0 && (
                <div className="bg-white border-t border-gray-200 px-4 py-3">
                    <div className="container mx-auto max-w-4xl">
                        <p className="text-xs text-gray-500 mb-2 font-medium">Quick replies:</p>
                        <div className="flex flex-wrap gap-2">
                            {['Hi! Is this still available?', 'What condition is it in?', 'Can we meet up?', 'Thanks for accepting! 🎉'].map((reply) => (
                                <button
                                    key={reply}
                                    onClick={() => setMessageText(reply)}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition"
                                >
                                    {reply}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="bg-white border-t border-gray-200 px-4 py-3 pb-safe">
                <div className="container mx-auto max-w-4xl">
                    <form onSubmit={handleSend} className="flex gap-2 items-end">
                        <div className="flex-1 relative">
                            <textarea
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(e);
                                    }
                                }}
                                placeholder="Type a message..."
                                rows={1}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 font-medium transition-colors resize-none"
                                style={{ minHeight: '48px', maxHeight: '120px' }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!messageText.trim() || isSending}
                            className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center shrink-0"
                        >
                            {isSending ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
