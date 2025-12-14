'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useNotificationsStore } from '@/lib/notifications-store';
import { useEffect, useState } from 'react';

export default function MobileBottomNav() {
    const pathname = usePathname();
    const { isAuthenticated, user, _hasHydrated } = useAuthStore();
    const { unreadCount, fetchUnreadCount } = useNotificationsStore();
    const [isMounted, setIsMounted] = useState(false);

    // Ensure component is mounted before rendering
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Poll for notifications - only after hydration is complete
    useEffect(() => {
        if (_hasHydrated && isAuthenticated) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [_hasHydrated, isAuthenticated, fetchUnreadCount]);

    // Don't render until mounted on client (fixes App Router context error)
    if (!isMounted) {
        return null;
    }

    // Hide navbar on public pages
    const publicPages = ['/', '/login', '/register'];
    if (publicPages.includes(pathname)) {
        return null;
    }

    // Only show for authenticated users
    if (!isAuthenticated) return null;

    const navItems = [
        {
            href: '/listings',
            label: 'Home',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
            primary: false
        },
        {
            href: '/distress',
            label: 'Distress',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                </svg>
            ),
            primary: false
        },
        {
            href: '/listings/create',
            label: 'Sell',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
            ),
            primary: true
        },
        {
            href: '/offers',
            label: 'Offers',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
            ),
            primary: false
        },
        {
            href: '/messages',
            label: 'Messages',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
            primary: false
        },
    ];

    if (user?.role === 'admin') {
        navItems.push({
            href: '/admin',
            label: 'Admin',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            primary: false
        });
    }

    return (
        <nav
            className="md:hidden fixed left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 z-[9999] shadow-lg shadow-black/5"
            style={{ bottom: '0px' }}
        >
            {/* Gradient top border */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

            <div className="flex justify-around items-center h-16 px-2 max-w-lg mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;

                    if (item.primary) {
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-col items-center justify-center -mt-6"
                            >
                                <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105 active:scale-95">
                                    {item.icon}
                                </div>
                                <span className="text-xs mt-1.5 font-medium text-gray-500">{item.label}</span>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-all relative ${isActive
                                ? 'text-blue-600'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                            )}
                            <div className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                                {item.icon}
                            </div>
                            <span className={`text-[10px] mt-1 font-medium ${isActive ? 'font-semibold' : ''}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>

            {/* Safe area spacer for devices with home indicator */}
            <div className="h-safe-area-inset-bottom" />
        </nav>
    );
}
