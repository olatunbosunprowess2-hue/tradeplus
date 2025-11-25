'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useCartStore } from '@/lib/cart-store';
import { useRouter, usePathname } from 'next/navigation';
import { useNotificationsStore } from '@/lib/notifications-store';
import { useEffect, useState } from 'react';
import VerificationBlockModal from './VerificationBlockModal';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { getItemCount } = useCartStore();
  const { unreadCount, fetchUnreadCount } = useNotificationsStore();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const itemCount = getItemCount();

  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      try {
        logout();
        router.push('/');
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/listings?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/listings');
    }
  };


  const navLinks = [
    {
      href: '/listings',
      label: 'Browse',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      isImage: false
    },
    {
      href: '/wants',
      label: 'Wants',
      icon: '/icons/icon-wants-new.png',
      isImage: true
    },
    {
      href: '/listings/create',
      label: 'Sell',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      isImage: false
    },
    {
      href: '/offers',
      label: 'Offers',
      icon: '/icons/icon-offers.png',
      isImage: true
    },
    {
      href: '/messages',
      label: 'Messages',
      icon: '/icons/icon-messages-new.png',
      isImage: true
    },
  ];

  if (user?.role === 'admin') {
    navLinks.push({ href: '/admin', label: 'Admin', icon: '⚙️', isImage: false });
  }

  // Hide navbar on homepage for all users
  if (pathname === '/') {
    return null;
  }

  // Hide navbar on specific auth pages
  const hiddenPages = ['/login', '/register'];
  if (hiddenPages.includes(pathname)) {
    return null;
  }

  // Hide navbar on mobile for app pages (mobile has bottom nav)
  const mobileHiddenPages = ['/wants', '/listings/create', '/offers', '/messages', '/admin'];
  if (mobileHiddenPages.includes(pathname)) {
    return (
      <nav className="hidden lg:block bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link href="/listings" className="flex items-center gap-2 group shrink-0">
              <img
                src="/logo-transparent.png"
                alt="TradePlus"
                className="h-16 w-auto group-hover:scale-105 transition-transform"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Trade+
              </span>
            </Link>

            {/* Search Bar - Centered - Visible on all screens, adapts width */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl relative mx-2 md:mx-4">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-sm"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            {/* User Menu */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Desktop Nav Links (Icons only to save space) */}
              <div className="hidden lg:flex items-center gap-1 mr-2">
                {navLinks.map((link) => {
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      title={link.label}
                      className={`p-2 rounded-lg transition-all ${pathname === link.href
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                        }`}
                    >
                      {link.isImage ? (
                        <img
                          src={link.icon as string}
                          alt={link.label}
                          className={`w-6 h-6 object-contain ${pathname === link.href ? '' : 'grayscale opacity-70'}`}
                        />
                      ) : (
                        typeof link.icon === 'string' ? <span className="text-xl">{link.icon}</span> : link.icon
                      )}
                    </Link>
                  );
                })}
              </div>

              <Link
                href="/notifications"
                className="p-2 text-gray-600 hover:text-blue-600 transition relative"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/cart"
                className="p-2 text-gray-600 hover:text-blue-600 transition relative"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-600 hover:text-red-600 transition"
                    title="Log Out"
                  >
                    <img src="/icons/icon-logout-new.png" alt="Log Out" className="w-6 h-6 object-contain" />
                  </button>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                      {user?.profile?.displayName?.[0]?.toUpperCase() || user?.email[0].toUpperCase()}
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="text-gray-700 font-medium hover:text-blue-600">Login</Link>
                  <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-full font-medium hover:bg-blue-700 transition">Join</Link>
                </div>
              )}
            </div>
          </div>
        </div>
        <VerificationBlockModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
        />
      </nav>
    );
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/listings" className="flex items-center gap-2 group shrink-0">
            <img
              src="/logo-transparent.png"
              alt="TradePlus"
              className="h-16 w-auto group-hover:scale-105 transition-transform"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Trade+
            </span>
          </Link>

          {/* Search Bar - Centered - Visible on all screens, adapts width */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl relative mx-2 md:mx-4">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-sm"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* User Menu */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop Nav Links (Icons only to save space) */}
            <div className="hidden lg:flex items-center gap-1 mr-2">
              {navLinks.map((link) => {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    title={link.label}
                    className={`p-2 rounded-lg transition-all ${pathname === link.href
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                      }`}
                  >
                    {link.isImage ? (
                      <img
                        src={link.icon as string}
                        alt={link.label}
                        className={`w-6 h-6 object-contain ${pathname === link.href ? '' : 'grayscale opacity-70'}`}
                      />
                    ) : (
                      typeof link.icon === 'string' ? <span className="text-xl">{link.icon}</span> : link.icon
                    )}
                  </Link>
                );
              })}
            </div>

            <Link
              href="/notifications"
              className="p-2 text-gray-600 hover:text-blue-600 transition relative"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              className="p-2 text-gray-600 hover:text-blue-600 transition relative"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 transition"
                  title="Log Out"
                >
                  <img src="/icons/icon-logout-new.png" alt="Log Out" className="w-6 h-6 object-contain" />
                </button>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {user?.profile?.displayName?.[0]?.toUpperCase() || user?.email[0].toUpperCase()}
                  </div>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-gray-700 font-medium hover:text-blue-600">Login</Link>
                <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-full font-medium hover:bg-blue-700 transition">Join</Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <VerificationBlockModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
      />
    </nav>
  );
}
