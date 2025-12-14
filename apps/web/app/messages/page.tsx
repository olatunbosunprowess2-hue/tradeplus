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
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white">
                <div className="container mx-auto px-4 max-w-4xl py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Messages</h1>
                                <p className="text-emerald-100">
                                    {totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}` : 'All caught up! 🎉'}
                                </p>
                            </div>
                        </div>
                        {totalUnread > 0 && (
                            <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2 text-center">
                                <div className="text-2xl font-bold">{totalUnread}</div>
                                <div className="text-xs uppercase tracking-wide text-emerald-100">Unread</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-4xl">

                {/* Conversations List */}
                {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center mb-4 border-2 border-blue-100">
                            <span className="text-4xl">💬</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No messages yet</h3>
                        <p className="text-gray-600 max-w-md mb-6">
                            Start a conversation by making an offer or messaging a seller!
                        </p>
                        <Link
                            href="/listings"
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                        >
                            Browse Listings
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {conversations.map((conversation) => (
                            <Link
                                key={conversation.id}
                                href={`/messages/${conversation.participantId}`}
                                className="block bg-white rounded-2xl shadow-sm border border-gray-200 p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-200 hover:-translate-y-0.5"
                            >
                                <div className="flex gap-4">
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        {conversation.participantAvatar ? (
                                            <Image
                                                src={conversation.participantAvatar}
                                                alt={conversation.participantName}
                                                width={56}
                                                height={56}
                                                className="rounded-full object-cover ring-2 ring-white shadow-md"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-white">
                                                {conversation.participantName.charAt(0)}
                                            </div>
                                        )}
                                        {conversation.unreadCount > 0 && (
                                            <div className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg ring-2 ring-white">
                                                {conversation.unreadCount}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className={`font-bold text-lg truncate ${conversation.unreadCount > 0 ? 'text-blue-600' : 'text-gray-900'
                                                }`}>
                                                {conversation.participantName}
                                            </h3>
                                            {conversation.lastMessage && (
                                                <span className="text-xs text-gray-500 ml-2 flex-shrink-0 font-medium">
                                                    {getTimeAgo(conversation.lastMessage.timestamp)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Listing Context */}
                                        {conversation.listingContext && (
                                            <div className="flex items-center gap-2 mb-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                                                <div className="relative flex-shrink-0">
                                                    <Image
                                                        src={conversation.listingContext.image}
                                                        alt={conversation.listingContext.title}
                                                        width={40}
                                                        height={40}
                                                        className="rounded-lg object-cover shadow-sm ring-1 ring-blue-200"
                                                    />
                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-sm">
                                                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Trade</span>
                                                        <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-xs text-gray-700 font-medium truncate block">
                                                        {conversation.listingContext.title}
                                                    </span>
                                                </div>
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
