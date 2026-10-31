'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  SpotlightModal,
  DistressBoostModal,
  ChatLimitModal,
  PostLimitModal,
  OfferLimitModal,
  FirstChatModal,
} from '@/components/PaywallModal';
import {
  Sparkles,
  Zap,
  Star,
  Crown,
  Bell,
  Check,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Package,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function PreviewPaymentsPage() {
  // Modal toggle states
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [selectedPlan, setSelectedPlan] = useState<string>('spotlight_7');

  // Dropdown expansion state for in-place inspection
  const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>({
    spotlight_7: true,
  });

  const toggleTierDropdown = (tierId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedTiers((prev) => ({
      ...prev,
      [tierId]: !prev[tierId],
    }));
  };

  const formatPrice = (ngn: number, usd: number) => {
    return selectedCurrency === 'NGN' ? `₦${ngn.toLocaleString()}` : `$${(usd / 100).toFixed(2)}`;
  };

  const handleSelectOption = (optionId: string, currency: 'NGN' | 'USD') => {
    alert(`[PREVIEW MODE] Selected Plan: ${optionId} in ${currency}. In live mode, this connects to Paystack!`);
    setActiveModal(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-[#0F172A] py-10 px-4 sm:px-6 lg:px-8 font-sans select-none">
      {/* Top Controller & Header */}
      <div className="max-w-5xl mx-auto mb-8 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-black uppercase tracking-wider">
                MONETIZATION STUDIO
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 text-[#16A34A] border border-emerald-200 rounded text-[10px] font-black uppercase tracking-wider">
                WHITE AESTHETIC ACTIVE
              </span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-black uppercase tracking-wider">
                MOBILE VERTICAL STACK
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
              Payment &amp; Paywall Modals Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed max-w-2xl font-medium">
              Review all monetization paywalls with clean white surfaces, vertical mobile-first stacking, and interactive dropdown benefit sheets.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <Link
              href="/trade-simulator"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <span>Trade Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/pricing"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
            >
              Public Pricing
            </Link>
            <Link
              href="/"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
            >
              Marketplace
            </Link>
          </div>
        </div>
      </div>

      {/* 1. Modal Triggers Grid */}
      <div className="max-w-5xl mx-auto mb-12">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>Interactive Modal Triggers (Click to Launch Live Modal)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Listing Spotlight */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[9px] font-black uppercase tracking-wider">
                  PRIMARY REVENUE
                </span>
                <span className="text-xs font-black text-[#0F172A]">₦500 — ₦1,200</span>
              </div>
              <h3 className="text-base font-black text-[#0F172A] mb-1 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                <span>Listing Spotlight Modal</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4 font-medium">
                <strong className="text-slate-800 font-bold">Trigger:</strong> When a seller clicks &quot;Boost Ad&quot; on their item in <em>My Listings</em> or toggles spotlight during ad creation.
              </p>
            </div>
            <button
              onClick={() => setActiveModal('spotlight')}
              className="w-full py-2.5 bg-gradient-to-r from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>Test Spotlight Modal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Distress Boost */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 bg-orange-50 text-orange-800 border border-orange-200 rounded text-[9px] font-black uppercase tracking-wider">
                  LIQUIDATION
                </span>
                <span className="text-xs font-black text-[#0F172A]">Free Promo</span>
              </div>
              <h3 className="text-base font-black text-[#0F172A] mb-1 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-orange-500 fill-orange-400 shrink-0" />
                <span>Distress Fast-Track Boost</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4 font-medium">
                <strong className="text-slate-800 font-bold">Trigger:</strong> When sellers mark an item as urgent distress and broadcast smart pings to nearby buyers.
              </p>
            </div>
            <button
              onClick={() => setActiveModal('distress')}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>Test Distress Modal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Chat Limit */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded text-[9px] font-black uppercase tracking-wider">
                  USAGE PAYWALL
                </span>
                <span className="text-xs font-black text-[#0F172A]">₦5,000 / mo</span>
              </div>
              <h3 className="text-base font-black text-[#0F172A] mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Chat Limit Paywall</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4 font-medium">
                <strong className="text-slate-800 font-bold">Trigger:</strong> When a non-paying user initiates their 16th new conversation across the platform.
              </p>
            </div>
            <button
              onClick={() => setActiveModal('chat_limit')}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>Test Chat Limit Modal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 4: Post Limit */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[9px] font-black uppercase tracking-wider">
                  VOLUME LIMIT
                </span>
                <span className="text-xs font-black text-[#0F172A]">50 Posts Max</span>
              </div>
              <h3 className="text-base font-black text-[#0F172A] mb-1 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Daily Post Limit Modal</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4 font-medium">
                <strong className="text-slate-800 font-bold">Trigger:</strong> When power sellers post over 50 items in a single 24-hour window.
              </p>
            </div>
            <button
              onClick={() => setActiveModal('post_limit')}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>Test Post Limit Modal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 5: Offer Limit */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded text-[9px] font-black uppercase tracking-wider">
                  SPAM DEFENSE
                </span>
                <span className="text-xs font-black text-[#0F172A]">5 Offers / Day</span>
              </div>
              <h3 className="text-base font-black text-[#0F172A] mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Daily Offer Limit Modal</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4 font-medium">
                <strong className="text-slate-800 font-bold">Trigger:</strong> When a user makes more than 5 trade proposals in a single day without completing them.
              </p>
            </div>
            <button
              onClick={() => setActiveModal('offer_limit')}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>Test Offer Limit Modal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 6: First-Chat Safety */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 bg-emerald-50 text-[#16A34A] border border-emerald-200 rounded text-[9px] font-black uppercase tracking-wider">
                  SAFETY ONBOARDING
                </span>
                <span className="text-xs font-black text-[#16A34A]">1-Time Popup</span>
              </div>
              <h3 className="text-base font-black text-[#0F172A] mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>First-Chat Safety Modal</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4 font-medium">
                <strong className="text-slate-800 font-bold">Trigger:</strong> When a newly registered user opens their very first chat with any seller.
              </p>
            </div>
            <button
              onClick={() => setActiveModal('first_chat')}
              className="w-full py-2.5 bg-emerald-700 hover:bg-[#16A34A] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>Test Safety Modal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. In-Place Live Inspection (Vertical Stacked & Dropdowns) */}
      <div className="max-w-xl mx-auto bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />
              <h2 className="text-base font-black text-[#0F172A] tracking-tight">
                Vertical Stack Inspection
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Tap any tier to select, or click the dropdown to inspect all benefits.
            </p>
          </div>

          {/* Currency Switcher */}
          <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 inline-flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setSelectedCurrency('NGN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                selectedCurrency === 'NGN'
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🇳🇬 NGN
            </button>
            <button
              type="button"
              onClick={() => setSelectedCurrency('USD')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                selectedCurrency === 'USD'
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🇺🇸 USD
            </button>
          </div>
        </div>

        {/* Vertical Stack List */}
        <div className="space-y-3 mb-5">
          {/* Tier 1: 3-Day Spotlight */}
          <div
            onClick={() => setSelectedPlan('spotlight_3')}
            className={`border rounded-2xl transition-all cursor-pointer overflow-hidden ${
              selectedPlan === 'spotlight_3'
                ? 'border-[#16A34A] ring-2 ring-[#16A34A]/20 bg-emerald-50/20 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                      selectedPlan === 'spotlight_3'
                        ? 'border-[#16A34A] bg-[#16A34A]'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {selectedPlan === 'spotlight_3' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-black text-sm text-[#0F172A]">Spotlight (3 Days)</span>
                      <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100">
                        IMPULSE BUY
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Fix your ad at the top of category feeds for a 72-hour visibility peak.
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-black text-[#0F172A]">{formatPrice(500, 199)}</span>
                  <span className="text-[10px] text-slate-400 block font-medium">flat</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => toggleTierDropdown('spotlight_3', e)}
                  className="text-[11px] font-bold text-[#16A34A] hover:underline flex items-center gap-1"
                >
                  <span>{expandedTiers['spotlight_3'] ? 'Hide benefits' : "What's included (3 benefits)"}</span>
                  {expandedTiers['spotlight_3'] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <span className="text-[10px] text-slate-400 font-semibold">Active for 72 Hours</span>
              </div>
            </div>

            {expandedTiers['spotlight_3'] && (
              <div className="bg-slate-50 border-t border-slate-100 px-4 py-3 space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5 stroke-[2.5]" />
                  <span className="text-slate-700 font-medium">Category-specific top slot placement</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5 stroke-[2.5]" />
                  <span className="text-slate-700 font-medium">3x more views and buyer inquiries than regular items</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5 stroke-[2.5]" />
                  <span className="text-slate-700 font-medium">⚡ Stacks automatically if purchased multiple times</span>
                </div>
              </div>
            )}
          </div>

          {/* Tier 2: 7-Day Spotlight */}
          <div
            onClick={() => setSelectedPlan('spotlight_7')}
            className={`border rounded-2xl transition-all cursor-pointer overflow-hidden ${
              selectedPlan === 'spotlight_7'
                ? 'border-[#16A34A] ring-2 ring-[#16A34A]/20 bg-emerald-50/20 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                      selectedPlan === 'spotlight_7'
                        ? 'border-[#16A34A] bg-[#16A34A]'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {selectedPlan === 'spotlight_7' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-black text-sm text-[#0F172A]">Spotlight (7 Days)</span>
                      <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider text-white bg-[#1D4ED8]">
                        MOST POPULAR
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Own the category top slot for a full week. Best for cars, phones, and laptops.
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 line-through font-bold block leading-none mb-0.5">
                    {formatPrice(2500, 699)}
                  </span>
                  <span className="text-base font-black text-[#0F172A]">{formatPrice(1200, 399)}</span>
                  <span className="text-[10px] text-slate-400 block font-medium">/ week</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => toggleTierDropdown('spotlight_7', e)}
                  className="text-[11px] font-bold text-[#16A34A] hover:underline flex items-center gap-1"
                >
                  <span>{expandedTiers['spotlight_7'] ? 'Hide benefits' : "What's included (4 benefits)"}</span>
                  {expandedTiers['spotlight_7'] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <span className="text-[10px] text-slate-400 font-semibold">Active for 7 Days</span>
              </div>
            </div>

            {expandedTiers['spotlight_7'] && (
              <div className="bg-slate-50 border-t border-slate-100 px-4 py-3 space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5 stroke-[2.5]" />
                  <span className="text-slate-700 font-medium">Fixed homepage rotating carousel placement</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5 stroke-[2.5]" />
                  <span className="text-slate-700 font-medium">Verified &quot;Featured&quot; badge on your listing card</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5 stroke-[2.5]" />
                  <span className="text-slate-700 font-medium">5x higher view count and faster deal completion</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5 stroke-[2.5]" />
                  <span className="text-slate-700 font-medium">⚡ Days stack automatically if renewed</span>
                </div>
              </div>
            )}
          </div>

          {/* Tier 3: Empire Status Pro */}
          <div
            onClick={() => setSelectedPlan('premium')}
            className={`border rounded-2xl transition-all cursor-pointer overflow-hidden ${
              selectedPlan === 'premium'
                ? 'border-amber-400 ring-2 ring-amber-400/25 bg-amber-50/20 shadow-sm'
                : 'border-amber-200/90 bg-gradient-to-br from-amber-50/10 to-orange-50/10 hover:border-amber-300'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                      selectedPlan === 'premium'
                        ? 'border-amber-500 bg-amber-500'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {selectedPlan === 'premium' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />
                      <span className="font-black text-sm text-[#0F172A]">Empire Status Pro</span>
                      <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider text-amber-900 bg-amber-300">
                        BEST VALUE
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      All-access VIP membership for high-volume traders &amp; official stores.
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 line-through font-bold block leading-none mb-0.5">
                    {formatPrice(10000, 1499)}
                  </span>
                  <span className="text-base font-black text-amber-700">{formatPrice(5000, 700)}</span>
                  <span className="text-[10px] text-slate-400 block font-medium">/ month</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => toggleTierDropdown('premium', e)}
                  className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
                >
                  <span>{expandedTiers['premium'] ? 'Hide VIP benefits' : "What's included (6 VIP perks)"}</span>
                  {expandedTiers['premium'] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <span className="text-[10px] text-amber-700 font-bold">Auto-Renews</span>
              </div>
            </div>

            {expandedTiers['premium'] && (
              <div className="bg-amber-50/70 border-t border-amber-200/70 px-4 py-3 space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 stroke-[2.5]" />
                  <span className="text-slate-800 font-medium">Unlimited Daily Chats (Bypasses the 15 daily chat cap)</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 stroke-[2.5]" />
                  <span className="text-slate-800 font-medium">Verified Gold Crown Badge on your profile &amp; store</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 stroke-[2.5]" />
                  <span className="text-slate-800 font-medium">2 Free Category Spotlight Credits every month (₦2,400 value)</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 stroke-[2.5]" />
                  <span className="text-slate-800 font-medium">Search Priority ranking across discovery feeds</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 stroke-[2.5]" />
                  <span className="text-slate-800 font-medium">Unlimited active listings (no 10-item cap)</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 stroke-[2.5]" />
                  <span className="text-slate-800 font-medium">Direct WhatsApp inquiry button on all your products</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => handleSelectOption(selectedPlan, selectedCurrency)}
          className="w-full py-3.5 bg-gradient-to-r from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>
            Proceed with {selectedPlan === 'premium' ? 'Empire Status' : selectedPlan === 'spotlight_7' ? '7-Day Spotlight' : '3-Day Spotlight'} (
            {selectedPlan === 'premium' ? formatPrice(5000, 700) : selectedPlan === 'spotlight_7' ? formatPrice(1200, 399) : formatPrice(500, 199)})
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Active Modal Popups ── */}
      <SpotlightModal
        isOpen={activeModal === 'spotlight'}
        onClose={() => setActiveModal(null)}
        onSelectOption={handleSelectOption}
      />

      <DistressBoostModal
        isOpen={activeModal === 'distress'}
        onClose={() => setActiveModal(null)}
        onSelectOption={handleSelectOption}
      />

      <ChatLimitModal
        isOpen={activeModal === 'chat_limit'}
        onClose={() => setActiveModal(null)}
        onSelectOption={handleSelectOption}
      />

      <PostLimitModal
        isOpen={activeModal === 'post_limit'}
        onClose={() => setActiveModal(null)}
        onSelectOption={handleSelectOption}
      />

      <OfferLimitModal
        isOpen={activeModal === 'offer_limit'}
        onClose={() => setActiveModal(null)}
        onSelectOption={handleSelectOption}
      />

      <FirstChatModal
        isOpen={activeModal === 'first_chat'}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
}
