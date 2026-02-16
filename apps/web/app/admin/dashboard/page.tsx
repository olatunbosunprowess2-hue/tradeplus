'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import VerificationReviewModal from '@/components/admin/VerificationReviewModal';
import { canAccessAdminPanel, canManageUsers, canViewSecurity } from '@/lib/rbac';
import type { User } from '@/lib/types';

interface ActivityStats {
    ads: { today: number; last7Days: number; last30Days: number };
    chats: { activeNow: number; startedLastHour: number };
    reports: { today: number };
}

interface TopUser {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    status: string;
    adsPosted: number;
    chatsSent: number;
    totalActivity: number;
}

interface ActivityFeedItem {
    type: string;
    description: string;
    timestamp: string;
    userId?: string;
    userName?: string;
    targetId?: string;
    targetName?: string;
}

interface LoginIp {
    ip: string;
    country: string;
    userId: string;
    userName: string;
    lastSeen: string;
    isSuspicious: boolean;
    userAgent?: string;
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
};

const ACTION_COLORS: Record<string, string> = {
    AD_CREATED: 'bg-green-100 text-green-700',
    CHAT_STARTED: 'bg-blue-100 text-blue-700',
    USER_LOGIN: 'bg-purple-100 text-purple-700',
    REPORT_FILED: 'bg-red-100 text-red-700',
    USER_BANNED: 'bg-red-100 text-red-700',
    AD_DELETED: 'bg-gray-100 text-gray-700',
    ROLE_ASSIGNED: 'bg-amber-100 text-amber-700',
};

export default function AdminDashboardPage() {
    const { user, _hasHydrated } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<ActivityStats | null>(null);
    const [topUsers, setTopUsers] = useState<TopUser[]>([]);
    const [feed, setFeed] = useState<ActivityFeedItem[]>([]);
    const [loginIps, setLoginIps] = useState<LoginIp[]>([]);

    // Pending verifications
    const [pendingUsers, setPendingUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        if (_hasHydrated && (!user || !canAccessAdminPanel(user))) {
            router.push('/login');
        }
    }, [user, _hasHydrated, router]);

    useEffect(() => {
        if (canAccessAdminPanel(user)) {
            fetchData();
            // Refresh every 30 seconds
            const interval = setInterval(fetchData, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchData = async () => {
        try {
            // Core stats for everyone
            const promises: [Promise<any>, Promise<any>, Promise<any>, Promise<any>, Promise<any>] = [
                apiClient.get('/activity/stats'),
                apiClient.get('/activity/top-users?hours=24'),
                apiClient.get('/activity/feed?limit=20'),
                canViewSecurity(user) ? apiClient.get('/activity/login-ips?limit=30') : Promise.resolve({ data: [] }),
                canManageUsers(user) ? apiClient.get('/admin/users?verificationStatus=PENDING&limit=100') : Promise.resolve({ data: { data: [] } }),
            ];

            const [statsRes, topUsersRes, feedRes, ipsRes, pendingRes] = await Promise.all(promises);

            setStats(statsRes.data);
            setTopUsers(topUsersRes.data);
            setFeed(feedRes.data);
            setLoginIps(ipsRes.data);
            setPendingUsers(pendingRes.data.data || []);
        } catch (error: any) {
            console.error('Failed to fetch activity data:', error);
            // Check if it's a permission error
            if (error?.response?.status === 403) {
                console.warn('Access denied to some dashboard components');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBanUser = async (userId: string) => {
        if (!confirm('Are you sure you want to ban this user?')) return;
        try {
            await apiClient.patch(`/admin/users/${userId}/status`, { status: 'suspended' });
            fetchData();
        } catch (error) {
            alert('Failed to ban user');
        }
    };

    const handleViewActivity = (item: ActivityFeedItem) => {
        // Determine the best ID to use for navigation
        const id = item.targetId || item.userId;
        if (!id) return;

        // Navigate based on activity type
        switch (item.type) {
            case 'AD_CREATED':
                // Navigate to the listing
                router.push(`/listings/${item.targetId}`);
                break;
            case 'AD_DELETED':
                // Listing is deleted, show the user who deleted it
                router.push(`/admin/users?search=${item.userName || item.userId || ''}`);
                break;
            case 'CHAT_STARTED':
                // Navigate to messages
                router.push(`/messages?chat=${item.targetId}`);
                break;
            case 'REPORT_FILED':
                // Navigate to reports page
                router.push('/admin/reports');
                break;
            case 'USER_LOGIN':
                // Show the user who logged in
                router.push(`/admin/users?search=${item.userName || item.userId || ''}`);
                break;
            case 'USER_BANNED':
                // Show the user who was banned (targetId is the banned user)
                router.push(`/admin/users?search=${item.targetName || item.targetId || ''}`);
                break;
            case 'ROLE_ASSIGNED':
            case 'ROLE_REMOVED':
                // Show the user who received/lost the role (targetId is that user)
                router.push(`/admin/users?search=${item.targetName || item.targetId || ''}`);
                break;
            default:
                // For any unknown type, try to show the relevant user
                if (item.targetName) {
                    router.push(`/admin/users?search=${item.targetName}`);
                } else if (item.userName) {
                    router.push(`/admin/users?search=${item.userName}`);
                } else if (id) {
                    router.push(`/admin/users?search=${id}`);
                }
        }
    };

    // Get appropriate label for the View button based on activity type
    const getViewLabel = (item: ActivityFeedItem): string => {
        switch (item.type) {
            case 'AD_CREATED':
                return 'View Ad';
            case 'AD_DELETED':
                return 'View User';
            case 'CHAT_STARTED':
                return 'View Chat';
            case 'REPORT_FILED':
                return 'View Reports';
            case 'USER_LOGIN':
            case 'USER_BANNED':
            case 'ROLE_ASSIGNED':
            case 'ROLE_REMOVED':
                return 'View User';
            default:
                return 'View';
        }
    };

    const handleReview = (pendingUser: User) => {
        setSelectedUser(pendingUser);
    };

    const handleCloseModal = () => {
        setSelectedUser(null);
    };

    const handleDecision = async (userId: string, decision: 'APPROVE' | 'REJECT', reason?: string) => {
        try {
            const status = decision === 'APPROVE' ? 'VERIFIED' : 'REJECTED';
            await adminApi.updateUserStatus(userId, {
                verificationStatus: status,
                rejectionReason: reason
            });
            setPendingUsers(prev => prev.filter(u => u.id !== userId));
            setSelectedUser(null);
            fetchData();
        } catch (error) {
            console.error('Failed to update user status:', error);
            addToast('error', 'Failed to update user status');
        }
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Pending Reviews Badge */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage platform activity and user verifications</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Pending Reviews Badge */}
                    {/* Pending Reviews Badge - Hidden for Analysts */}
                    {canManageUsers(user) && (
                        <button
                            onClick={() => document.getElementById('pending-section')?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition"
                        >
                            <span className="text-sm text-gray-500">Pending Reviews:</span>
                            <span className={`ml-2 font-bold text-lg ${pendingUsers.length > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                                {pendingUsers.length}
                            </span>
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-sm text-gray-600">Live</span>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                        <span>📦</span> Ads Posted
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-gray-900">{stats?.ads.today || 0}</span>
                        <span className="text-sm text-gray-500">today</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                        7d: {stats?.ads.last7Days || 0} • 30d: {stats?.ads.last30Days || 0}
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                        <span>💬</span> Active Chats
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-blue-600">{stats?.chats.activeNow || 0}</span>
                        <span className="text-sm text-gray-500">now</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                        +{stats?.chats.startedLastHour || 0} in last hour
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                        <span>🚩</span> Reports
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-red-600">{stats?.reports.today || 0}</span>
                        <span className="text-sm text-gray-500">today</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                        <span>👥</span> Top Users
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-purple-600">{topUsers.length}</span>
                        <span className="text-sm text-gray-500">active</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                        Last 24 hours
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                        <span>🔍</span> Pending
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className={`text-3xl font-bold ${pendingUsers.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            {pendingUsers.length}
                        </span>
                        <span className="text-sm text-gray-500">reviews</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                        ID verifications
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top 10 Active Users */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="font-bold text-gray-900">🏆 Top 10 Active Users (24h)</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {topUsers.slice(0, 10).map((topUser, idx) => (
                            <div key={topUser.userId} className="p-4 flex items-center gap-3 hover:bg-gray-50">
                                <span className="text-lg font-bold text-gray-400 w-6">#{idx + 1}</span>
                                <img
                                    src={topUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(topUser.displayName)}&background=6366f1&color=fff`}
                                    alt=""
                                    className="w-8 h-8 rounded-full"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{topUser.displayName}</p>
                                    <p className="text-xs text-gray-500">{topUser.adsPosted} ads • {topUser.chatsSent} chats</p>
                                </div>
                                <button
                                    onClick={() => handleBanUser(topUser.userId)}
                                    className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                    Ban
                                </button>
                            </div>
                        ))}
                        {topUsers.length === 0 && (
                            <div className="p-4 text-center text-gray-400 text-sm">No active users yet</div>
                        )}
                    </div>
                </div>

                {/* Live Activity Feed */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="font-bold text-gray-900">⚡ Live Activity Feed</h2>
                        <span className="text-xs text-gray-400">{feed.length} activities</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                        {feed.map((item, idx) => (
                            <div key={idx} className="p-3 hover:bg-gray-50">
                                <div className="flex items-start gap-3">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${ACTION_COLORS[item.type] || 'bg-gray-100'}`}>
                                        {ACTION_ICONS[item.type] || '📌'}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900">
                                            <span className="font-medium">{item.userName || 'System'}</span>
                                            <span className="text-gray-500"> {item.description}</span>
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">{formatTimeAgo(item.timestamp)}</p>
                                    </div>
                                    {(item.targetId || item.userId) && (
                                        <button
                                            onClick={() => handleViewActivity(item)}
                                            className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                                        >
                                            {getViewLabel(item)}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {feed.length === 0 && (
                            <div className="p-4 text-center text-gray-400 text-sm">No recent activity</div>
                        )}
                    </div>
                    {/* View More button */}
                    <div className="p-3 border-t border-gray-100">
                        <button
                            onClick={() => router.push('/admin/activity')}
                            className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition"
                        >
                            View All Activity →
                        </button>
                    </div>
                </div>

                {/* Login IPs - Admin Only */}
                {canViewSecurity(user) && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="font-bold text-gray-900">🌐 Recent Login IPs</h2>
                        </div>
                        <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                            {loginIps.slice(0, 15).map((ip, idx) => (
                                <div key={idx} className={`p-3 hover:bg-gray-50 ${ip.isSuspicious ? 'bg-red-50' : ''}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm text-gray-700">{ip.ip}</span>
                                                {ip.isSuspicious && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded">
                                                        SUSPICIOUS
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {ip.userName} • {ip.country}
                                            </p>
                                        </div>
                                        <span className="text-xs text-gray-400">{formatTimeAgo(ip.lastSeen)}</span>
                                    </div>
                                </div>
                            ))}
                            {loginIps.length === 0 && (
                                <div className="p-4 text-center text-gray-400 text-sm">No recent logins</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Pending Verifications Section - Moderator+ */}
            {canManageUsers(user) && (
                <div id="pending-section" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">📋 Pending Verifications</h2>
                            <p className="text-sm text-gray-500 mt-1">Users waiting for ID verification approval</p>
                        </div>
                        <button
                            onClick={() => router.push('/admin/users?verificationStatus=PENDING')}
                            className="text-sm text-blue-600 font-medium hover:underline"
                        >
                            View All
                        </button>
                    </div>

                    {pendingUsers.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <p className="text-xl">🎉 All caught up!</p>
                            <p>No pending verifications at the moment.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Location</th>
                                        <th className="px-6 py-4">Submitted</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {pendingUsers.slice(0, 5).map((pendingUser) => (
                                        <tr key={pendingUser.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={pendingUser.profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(pendingUser.profile?.displayName || pendingUser.email)}&background=6366f1&color=fff`}
                                                        alt={pendingUser.profile?.displayName}
                                                        className="w-10 h-10 rounded-full bg-gray-200"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {pendingUser.firstName} {pendingUser.lastName}
                                                        </p>
                                                        <p className="text-sm text-gray-500">{pendingUser.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {pendingUser.locationAddress || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">
                                                {new Date(pendingUser.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                                    Pending Review
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleReview(pendingUser)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
                                                >
                                                    Review
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Verification Review Modal */}
            {selectedUser && (
                <VerificationReviewModal
                    user={selectedUser}
                    onClose={handleCloseModal}
                    onDecision={handleDecision}
                />
            )}
        </div>
    );
}
