'use client';


import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function MobileBottomNav() {
    const pathname = usePathname();
    const { isAuthenticated, user } = useAuthStore();

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
            isImage: false,
            primary: false
        },
        {
            href: '/wants',
            label: 'Wants',
            icon: '/icons/icon-wants.png',
            isImage: true,
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
            primary: true,
            isImage: false
        },
        {
            href: '/offers',
            label: 'Offers',
            icon: '/icons/icon-offers.png',
            isImage: true,
            primary: false
        },
        {
            href: '/messages',
            label: 'Messages',
            icon: '/icons/icon-messages.png',
            isImage: true,
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
            isImage: false,
            primary: false
        });
    }

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;

                    if (item.primary) {
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-col items-center justify-center -mt-8"
                            >
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105">
                                    {item.isImage ? (
                                        <img src={item.icon as string} alt={item.label} className="w-7 h-7 object-contain invert brightness-0" />
                                    ) : (
                                        item.icon as React.ReactNode
                                    )}
                                </div>
                                <span className="text-xs mt-1 font-medium text-gray-600">{item.label}</span>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${isActive
                                ? 'text-blue-600'
                                : 'text-gray-500 hover:text-blue-600'
                                }`}
                        >
                            <div className={isActive ? 'scale-110' : ''}>
                                {item.isImage ? (
                                    <img
                                        src={item.icon as string}
                                        alt={item.label}
                                        className={`w-6 h-6 object-contain ${isActive ? '' : 'grayscale opacity-70'}`}
                                    />
                                ) : (
                                    item.icon as React.ReactNode
                                )}
                            </div>
                            <span className={`text-xs mt-1 font-medium ${isActive ? 'font-semibold' : ''}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
