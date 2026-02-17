'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';

interface ActivityFeedItem {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    userId?: string;
    userName?: string;
    targetId?: string;
    targetName?: string;
    details?: any;
    ipAddress?: string;
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
    UPDATE_USER_STATUS: '👤',
    UPDATE_LISTING_STATUS: '📝',
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
    UPDATE_USER_STATUS: 'bg-orange-100 text-orange-700',
    UPDATE_LISTING_STATUS: 'bg-yellow-100 text-yellow-700',
};

function ActivityDetailsModal({ activity, onClose }: { activity: ActivityFeedItem; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-3">
                        <span className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${ACTION_COLORS[activity.type]}`}>
                            {ACTION_ICONS[activity.type] || '📌'}
                        </span>
                        <div>
                            <h3 className="font-bold text-gray-900">Activity Details</h3>
                            <p className="text-sm text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Actor</label>
                            <div className="mt-1 font-medium text-gray-900">{activity.userName || 'System'}</div>
                            {activity.userId && <div className="text-xs text-gray-400 font-mono">{activity.userId}</div>}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">IP Address</label>
                            <div className="mt-1 font-mono text-sm text-gray-700">{activity.ipAddress || 'N/A'}</div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Action Type</label>
                            <div className="mt-1">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${ACTION_COLORS[activity.type] || 'bg-gray-100'}`}>
                                    {activity.type}
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Target</label>
                            <div className="mt-1 font-medium text-gray-900">{activity.targetName || 'N/A'}</div>
                            {activity.targetId && <div className="text-xs text-gray-400 font-mono">{activity.targetId}</div>}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-700 border border-gray-100">
                            {activity.description}
                        </div>
                    </div>

                    {activity.details && Object.keys(activity.details).length > 0 && (
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Available Meta Data</label>
                            <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                                <pre className="text-xs text-blue-300 font-mono">
                                    {JSON.stringify(activity.details, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminActivityPage() {
    const { user, _hasHydrated } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [feed, setFeed] = useState<ActivityFeedItem[]>([]);
    const [limit, setLimit] = useState(50);
    const [hasMore, setHasMore] = useState(true);
    const [selectedActivity, setSelectedActivity] = useState<ActivityFeedItem | null>(null);

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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Activity History</h1>
                    <p className="text-gray-500 text-sm mt-1">Security audit log and platform events</p>
                </div>
                <button
                    onClick={() => router.push('/admin/dashboard')}
                    className="text-sm text-blue-600 hover:underline"
                >
                    ← Back to Dashboard
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                                <th className="px-6 py-4">Date & Time</th>
                                <th className="px-6 py-4">Actor</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Target</th>
                                <th className="px-6 py-4 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {feed.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition group">
                                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900">
                                                {new Date(item.timestamp).toLocaleDateString()}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(item.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                                                {(item.userName || 'S').charAt(0)}
                                            </div>
                                            <span className="font-medium text-gray-900">{item.userName || 'System'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{ACTION_ICONS[item.type] || '📌'}</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${ACTION_COLORS[item.type] || 'bg-gray-100 text-gray-700'}`}>
                                                {item.type.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={item.description}>
                                            {item.description}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {item.targetName || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setSelectedActivity(item)}
                                            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                                        >
                                            View Log
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {feed.length === 0 && !loading && (
                    <div className="p-12 text-center text-gray-400">
                        <div className="text-4xl mb-4">📋</div>
                        <p>No activity logs found.</p>
                    </div>
                )}

                {loading && (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-gray-400 mt-2">Loading activity logs...</p>
                    </div>
                )}

                {/* Load More */}
                {hasMore && feed.length > 0 && !loading && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-center">
                        <button
                            onClick={loadMore}
                            className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 shadow-sm transition"
                        >
                            Load Older Logs
                        </button>
                    </div>
                )}
            </div>

            {selectedActivity && (
                <ActivityDetailsModal
                    activity={selectedActivity}
                    onClose={() => setSelectedActivity(null)}
                />
            )}
        </div>
    );
}
