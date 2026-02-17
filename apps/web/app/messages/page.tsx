'use client';

import { useMessagesStore } from '@/lib/messages-store';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import SideMenu from '@/components/SideMenu';

export default function MessagesPage() {
    const router = useRouter();
    const { conversations, fetchConversations, isLoading } = useMessagesStore();
    const { isAuthenticated, _hasHydrated } = useAuthStore();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (_hasHydrated && !isAuthenticated) {
            router.push('/login');
        }
    }, [_hasHydrated, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchConversations();
        }
    }, [fetchConversations, isAuthenticated]);

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

    // Loading State (Skeleton)
    const LoadingSkeleton = () => (
        <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200" />
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-2">
                                <div className="h-4 bg-gray-200 rounded w-24" />
                                <div className="h-3 bg-gray-200 rounded w-12" />
                            </div>
                            <div className="h-3 bg-gray-200 rounded w-3/4" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    // Initial check only for redirect, don't block render
    if (_hasHydrated && !isAuthenticated) return null; // Logic handled by useEffect


    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
            {/* Mobile Header */}
            <div className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Messages
                </h1>
                <div className="flex items-center gap-2">
                    {totalUnread > 0 && (
                        <div className="bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5">
                            {totalUnread}
                        </div>
                    )}
                    <SideMenu />
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:block container mx-auto px-4 max-w-4xl pt-5 pb-3 border-b border-gray-200">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Messages
                </h1>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-4xl">

                {/* Conversations List */}
                {(!_hasHydrated || (isLoading && conversations.length === 0)) ? (
                    <LoadingSkeleton />
                ) : conversations.length === 0 ? (
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
                                className="block bg-white rounded-xl border border-gray-100 p-3 hover:bg-gray-50 transition-all duration-150"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Initial avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${conversation.unreadCount > 0 ? 'bg-gradient-to-br from-blue-600 to-indigo-600' : 'bg-gray-400'}`}>
                                            {conversation.participantName.charAt(0)}
                                        </div>
                                        {/* Online status dot */}
                                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${conversation.participantLastActiveAt && (Date.now() - new Date(conversation.participantLastActiveAt).getTime() < 2 * 60 * 1000)
                                                ? 'bg-green-500'
                                                : 'bg-gray-300'
                                            }`} />
                                        {conversation.unreadCount > 0 && (
                                            <div className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                                {conversation.unreadCount}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <h3 className={`font-semibold text-sm truncate ${conversation.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {conversation.participantName}
                                            </h3>
                                            {conversation.lastMessage && (
                                                <span className="text-[11px] text-gray-400 ml-2 flex-shrink-0">
                                                    {getTimeAgo(conversation.lastMessage.timestamp)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Listing Context — text only */}
                                        {conversation.listingContext && (
                                            <p className="text-xs text-blue-600 truncate mt-0.5">
                                                Re: {conversation.listingContext.title}
                                            </p>
                                        )}

                                        {/* Last Message */}
                                        {conversation.lastMessage ? (
                                            <p className={`text-xs truncate mt-0.5 ${conversation.unreadCount > 0 ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                                                {conversation.lastMessage.content}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-gray-400 italic mt-0.5">No messages yet</p>
                                        )}
                                    </div>

                                    {/* Arrow */}
                                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
