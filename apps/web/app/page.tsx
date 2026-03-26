'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { ListingsGridSkeleton, SkeletonStyles } from '@/components/ui/Skeleton';
import HomeTabs from '@/components/home/HomeTabs';
import MarketFeed from '@/components/home/MarketFeed';
import CommunityFeed from '@/components/home/CommunityFeed';

// Rotating tips/taglines for the hero
const heroSlides = [
  { emoji: '🛒', text: 'Discover unique items for cash or barter' },
  { emoji: '🔒', text: 'Trade safely with verified sellers' },
  { emoji: '🔥', text: 'Check out urgent Distress Deals for big savings' },
  { emoji: '💬', text: 'Chat directly with verified sellers' },
  { emoji: '🤝', text: 'Swap items you have for items you need' },
];

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const activeTab: 'market' | 'community' = searchParams.get('tab') === 'community' ? 'community' : 'market';

  const [currentSlide, setCurrentSlide] = useState(0);

  // Guest hero banner dismissal
  const [showGuestBanner, setShowGuestBanner] = useState(true);

  useEffect(() => {
    // Check localStorage for dismissal
    const dismissed = typeof window !== 'undefined' && localStorage.getItem('bw_hero_dismissed');
    if (dismissed) setShowGuestBanner(false);
  }, []);

  const dismissGuestBanner = () => {
    setShowGuestBanner(false);
    localStorage.setItem('bw_hero_dismissed', 'true');
  };

  // Auto-rotate hero slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (tab: 'market' | 'community') => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'community') {
      params.set('tab', 'community');
      params.delete('search');
      params.delete('type');
      params.delete('condition');
      params.delete('paymentMode');
      params.delete('minPrice');
      params.delete('maxPrice');
      params.delete('categoryId');
      params.delete('isDistressSale');
      params.delete('countryId');
      params.delete('regionId');
    } else {
      params.delete('tab');
    }
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ============================================================ */}
      {/* GUEST HERO BANNER — only for unauthenticated visitors        */}
      {/* ============================================================ */}
      {!isAuthenticated && showGuestBanner && (
        <div className="relative bg-blue-600 text-white overflow-hidden">
          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-5 sm:py-6">
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-lg sm:text-xl font-bold leading-tight">
                  Swap items you have for items you need.{' '}
                  <span className="text-blue-200">100% Free.</span>
                </h1>
                <p className="text-blue-100 text-xs sm:text-sm mt-1">
                  Nigeria&apos;s trusted marketplace for buying, selling &amp; bartering goods.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/register"
                  className="bg-white text-blue-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all shadow-lg shadow-black/10 active:scale-95"
                >
                  Sign Up Free
                </Link>
                <Link
                  href="/login"
                  className="bg-white/15 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl font-bold text-sm border border-white/20 hover:bg-white/25 transition-all active:scale-95"
                >
                  Log In
                </Link>
              </div>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={dismissGuestBanner}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-white/50 hover:text-white/90 transition rounded-full hover:bg-white/10"
            aria-label="Dismiss banner"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Compact Hero with Rotating Slides (for all users) */}
      <div className="bg-blue-600 text-white py-4 md:py-5">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-center gap-3 text-center">
            <span className="text-2xl transition-all duration-500" key={currentSlide}>
              {heroSlides[currentSlide].emoji}
            </span>
            <p className="text-sm md:text-base font-medium text-blue-100 transition-all duration-500">
              {heroSlides[currentSlide].text}
            </p>
          </div>
          {/* Slide indicators */}
          <div className="flex justify-center gap-1.5 mt-2">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-4' : 'bg-white/40'
                  }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="container mx-auto px-4 max-w-7xl pt-4">
        <HomeTabs activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        {activeTab === 'market' ? (
          <MarketFeed />
        ) : (
          <CommunityFeed />
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-4">
        <SkeletonStyles />
        <div className="container mx-auto px-4 max-w-7xl">
          <ListingsGridSkeleton count={6} />
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
