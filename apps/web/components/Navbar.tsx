'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useCartStore } from '@/lib/cart-store';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useNotificationsStore } from '@/lib/notifications-store';
import { useEffect, useState } from 'react';
import VerificationBlockModal from './VerificationBlockModal';
import SideMenu from './SideMenu';

// Debounce hook for live search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function Navbar() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const { getItemCount } = useCartStore();
  const { unreadCount, fetchUnreadCount } = useNotificationsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Debounce search for 400ms
  const debouncedSearch = useDebounce(searchQuery, 400);

  // Ensure component is mounted before using router hooks
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const itemCount = getItemCount();

  // Sync searchQuery with URL on mount and when URL changes
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== searchQuery && pathname.startsWith('/listings')) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams, pathname]);

  // Auto-search when debounced value changes (only on listings pages)
  useEffect(() => {
    if (!isMounted || !pathname.startsWith('/listings')) return;

    const currentUrlSearch = searchParams.get('search') || '';

    // Only update URL if the debounced search differs from current URL
    if (debouncedSearch.trim() !== currentUrlSearch) {
      const params = new URLSearchParams(searchParams.toString());
      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      } else {
        params.delete('search');
      }
      router.push(`/listings?${params.toString()}`, { scroll: false });
    }
  }, [debouncedSearch, isMounted, pathname]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Only fetch notifications after hydration is complete and user is authenticated
    if (_hasHydrated && isAuthenticated) {
      const timer = setTimeout(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [_hasHydrated, isAuthenticated, fetchUnreadCount]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Immediate search on Enter key
    if (searchQuery.trim()) {
      router.push(`/listings?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/listings');
    }
  };

  const navLinks = [
    {
      href: '/listings',
      label: 'Browse',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: '/distress',
      label: 'Distress Sales',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
      ),
    },
    {
      href: '/listings/create',
      label: 'Sell',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      href: '/offers',
      label: 'Offers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
    {
      href: '/messages',
      label: 'Messages',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
  ];

  if (user?.role === 'admin') {
    navLinks.push({
      href: '/admin',
      label: 'Admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    });
  }

  // Don't render until mounted on client (fixes App Router context error)
  if (!isMounted) {
    return null;
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

  // Logo Component
  const Logo = () => (
    <Link href="/listings" className="flex items-center gap-2.5 group shrink-0">
      {/* Logo Icon */}
      <div className="relative w-10 h-10">
        <img
          src="/logo-transparent.png"
          alt="BarterWave"
          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
        />
      </div>
      {/* Logo Text */}
      <span className="text-xl font-bold font-display">
        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Barter</span>
        <span className="text-gray-900">Wave</span>
      </span>
    </Link>
  );

  // Navigation Link Component
  const NavLink = ({ href, label, icon, isActive }: { href: string; label: string; icon: React.ReactNode; isActive: boolean }) => (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive
        ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600'
        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
        }`}
    >
      <span className={isActive ? 'text-blue-600' : 'text-gray-400'}>{icon}</span>
      <span className="hidden xl:inline">{label}</span>
    </Link>
  );

  // Icon Button Component
  const IconButton = ({ href, icon, badge }: { href: string; icon: React.ReactNode; badge?: number }) => (
    <Link
      href={href}
      className="relative p-2.5 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-xl transition-all"
    >
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 shadow-lg">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );

  return (
    <>
      {/* Suspension Banner - Fixed at top for suspended users */}
      {_hasHydrated && isAuthenticated && user?.status === 'suspended' && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white fixed top-0 left-0 right-0 z-[60] shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-2.5 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <span className="text-sm font-medium">Your account is suspended. Some features are unavailable.</span>
              </div>
              <Link
                href="/appeals"
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap"
              >
                Submit Appeal →
              </Link>
            </div>
          </div>
        </div>
      )}
      <nav className={`bg-gradient-to-r from-purple-100 via-pink-100 to-orange-100 backdrop-blur-xl border-b sticky z-50 transition-all duration-300 ${_hasHydrated && isAuthenticated && user?.status === 'suspended' ? 'top-[44px]' : 'top-0'} ${isScrolled ? 'border-purple-200/50 shadow-sm' : 'border-transparent'
        }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Logo />

            {/* Search Bar - Desktop - Only on listings pages */}
            {pathname.startsWith('/listings') && (
              <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
                <div className="relative w-full">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search items..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </form>
            )}

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                  isActive={pathname === link.href}
                />
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-1">
              {/* Notifications Icon */}
              <IconButton
                href="/notifications"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                }
                badge={unreadCount}
              />

              {/* Cart Icon */}
              <IconButton
                href="/cart"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                badge={itemCount}
              />

              {/* Auth Section */}
              {isAuthenticated ? (
                <SideMenu />
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="text-gray-700 font-medium hover:text-blue-600 px-3 py-2 text-sm hidden sm:block">
                    Login
                  </Link>
                  <Link href="/register" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all text-sm">
                    Join Free
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <VerificationBlockModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
      />
    </>
  );
}
