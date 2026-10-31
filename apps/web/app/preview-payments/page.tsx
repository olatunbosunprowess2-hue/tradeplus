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
} from 'lucide-react';

export default function PreviewPaymentsPage() {
  // Modal toggle states
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [selectedPlan, setSelectedPlan] = useState<string>('spotlight_7');

  const formatPrice = (ngn: number, usd: number) => {
    return selectedCurrency === 'NGN' ? `₦${ngn.toLocaleString()}` : `$${(usd / 100).toFixed(2)}`;
  };

  const handleSelectOption = (optionId: string, currency: 'NGN' | 'USD') => {
    alert(`[PREVIEW MODE] Selected Plan: ${optionId} in ${currency}. In live mode, this redirects to Paystack Checkout!`);
    setActiveModal(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Header Bar */}
      <div className="max-w-6xl mx-auto mb-10 pb-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-blue-900/60 text-blue-300 border border-blue-700/60 rounded text-[10px] font-bold uppercase tracking-wider">
              INTERNAL AUDIT & PREVIEW
            </span>
            <span className="px-2 py-0.5 bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 rounded text-[10px] font-bold uppercase tracking-wider">
              P2P MONETIZATION ACTIVE
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Payment & Paywall System Studio</h1>
          <p className="text-sm text-slate-400 mt-1">
            Now that Escrow is off, all payments are direct platform revenue (Listing Spotlights, Urgent Distress Boosts, & Empire Subscriptions via Paystack).
          </p>
        </div>

        <Link
          href="/"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>← Back to Marketplace</span>
        </Link>
      </div>

      {/* 1. Modal Trigger Directory Grid */}
      <div className="max-w-6xl mx-auto mb-16">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#60A5FA]" />
          <span>Interactive Modal Triggers (Click to Launch Exact Live Modal)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Listing Spotlight */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded text-[9px] font-bold uppercase tracking-wider">
                  PRIMARY REVENUE
                </span>
                <span className="text-xs font-bold text-slate-300">₦500 – ₦1,200</span>
              </div>
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Listing Spotlight Modal</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                <strong className="text-slate-300">Trigger:</strong> When a seller clicks &quot;Boost Ad&quot; on their listing in <em>My Listings</em> or toggles spotlight during ad creation.
              </p>
            </div>
            <button
              onClick={() => setActiveModal('spotlight')}
              className="w-full py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Test Spotlight Modal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Distress Boost */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-1.5 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded text-[9px] font-bold uppercase tracking-wider">
                  LIQUIDATION
                </span>
                <span className="text-xs font-bold text-slate-300">Free Trial / Promo</span>
              </div>
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Distress Fast-Track Boost</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                <strong className="text-slate-300">Trigger:</strong> When sellers mark an item as a distress sale and request smart notifications to ping nearby buyers.
              </p>
            </div>
            <button
              onClick={() => setActiveModal('distress')}
              className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Test Distress Modal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Chat Limit */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded text-[9px] font-bold uppercase tracking-wider">
                  USAGE PAYWALL
                </span>
                <span className="text-xs font-bold text-slate-300">₦5,000 / mo</span>
              </div>
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Chat Limit Paywall</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                <strong className="text-slate-300">Trigger:</strong> When a non-paying user initiates their 16th chat conversation across the marketplace.
              </p>
            </div>
            <button
              onClick={() => setActiveModal('chat_limit')}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Test Chat Limit Modal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 4: Post Limit */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-1.5 py-0.5 bg-slate-500/10 text-slate-400 border border-slate-500/30 rounded text-[9px] font-bold uppercase tracking-wider">
                  VOLUME LIMIT
                </span>
                <span className="text-xs font-bold text-slate-300">50 Posts Max</span>
              </div>
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#60A5FA] shrink-0" />
                <span>Daily Post Limit Modal</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                <strong className="text-slate-300">Trigger:</strong> When high-volume power sellers post over 50 items in a single 24-hour window.
              </p>
            </div>
            <button
              onClick={() => setActiveModal('post_limit')}
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Test Post Limit Modal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 5: Offer Limit */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded text-[9px] font-bold uppercase tracking-wider">
                  SPAM DEFENSE
                </span>
                <span className="text-xs font-bold text-slate-300">5 Offers / Day</span>
              </div>
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Daily Offer Limit Modal</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                <strong className="text-slate-300">Trigger:</strong> When a user makes more than 5 trade proposals in a single day without completing them.
              </p>
            </div>
            <button
              onClick={() => setActiveModal('offer_limit')}
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Test Offer Limit Modal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 6: First Chat Safety */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-[#4ADE80] border border-emerald-500/30 rounded text-[9px] font-bold uppercase tracking-wider">
                  SAFETY ONBOARDING
                </span>
                <span className="text-xs font-bold text-[#4ADE80]">1-Time Popup</span>
              </div>
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#4ADE80] shrink-0" />
                <span>First-Chat Safety Modal</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                <strong className="text-slate-300">Trigger:</strong> When a newly registered user opens their very first chat with any seller.
              </p>
            </div>
            <button
              onClick={() => setActiveModal('first_chat')}
              className="w-full py-2 bg-emerald-700 hover:bg-[#16A34A] text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Test Safety Modal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Embedded In-Place Live Replica */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>In-Place Live Inspection (Exact Replica of Spotlight & Empire Tiers)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review geometry, micro-badges, and typography directly on this canvas without opening a pop-up.
            </p>
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 border border-slate-800 rounded self-start sm:self-auto">
            <button
              onClick={() => setSelectedCurrency('NGN')}
              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                selectedCurrency === 'NGN' ? 'bg-[#1D4ED8] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🇳🇬 NGN (₦)
            </button>
            <button
              onClick={() => setSelectedCurrency('USD')}
              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                selectedCurrency === 'USD' ? 'bg-[#1D4ED8] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🇺🇸 USD ($)
            </button>
          </div>
        </div>

        {/* The 3-Tier Pricing Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tier 1: 3-Day Spotlight */}
          <div
            onClick={() => setSelectedPlan('spotlight_3')}
            className={`border rounded-xl p-6 flex flex-col justify-between transition-all cursor-pointer ${
              selectedPlan === 'spotlight_3'
                ? 'bg-slate-900 border-blue-500 shadow-lg shadow-blue-900/20 ring-1 ring-blue-500'
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-1.5 py-0.5 bg-emerald-950 text-[#4ADE80] border border-emerald-800 rounded text-[9px] font-bold uppercase tracking-wider">
                  IMPULSE BUY
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">3 Days Run</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Spotlight (3 Days)</h3>
              <p className="text-xs text-slate-400 mb-5">Fix your ad at the top of its category for a 72-hour visibility peak.</p>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white tracking-tight">
                    {formatPrice(500, 199)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">flat</span>
                </div>
                <span className="text-[10px] text-slate-500">Stacks if purchased multiple times</span>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#60A5FA] shrink-0" />
                  <span>Category-specific featured top slot</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#60A5FA] shrink-0" />
                  <span>3x more clicks than regular ads</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#60A5FA] shrink-0" />
                  <span>Instant Paystack card / transfer pay</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSelectOption('spotlight_3', selectedCurrency)}
              className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded transition-colors"
            >
              Select 3-Day Pass
            </button>
          </div>

          {/* Tier 2: 7-Day Spotlight (Recommended / Most Popular) */}
          <div
            onClick={() => setSelectedPlan('spotlight_7')}
            className={`border rounded-xl p-6 flex flex-col justify-between transition-all cursor-pointer relative ${
              selectedPlan === 'spotlight_7'
                ? 'bg-slate-900 border-blue-500 shadow-xl shadow-blue-900/30 ring-2 ring-blue-500'
                : 'bg-slate-900/80 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-1.5 py-0.5 bg-[#1D4ED8] text-white rounded text-[9px] font-bold uppercase tracking-wider">
                  ★ MOST POPULAR
                </span>
                <span className="text-[11px] text-[#60A5FA] font-bold">Best For Cars & Phones</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#60A5FA]" />
                <span>Spotlight (7 Days)</span>
              </h3>
              <p className="text-xs text-slate-400 mb-5">Own the homepage and category carousel for an entire week.</p>

              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 line-through font-bold">
                    {formatPrice(4000, 1299)}
                  </span>
                  <span className="px-1.5 py-0.2 bg-emerald-950 text-[#4ADE80] border border-emerald-800 rounded text-[9px] font-bold">
                    SAVE 70%
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-white tracking-tight">
                    {formatPrice(1200, 399)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ week</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#60A5FA] shrink-0" />
                  <span>Fixed homepage rotating carousel</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#60A5FA] shrink-0" />
                  <span>Verified Featured Listing badge</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#60A5FA] shrink-0" />
                  <span>5x more inquiries & offers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#60A5FA] shrink-0" />
                  <span>Days stack if renewed</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSelectOption('spotlight_7', selectedCurrency)}
              className="mt-6 w-full py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-xs rounded transition-colors shadow-sm"
            >
              Select 7-Day Pass
            </button>
          </div>

          {/* Tier 3: Empire Status (Monthly Subscription) */}
          <div
            onClick={() => setSelectedPlan('premium')}
            className={`border rounded-xl p-6 flex flex-col justify-between transition-all cursor-pointer ${
              selectedPlan === 'premium'
                ? 'bg-slate-900 border-amber-500 shadow-xl shadow-amber-900/20 ring-1 ring-amber-500'
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[9px] font-bold uppercase tracking-wider">
                  POWER TRADER
                </span>
                <span className="text-[11px] text-amber-400 font-bold">All-Inclusive</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Empire Status</span>
              </h3>
              <p className="text-xs text-slate-400 mb-5">Unlimited privileges for merchants, verified traders, and brands.</p>

              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 line-through font-bold">
                    {selectedCurrency === 'NGN' ? '₦10,000' : '$14.99'}
                  </span>
                  <span className="px-1.5 py-0.2 bg-amber-950 text-amber-400 border border-amber-800 rounded text-[9px] font-bold">
                    50% OFF
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-amber-400 tracking-tight">
                    {formatPrice(5000, 700)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ month</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Unlimited Listings & Free Renewals</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Unlimited In-App Chats</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Verified Crown Profile Badge</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>50% off all individual spotlights</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSelectOption('premium', selectedCurrency)}
              className="mt-6 w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs rounded transition-colors"
            >
              Upgrade to Empire
            </button>
          </div>
        </div>
      </div>

      {/* 3. Live Active Popups Container */}
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
