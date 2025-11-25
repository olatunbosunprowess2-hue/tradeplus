'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMessagesStore } from '@/lib/messages-store';
import Link from 'next/link';
import Image from 'next/image';

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const participantId = params.userId as string;

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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Find conversation with this participant
    const conversation = conversations.find(c => c.participantId === participantId);
    const conversationId = conversation?.id;

    useEffect(() => {
        // Ensure we have conversations loaded to find the correct one
        if (conversations.length === 0) {
            fetchConversations();
        }
    }, [conversations.length]);

    useEffect(() => {
        if (conversationId) {
            fetchMessages(conversationId);
            markAsRead(conversationId);
        }
    }, [conversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages.length]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim()) return;

        try {
            await sendMessage(participantId, messageText.trim());
            setMessageText('');
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    // If loading initial data
    if (isLoading && !conversation && conversations.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // If we have conversations but can't find this one, it might be a new conversation
    // In a real app, we might fetch user details here to show the header before the first message is sent.
    // For now, we'll show a basic "New Conversation" state or redirect if invalid user.
    // But since we don't have a "getUser" API handy here, we rely on the conversation existing or being created via listing contact.
    // If it's a direct message to a user we haven't talked to, we'd need to fetch their profile.
    // Let's assume for now we only support chatting if a conversation exists or we have context.
    // If !conversation, we can still show the UI but with empty header info if we don't have it.
    // However, the UI relies heavily on `conversation` object.

    if (!conversation && !isLoading && conversations.length > 0) {
        // Fallback: If we came here from a "Contact Seller" button, we might have passed data in query params or state,
        // but simpler to just handle "Conversation not found" or "Start new" if we had user details.
        // For this fix, let's just show not found to be safe, or we could try to fetch the user profile if we had that endpoint ready.
        // Since we don't have a public "getUserProfile" easily accessible without auth, let's stick to "Conversation not found" for now,
        // unless we want to implement a "create conversation" flow here.

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Conversation not started</h2>
                    <p className="text-gray-600 mb-4">Start a conversation from a listing to chat with this user.</p>
                    <Link href="/listings" className="text-primary hover:underline">
                        Browse Listings
                    </Link>
                </div>
            </div>
        );
    }

    // We need conversation to render the UI as it is currently structured
    if (!conversation) return null;

    const getTimeDisplay = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
                <div className="container mx-auto max-w-4xl flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-600 hover:text-gray-900 transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {conversation.participantAvatar ? (
                        <Image
                            src={conversation.participantAvatar}
                            alt={conversation.participantName}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                            {conversation.participantName.charAt(0)}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-gray-900 truncate">{conversation.participantName}</h2>
                        {conversation.listingContext && (
                            <p className="text-xs text-gray-600 truncate">
                                Re: {conversation.listingContext.title}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Listing Context Card */}
            {conversation.listingContext && (
                <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
                    <div className="container mx-auto max-w-4xl">
                        <Link
                            href={`/listings/${conversation.listingContext.id}`}
                            className="flex items-center gap-3 hover:bg-white/50 rounded-lg p-2 -m-2 transition"
                        >
                            <Image
                                src={conversation.listingContext.image}
                                alt={conversation.listingContext.title}
                                width={48}
                                height={48}
                                className="rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-primary-dark mb-0.5">Discussing this listing:</p>
                                <p className="text-sm font-bold text-gray-900 truncate">
                                    {conversation.listingContext.title}
                                </p>
                            </div>
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="container mx-auto max-w-4xl space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((message, index) => {
                            const isOwn = message.senderId === 'user-1';
                            const showTimestamp = index === 0 ||
                                messages[index - 1].timestamp < message.timestamp - 5 * 60 * 1000;

                            return (
                                <div key={message.id}>
                                    {showTimestamp && (
                                        <div className="text-center my-4">
                                            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                                {getTimeDisplay(message.timestamp)}
                                            </span>
                                        </div>
                                    )}
                                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${isOwn
                                                ? 'bg-blue-600 text-white rounded-br-sm'
                                                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                                                }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap break-words">
                                                {message.content}
                                            </p>
                                            <p className={`text-xs mt-1 ${isOwn ? 'text-primary-pale' : 'text-gray-500'}`}>
                                                {new Date(message.timestamp).toLocaleTimeString('en-US', {
                                                    hour: 'numeric',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-200 px-4 py-3 pb-safe">
                <div className="container mx-auto max-w-4xl">
                    <form onSubmit={handleSend} className="flex gap-2">
                        <input
                            type="text"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-full focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 placeholder:text-gray-500 font-medium transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={!messageText.trim()}
                            className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
