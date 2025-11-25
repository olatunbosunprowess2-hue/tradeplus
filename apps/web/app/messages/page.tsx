'use client';

import { useMessagesStore } from '@/lib/messages-store';
import Link from 'next/link';
import { useEffect } from 'react';
import Image from 'next/image';

export default function MessagesPage() {
    const { conversations, fetchConversations, isLoading } = useMessagesStore();

    useEffect(() => {
        fetchConversations();
    }, []);

    const getTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days}d ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

    if (isLoading && conversations.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="container mx-auto px-4 py-6 max-w-4xl">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Messages</h1>
                    <p className="text-gray-600 font-medium">
                        {totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                </div>

                {/* Conversations List */}
                {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-4xl">💬</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No messages yet</h3>
                        <p className="text-gray-600 max-w-md mb-6">
                            Start a conversation by making an offer or messaging a seller!
                        </p>
                        <Link
                            href="/listings"
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                            Browse Listings
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {conversations.map((conversation) => (
                            <Link
                                key={conversation.id}
                                href={`/messages/${conversation.participantId}`}
                                className="block bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-blue-200 transition-all"
                            >
                                <div className="flex gap-3">
                                    {/* Avatar */}
                                    <div className="relative">
                                        {conversation.participantAvatar ? (
                                            <Image
                                                src={conversation.participantAvatar}
                                                alt={conversation.participantName}
                                                width={56}
                                                height={56}
                                                className="rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                                {conversation.participantName.charAt(0)}
                                            </div>
                                        )}
                                        {conversation.unreadCount > 0 && (
                                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                                {conversation.unreadCount}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`font-bold text-gray-900 truncate ${conversation.unreadCount > 0 ? 'text-blue-600' : ''
                                                }`}>
                                                {conversation.participantName}
                                            </h3>
                                            {conversation.lastMessage && (
                                                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                                    {getTimeAgo(conversation.lastMessage.timestamp)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Listing Context */}
                                        {conversation.listingContext && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <Image
                                                    src={conversation.listingContext.image}
                                                    alt={conversation.listingContext.title}
                                                    width={32}
                                                    height={32}
                                                    className="rounded object-cover"
                                                />
                                                <span className="text-xs text-gray-600 truncate">
                                                    {conversation.listingContext.title}
                                                </span>
                                            </div>
                                        )}

                                        {/* Last Message */}
                                        {conversation.lastMessage ? (
                                            <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'
                                                }`}>
                                                {conversation.lastMessage.senderId === 'user-1' && 'You: '}
                                                {conversation.lastMessage.content}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No messages yet</p>
                                        )}
                                    </div>

                                    {/* Arrow */}
                                    <svg
                                        className="w-5 h-5 text-gray-400 flex-shrink-0 mt-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
