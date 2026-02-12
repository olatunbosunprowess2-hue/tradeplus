'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { adminApi, SidebarCounts } from '@/lib/admin-api';
import { useAuthStore } from '@/lib/auth-store';
import { PERMISSIONS, hasRoleLevel } from '@/lib/rbac';

// Notification badge component with animation
function NotificationBadge({ count, pulse = false }: { count: number; pulse?: boolean }) {
    if (count === 0) return null;

    return (
        <span className={`
            ml-auto min-w-[20px] h-5 px-1.5 
            flex items-center justify-center 
            text-xs font-bold text-white 
            bg-red-500 rounded-full
            ${pulse ? 'animate-pulse' : ''}
            ${count > 99 ? 'text-[10px]' : ''}
        `}>
            {count > 99 ? '99+' : count}
        </span>
    );
}

export default function AdminSidebar() {
    const pathname = usePathname();
    const { user } = useAuthStore();
    const [counts, setCounts] = useState<SidebarCounts | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch sidebar counts on mount and periodically
    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const response = await adminApi.getSidebarCounts();
                setCounts(response.data);
            } catch (error) {
                console.error('Failed to fetch sidebar counts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCounts();

        // Refresh counts every 60 seconds
        const interval = setInterval(fetchCounts, 60000);
        return () => clearInterval(interval);
    }, []);

    const navItems = [
        {
            name: 'Dashboard',
            href: '/admin/dashboard',
            countKey: null,
            minRole: PERMISSIONS.VIEW_DASHBOARD,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            name: 'Users',
            href: '/admin/users',
            countKey: 'users' as keyof SidebarCounts,
            tooltip: 'Pending verifications & flagged users',
            minRole: PERMISSIONS.VIEW_USERS,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        },
        {
            name: 'Listings',
            href: '/admin/listings',
            countKey: 'listings' as keyof SidebarCounts,
            tooltip: 'Suspended listings',
            minRole: PERMISSIONS.VIEW_LISTINGS,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
        },
        {
            name: 'Reviews',
            href: '/admin/reviews',
            countKey: 'reviews' as keyof SidebarCounts,
            tooltip: 'Flagged reviews needing moderation',
            urgent: true,
            minRole: PERMISSIONS.VIEW_REVIEWS,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
            ),
        },
        {
            name: 'Reports',
            href: '/admin/reports',
            countKey: 'reports' as keyof SidebarCounts,
            tooltip: 'Open reports requiring action',
            urgent: true,
            minRole: PERMISSIONS.VIEW_REPORTS,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
        },
        {
            name: 'Appeals',
            href: '/admin/appeals',
            countKey: 'appeals' as keyof SidebarCounts,
            tooltip: 'Pending user appeals',
            urgent: true,
            minRole: PERMISSIONS.VIEW_APPEALS,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
        },
        {
            name: 'Disputes',
            href: '/admin/disputes',
            countKey: 'disputes' as keyof SidebarCounts,
            tooltip: 'Open disputes requiring resolution',
            urgent: true,
            minRole: PERMISSIONS.VIEW_DISPUTES,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
            ),
        },
        {
            name: 'Brands',
            href: '/admin/brands',
            countKey: 'pendingBrands' as keyof SidebarCounts,
            tooltip: 'Pending brand verification applications',
            urgent: true,
            minRole: PERMISSIONS.MANAGE_USERS,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
            ),
        },
        {
            name: 'Trade Monitor',
            href: '/admin/trades',
            countKey: null,
            minRole: PERMISSIONS.VIEW_DISPUTES,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
            ),
        },
        {
            name: 'Analytics',
            href: '/admin/analytics',
            countKey: null,
            minRole: PERMISSIONS.VIEW_ANALYTICS,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
        {
            name: 'Monetization',
            href: '/admin/monetization',
            countKey: null,
            minRole: PERMISSIONS.VIEW_ANALYTICS,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            name: 'Security',
            href: '/admin/security',
            countKey: 'security' as keyof SidebarCounts,
            tooltip: 'Blocked IPs & security alerts',
            minRole: PERMISSIONS.VIEW_SECURITY,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            ),
        },
        {
            name: 'Manage Team',
            href: '/admin/team',
            countKey: null,
            minRole: PERMISSIONS.MANAGE_TEAM,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        },
    ];

    // Calculate total pending items for header badge
    const totalPending = counts
        ? (counts.users || 0) + (counts.reviews || 0) + (counts.reports || 0) + (counts.appeals || 0) + (counts.disputes || 0)
        : 0;

    return (
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Admin Panel
                    </h2>
                    {totalPending > 0 && (
                        <span className="flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                            {totalPending > 99 ? '99+' : totalPending}
                        </span>
                    )}
                </div>
                {totalPending > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                        {totalPending} item{totalPending > 1 ? 's' : ''} need{totalPending === 1 ? 's' : ''} attention
                    </p>
                )}
            </div>

            <nav className="px-3">
                {navItems.filter(item => {
                    if (!user) return false;
                    const requiredLevel = (item as any).minRole || 0;
                    return hasRoleLevel(user, requiredLevel);
                }).map((item) => {
                    // Check if current path starts with item href (handles sub-pages like /admin/users/123)
                    // For dashboard, exact match is usually better unless it has sub-pages
                    const isActive = item.href === '/admin/dashboard'
                        ? pathname === item.href
                        : pathname.startsWith(item.href);

                    const count = item.countKey && counts ? (counts[item.countKey] as number) || 0 : 0;
                    const showPulse = (item as any).urgent && count > 0;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={(item as any).tooltip}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all group ${isActive
                                ? 'bg-blue-50 text-blue-600 font-medium'
                                : 'text-gray-700 hover:bg-gray-50'
                                } ${count > 0 && !isActive ? 'bg-red-50/50' : ''}`}
                        >
                            <span className={isActive ? 'text-blue-600' : (count > 0 ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-600')}>
                                {item.icon}
                            </span>
                            <span className="flex-1">{item.name}</span>
                            {item.countKey && (
                                <NotificationBadge count={count} pulse={showPulse} />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Summary section */}
            {counts && counts.breakdown && (
                <div className="mx-3 mt-4 p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Pending Actions</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        {counts.breakdown.pendingVerifications > 0 && (
                            <div className="flex items-center gap-1 text-orange-600">
                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                {counts.breakdown.pendingVerifications} verifications
                            </div>
                        )}
                        {counts.breakdown.flaggedReviews > 0 && (
                            <div className="flex items-center gap-1 text-yellow-600">
                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                {counts.breakdown.flaggedReviews} reviews
                            </div>
                        )}
                        {counts.breakdown.openReports > 0 && (
                            <div className="flex items-center gap-1 text-red-600">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                {counts.breakdown.openReports} reports
                            </div>
                        )}
                        {counts.breakdown.pendingAppeals > 0 && (
                            <div className="flex items-center gap-1 text-purple-600">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                {counts.breakdown.pendingAppeals} appeals
                            </div>
                        )}
                        {counts.breakdown.openDisputes > 0 && (
                            <div className="flex items-center gap-1 text-red-600">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                {counts.breakdown.openDisputes} disputes
                            </div>
                        )}
                        {counts.breakdown.multiReportedUsers > 0 && (
                            <div className="flex items-center gap-1 text-red-700 font-medium col-span-2">
                                <span className="w-2 h-2 rounded-full bg-red-700 animate-pulse"></span>
                                {counts.breakdown.multiReportedUsers} flagged user{counts.breakdown.multiReportedUsers > 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-white">
                <Link
                    href="/listings"
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="text-sm">Back to Site</span>
                </Link>
            </div>
        </aside>
    );
}
