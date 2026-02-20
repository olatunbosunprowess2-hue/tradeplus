'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { sanitizeUrl } from '@/lib/utils';

interface SideMenuProps {
    className?: string;
}

export default function SideMenu({ className = '' }: SideMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const { user, isAuthenticated, logout } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Close menu when route changes
    useEffect(() => {
        setIsOpen(false);
        setShowLogoutModal(false);
    }, [pathname]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen || showLogoutModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, showLogoutModal]);

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const handleLogoutConfirm = () => {
        logout();
        setShowLogoutModal(false);
        setIsOpen(false);
        router.push('/');
    };

    const handleLogoutCancel = () => {
        setShowLogoutModal(false);
    };

    const menuItems = [
        {
            section: 'My Account',
            items: [
                {
                    href: '/profile',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    ),
                    label: 'My Profile',
                    description: 'View and edit your profile'
                },
                {
                    href: '/my-listings',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    ),
                    label: 'My Listings',
                    description: 'Manage your items for sale'
                },
                {
                    href: '/offers',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    ),
                    label: 'Trade Offers',
                    description: 'Sent and received offers'
                },
            ]
        },
        {
            section: 'Activity',
            items: [

                {
                    href: '/wants',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    ),
                    label: 'Bookmarks',
                    description: 'Your wants & saved posts'
                },
                {
                    href: '/notifications',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    ),
                    label: 'Notifications',
                    description: 'Alerts and updates'
                },
            ]
        },
        {
            section: 'Settings',
            items: [
                {
                    href: '/settings',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    ),
                    label: 'Settings',
                    description: 'App preferences'
                },
                {
                    href: '/help',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ),
                    label: 'Help & Support',
                    description: 'FAQs and contact'
                },
            ]
        }
    ];

    // Add admin section if user is admin
    if (user?.role === 'admin') {
        menuItems.push({
            section: 'Admin',
            items: [
                {
                    href: '/admin',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    ),
                    label: 'Admin Dashboard',
                    description: 'Manage platform'
                },
            ]
        });
    }

    const menuContent = (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[9998] transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Side Drawer */}
            <div
                className={`fixed top-0 right-0 bottom-0 w-64 max-w-[65vw] bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="bg-blue-600 text-white p-4 shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        {/* h2 removed */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-white/20 rounded-lg transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {isAuthenticated && user && (
                        <div className="flex items-center gap-3">
                            {user.profile?.avatarUrl ? (
                                <img
                                    src={sanitizeUrl(user.profile.avatarUrl)}
                                    alt=""
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                                    {user.profile?.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">
                                    {user.profile?.displayName || 'User'}
                                </p>
                                <p className="text-sm text-blue-100 truncate">{user.email}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Menu Items */}
                <div className="flex-1 overflow-y-auto py-2">
                    {menuItems.map((section, sectionIndex) => (
                        <div key={section.section} className={sectionIndex > 0 ? 'mt-2 pt-2 border-t border-gray-100' : ''}>
                            <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                {section.section}
                            </p>
                            {section.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors ${pathname === item.href ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                        }`}
                                >
                                    <div className={pathname === item.href ? 'text-blue-600' : 'text-gray-400'}>
                                        {item.icon}
                                    </div>
                                    <span className="font-medium text-sm flex-1">{item.label}</span>
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            ))}
                        </div>
                    ))}

                    {/* Logout as last menu item */}
                    {isAuthenticated && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                            <button
                                onClick={handleLogoutClick}
                                className="flex items-center gap-3 px-4 py-2.5 w-full hover:bg-red-50 transition-colors text-red-600"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span className="font-medium text-sm flex-1 text-left">Log Out</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer - Only show login/register for non-authenticated users */}
                {!isAuthenticated && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
                        <div className="flex gap-2">
                            <Link
                                href="/login"
                                className="flex-1 px-4 py-3 text-center border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="flex-1 px-4 py-3 text-center bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                            >
                                Join
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Modal Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={handleLogoutCancel}
                    />

                    {/* Modal Content */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
                        {/* Modal Header */}
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Log Out?</h3>
                            <p className="text-gray-600 text-sm">
                                Are you sure you want to log out of your account? You'll need to sign in again to access your listings and trades.
                            </p>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex border-t border-gray-100">
                            <button
                                onClick={handleLogoutCancel}
                                className="flex-1 px-6 py-4 text-gray-700 font-semibold hover:bg-gray-50 transition border-r border-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogoutConfirm}
                                className="flex-1 px-6 py-4 text-red-600 font-semibold hover:bg-red-50 transition"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes scale-in {
                    from {
                        transform: scale(0.95);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                .animate-scale-in {
                    animation: scale-in 0.2s ease-out;
                }
            `}</style>
        </>
    );

    return (
        <>
            {/* Menu Trigger — Avatar or Hamburger */}
            <button
                onClick={() => setIsOpen(true)}
                className={`p-1 rounded-full transition-all ${className}`}
                aria-label="Open menu"
            >
                {isAuthenticated && user ? (
                    <div className="relative group cursor-pointer">
                        {/* Stronger Pulsing active state indicator */}
                        <div className="absolute -inset-1 bg-blue-600/40 rounded-full animate-pulse group-hover:bg-blue-600/60 transition-colors" />

                        {/* Avatar container */}
                        <div className="relative z-10">
                            {user.profile?.avatarUrl ? (
                                <img
                                    src={sanitizeUrl(user.profile.avatarUrl)}
                                    alt="Profile"
                                    className="w-8 h-8 rounded-full object-cover border-2 border-white ring-1 ring-gray-200"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold border-2 border-white ring-1 ring-gray-200">
                                    {user.profile?.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Online status dot */}
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                ) : (
                    <div className="hover:bg-gray-100 p-1 rounded-full transition-colors">
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </div>
                )}
            </button>

            {/* Render menu items in portal */}
            {mounted && isOpen && createPortal(menuContent, document.body)}
        </>
    );
}
