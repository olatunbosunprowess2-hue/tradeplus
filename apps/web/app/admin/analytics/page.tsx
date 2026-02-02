'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';

interface KPIData {
    users: { current: number; prev: number; delta: number };
    ads: { current: number; prev: number; delta: number };
    chats: { current: number; prev: number; delta: number };
    reports: { current: number; prev: number; delta: number };
}

interface CategoryData {
    category: string;
    ads: number;
    views: number;
}

interface HotListing {
    id: string;
    title: string;
    views: number;
    chatCount: number;
    score: number;
}

interface SpamStats {
    hourlyDeleted: { time: string; count: number }[];
    bannedVsCreated: { date: string; created: number; banned: number }[];
    suspiciousIPs: { ip: string; accounts: number; country: string }[];
}

export default function AnalyticsDashboardPage() {
    const { user, _hasHydrated } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState<KPIData | null>(null);
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [hotListings, setHotListings] = useState<HotListing[]>([]);
    const [spamStats, setSpamStats] = useState<SpamStats | null>(null);

    // Allow admin roles: admin, moderator, super_admin
    const isAdminRole = user?.role === 'admin' || user?.userRole?.name === 'admin' ||
        user?.userRole?.name === 'moderator' || user?.userRole?.name === 'super_admin' ||
        user?.userRole?.name === 'analytics_viewer';

    useEffect(() => {
        if (_hasHydrated && (!user || !isAdminRole)) {
            router.push('/login');
        }
    }, [user, _hasHydrated, router, isAdminRole]);

    useEffect(() => {
        if (isAdminRole) {
            fetchData();
        }
    }, [user, isAdminRole]);

    const fetchData = async () => {
        try {
            const [kpisRes, categoriesRes, hotRes, spamRes] = await Promise.all([
                apiClient.get('/analytics/kpi'),
                apiClient.get('/analytics/categories'),
                apiClient.get('/analytics/hot'),
                apiClient.get('/analytics/spam'),
            ]);
            setKpis(kpisRes.data);
            setCategories(categoriesRes.data);
            setHotListings(hotRes.data);
            setSpamStats(spamRes.data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (type: string) => {
        try {
            const response = await apiClient.get(`/analytics/export/csv?type=${type}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_report.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data');
        }
    };

    const handlePromoteListing = (listingId: string) => {
        // TODO: Open promote modal
        alert(`Promote listing ${listingId} - Feature coming soon!`);
    };

    const getDeltaColor = (delta: number) => {
        if (delta > 0) return 'text-green-600 bg-green-50';
        if (delta < 0) return 'text-red-600 bg-red-50';
        return 'text-gray-600 bg-gray-50';
    };

    const getDeltaIcon = (delta: number) => {
        if (delta > 0) return '↑';
        if (delta < 0) return '↓';
        return '→';
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
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">Business intelligence and insights</p>
                </div>
                <button
                    onClick={() => handleExport('kpis')}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                >
                    📊 Export All
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis && (
                    <>
                        <KPICard
                            title="New Users"
                            value={kpis.users.current}
                            delta={kpis.users.delta}
                            icon="👥"
                        />
                        <KPICard
                            title="New Ads"
                            value={kpis.ads.current}
                            delta={kpis.ads.delta}
                            icon="📦"
                        />
                        <KPICard
                            title="Active Chats"
                            value={kpis.chats.current}
                            delta={kpis.chats.delta}
                            icon="💬"
                        />
                        <KPICard
                            title="Reports"
                            value={kpis.reports.current}
                            delta={kpis.reports.delta}
                            icon="🚩"
                            isDanger={kpis.reports.current > 0}
                        />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Categories */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="font-bold text-gray-900">📊 Top Categories</h2>
                        <button
                            onClick={() => handleExport('categories')}
                            className="text-xs text-blue-600 hover:underline"
                        >
                            Export CSV
                        </button>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {categories.slice(0, 10).map((cat, idx) => (
                            <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-gray-300 w-6">#{idx + 1}</span>
                                    <span className="font-medium text-gray-900">{cat.category}</span>
                                </div>
                                <div className="flex items-center gap-6 text-sm">
                                    <div className="text-right">
                                        <span className="font-bold text-gray-900">{cat.ads}</span>
                                        <span className="text-gray-500 ml-1">ads</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-blue-600">{cat.views}</span>
                                        <span className="text-gray-500 ml-1">views</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <div className="p-4 text-center text-gray-400">No data available</div>
                        )}
                    </div>
                </div>

                {/* Hot Listings */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="font-bold text-gray-900">🔥 Hot Listings (48h)</h2>
                        <button
                            onClick={() => handleExport('hot')}
                            className="text-xs text-blue-600 hover:underline"
                        >
                            Export CSV
                        </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                        {hotListings.slice(0, 20).map((listing, idx) => (
                            <div key={listing.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <span className={`text-lg font-bold ${idx < 3 ? 'text-amber-500' : 'text-gray-300'} w-6`}>
                                        {idx < 3 ? '🏆' : `#${idx + 1}`}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{listing.title}</p>
                                        <p className="text-xs text-gray-500">
                                            👁️ {listing.views} views • 💬 {listing.chatCount} chats
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handlePromoteListing(listing.id)}
                                    className="px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition"
                                >
                                    ⭐ Promote
                                </button>
                            </div>
                        ))}
                        {hotListings.length === 0 && (
                            <div className="p-4 text-center text-gray-400">No hot listings yet</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Spam & Abuse Panel */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="font-bold text-gray-900">🛡️ Spam & Abuse Trends</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                    {/* Hourly Deleted Ads Chart */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-4">Hourly Deleted Ads (24h)</h3>
                        <div className="flex items-end gap-1 h-32">
                            {spamStats?.hourlyDeleted.slice(0, 24).map((hour, idx) => (
                                <div
                                    key={idx}
                                    className="flex-1 bg-red-200 rounded-t hover:bg-red-400 transition"
                                    style={{
                                        height: `${Math.max(4, (hour.count / Math.max(...spamStats.hourlyDeleted.map(h => h.count), 1)) * 100)}%`
                                    }}
                                    title={`${hour.time}: ${hour.count} deleted`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Users Created vs Banned */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-4">Users: Created vs Banned (7d)</h3>
                        <div className="space-y-2">
                            {spamStats?.bannedVsCreated.slice(-7).map((day, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-sm">
                                    <span className="text-gray-500 w-20">{day.date.slice(5)}</span>
                                    <div className="flex-1 flex gap-2">
                                        <div
                                            className="bg-green-400 h-4 rounded"
                                            style={{ width: `${Math.min(day.created * 10, 100)}%` }}
                                            title={`Created: ${day.created}`}
                                        />
                                        <div
                                            className="bg-red-400 h-4 rounded"
                                            style={{ width: `${Math.min(day.banned * 20, 100)}%` }}
                                            title={`Banned: ${day.banned}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded"></span> Created</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded"></span> Banned</span>
                        </div>
                    </div>

                    {/* Suspicious IPs */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-4">Suspicious IPs (7d)</h3>
                        <div className="space-y-2">
                            {spamStats?.suspiciousIPs.slice(0, 5).map((ip, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm bg-red-50 p-2 rounded-lg">
                                    <span className="font-mono text-red-800">{ip.ip}</span>
                                    <span className="px-2 py-0.5 bg-red-200 text-red-800 rounded text-xs font-bold">
                                        {ip.accounts} accounts
                                    </span>
                                </div>
                            ))}
                            {(!spamStats?.suspiciousIPs || spamStats.suspiciousIPs.length === 0) && (
                                <div className="text-center text-gray-400 text-sm py-4">No suspicious IPs detected</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({
    title,
    value,
    delta,
    icon,
    isDanger = false
}: {
    title: string;
    value: number;
    delta: number;
    icon: string;
    isDanger?: boolean;
}) {
    const getDeltaColor = (delta: number) => {
        if (delta > 0) return 'text-green-600 bg-green-50';
        if (delta < 0) return 'text-red-600 bg-red-50';
        return 'text-gray-600 bg-gray-50';
    };

    return (
        <div className={`bg-white rounded-xl p-6 border shadow-sm ${isDanger ? 'border-red-200' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">{icon}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getDeltaColor(delta)}`}>
                    {delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} {Math.abs(delta)}%
                </span>
            </div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className={`text-3xl font-bold ${isDanger && value > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {value.toLocaleString()}
            </p>
        </div>
    );
}
