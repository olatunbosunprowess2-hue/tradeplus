'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import MarketplaceHero from './MarketplaceHero';
import CategoryShortcutBar from './CategoryShortcutBar';
import DistressDealsRail from './DistressDealsRail';
import MarketFeed from './MarketFeed';
import CommunityFeed from './CommunityFeed';
import { ShoppingBag, MessageSquareText } from 'lucide-react';

export default function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const activeTab: 'market' | 'community' =
    searchParams.get('tab') === 'community' ? 'community' : 'market';

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
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Visually hidden h1 for SEO */}
      <h1 className="sr-only">
        BarterWave - Nigeria&apos;s Trusted Swap, Barter, and Distress Sale Marketplace
      </h1>

      <div className="container mx-auto px-4 max-w-7xl pt-4">
        {/* ============================================================ */}
        {/* 1. TOP COMMERCIAL 3-COLUMN HERO GRID                         */}
        {/* ============================================================ */}
        <MarketplaceHero />

        {/* ============================================================ */}
        {/* 2. CATEGORY ICON SHORTCUT STRIP                              */}
        {/* ============================================================ */}
        <CategoryShortcutBar />

        {/* ============================================================ */}
        {/* 3. DISTRESS SALES & FLASH LIQUIDATION RAIL                   */}
        {/* ============================================================ */}
        <DistressDealsRail />

        {/* ============================================================ */}
        {/* 4. STREAMLINED FEED SUB-NAVIGATION                           */}
        {/* ============================================================ */}
        <div className="flex items-center justify-between gap-3 mb-6 bg-white border border-slate-200 rounded-lg p-1.5 shadow-2xs">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => handleTabChange('market')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-all ${
                activeTab === 'market'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Marketplace Feed</span>
            </button>

            <button
              onClick={() => handleTabChange('community')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-all ${
                activeTab === 'community'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <MessageSquareText className="w-3.5 h-3.5" />
              <span>Trade Requests &amp; Wants</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 5. TAB CONTENT                                               */}
        {/* ============================================================ */}
        {activeTab === 'market' ? <MarketFeed /> : <CommunityFeed />}
      </div>
    </div>
  );
}
