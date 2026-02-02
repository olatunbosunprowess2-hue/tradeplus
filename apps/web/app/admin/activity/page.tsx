'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';

interface ActivityFeedItem {
    type: string;
    description: string;
    timestamp: string;
    userId?: string;
    userName?: string;
    targetId?: string;
    targetName?: string;
}

const ACTION_ICONS: Record<string, string> = {
    AD_CREATED: '📦',
    CHAT_STARTED: '💬',
    USER_LOGIN: '🔐',
    REPORT_FILED: '🚩',
    USER_BANNED: '🚫',
    AD_DELETED: '🗑️',
    ROLE_ASSIGNED: '👑',
    ROLE_REMOVED: '👤',
    VERIFICATION_APPROVED: '✅',
    VERIFICATION_REJECTED: '❌',
    ORDER_CREATED: '🛒',
    ESCROW_INITIATED: '🔒',
};

const ACTION_COLORS: Record<string, string> = {
    AD_CREATED: 'bg-green-100 text-green-700',
    CHAT_STARTED: 'bg-blue-100 text-blue-700',
    USER_LOGIN: 'bg-purple-100 text-purple-700',
    REPORT_FILED: 'bg-red-100 text-red-700',
    USER_BANNED: 'bg-red-100 text-red-700',
    AD_DELETED: 'bg-gray-100 text-gray-700',
    ROLE_ASSIGNED: 'bg-amber-100 text-amber-700',
    ROLE_REMOVED: 'bg-gray-100 text-gray-700',
    VERIFICATION_APPROVED: 'bg-green-100 text-green-700',
    VERIFICATION_REJECTED: 'bg-red-100 text-red-700',
    ORDER_CREATED: 'bg-indigo-100 text-indigo-700',
    ESCROW_INITIATED: 'bg-blue-100 text-blue-700',
};

export default function AdminActivityPage() {
    const { user, _hasHydrated } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [feed, setFeed] = useState<ActivityFeedItem[]>([]);
    const [limit, setLimit] = useState(50);
    const [hasMore, setHasMore] = useState(true);

    // Allow admin roles: admin, moderator, super_admin
    const isAdminRole = user?.role === 'admin' || user?.userRole?.name === 'admin' ||
        user?.userRole?.name === 'moderator' || user?.userRole?.name === 'super_admin';

    useEffect(() => {
        if (_hasHydrated && (!user || !isAdminRole)) {
            router.push('/login');
        }
    }, [user, _hasHydrated, router, isAdminRole]);

    useEffect(() => {
        if (isAdminRole) {
            fetchActivity();
        }
    }, [user, limit, isAdminRole]);

    const fetchActivity = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/activity/feed?limit=${limit}`);
            setFeed(response.data);
            setHasMore(response.data.length >= limit);
        } catch (error) {
            console.error('Failed to fetch activity:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        setLimit(prev => prev + 50);
    };

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now.getTime() - then.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
    };

    const handleViewActivity = (item: ActivityFeedItem) => {
        const id = item.targetId || item.userId;
        if (!id) return;

        switch (item.type) {
            case 'AD_CREATED':
                router.push(`/listings/${item.targetId}`);
                break;
            case 'REPORT_FILED':
                router.push('/admin/reports');
                break;
            case 'ROLE_ASSIGNED':
            case 'ROLE_REMOVED':
            case 'USER_BANNED':
            case 'USER_LOGIN':
            default:
                router.push(`/admin/users?search=${item.targetName || item.userName || id}`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Activity History</h1>
                    <p className="text-gray-500 text-sm mt-1">Complete log of platform activities</p>
                </div>
                <button
                    onClick={() => router.push('/admin/dashboard')}
                    className="text-sm text-blue-600 hover:underline"
                >
                    ← Back to Dashboard
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="font-bold text-gray-900">⚡ All Activity</h2>
                    <span className="text-xs text-gray-400">Showing {feed.length} activities</span>
                </div>

                <div className="divide-y divide-gray-100">
                    {feed.map((item, idx) => (
                        <div key={idx} className="p-4 hover:bg-gray-50 transition">
                            <div className="flex items-start gap-4">
                                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${ACTION_COLORS[item.type] || 'bg-gray-100'}`}>
                                    {ACTION_ICONS[item.type] || '📌'}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900">
                                        <span className="font-medium">{item.userName || 'System'}</span>
                                        <span className="text-gray-500"> {item.description}</span>
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-xs text-gray-400">{formatTimeAgo(item.timestamp)}</p>
                                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                            {item.type.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </div>
                                {(item.targetId || item.userId) && (
                                    <button
                                        onClick={() => handleViewActivity(item)}
                                        className="text-sm text-blue-600 hover:underline whitespace-nowrap px-3 py-1 hover:bg-blue-50 rounded"
                                    >
                                        View →
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {feed.length === 0 && !loading && (
                        <div className="p-8 text-center text-gray-400">
                            <div className="text-4xl mb-2">📋</div>
                            <p>No activity recorded yet</p>
                        </div>
                    )}
                    {loading && (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm text-gray-400 mt-2">Loading...</p>
                        </div>
                    )}
                </div>

                {/* Load More */}
                {hasMore && feed.length > 0 && !loading && (
                    <div className="p-4 border-t border-gray-100">
                        <button
                            onClick={loadMore}
                            className="w-full py-3 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition border border-blue-200"
                        >
                            Load More Activities
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
