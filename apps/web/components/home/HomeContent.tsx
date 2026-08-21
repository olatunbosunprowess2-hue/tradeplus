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
        <div className="flex items-center justify-between border-b border-slate-200 mb-6 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTabChange('market')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold border-b-2 -mb-2 transition-all ${
                activeTab === 'market'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Marketplace Feed</span>
            </button>

            <button
              onClick={() => handleTabChange('community')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold border-b-2 -mb-2 transition-all ${
                activeTab === 'community'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <MessageSquareText className="w-4 h-4" />
              <span>Community Feed</span>
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
