'use client';

import React, { useState } from 'react';
import {
  X,
  Check,
  Zap,
  Star,
  Crown,
  Bell,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  Package,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';

export interface PaywallOption {
  id: string;
  title: string;
  description: string;
  prices: { NGN: number; USD: number };
  originalPrices?: { NGN: number; USD: number };
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  isPrimary?: boolean;
  quickFeatures?: string[];
  detailedBenefits?: string[];
}

export interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  options: PaywallOption[];
  onSelectOption: (optionId: string, currency: 'NGN' | 'USD') => void;
  showPremiumUpsell?: boolean;
  isLoading?: boolean;
  headerGradient?: string;
  creditsAvailable?: number;
  onUseCredit?: (optionId: string) => void;
}

export default function PaywallModal({
  isOpen,
  onClose,
  title,
  subtitle,
  options,
  onSelectOption,
  showPremiumUpsell = true,
  isLoading = false,
  creditsAvailable = 0,
  onUseCredit,
}: PaywallModalProps) {
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  
  // Set default selected option
  const defaultOption = options.find((o) => o.isPrimary)?.id || (options[0]?.id ?? 'premium');
  const [selectedOption, setSelectedOption] = useState<string>(defaultOption);
  
  // Track open dropdown accordions by option id
  const [expandedOptions, setExpandedOptions] = useState<Record<string, boolean>>({
    [defaultOption]: true, // open default option's dropdown initially so user immediately sees benefits
  });

  if (!isOpen) return null;

  const toggleDropdown = (optionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedOptions((prev) => ({
      ...prev,
      [optionId]: !prev[optionId],
    }));
  };

  const handleSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleConfirmPay = () => {
    if (!selectedOption) return;
    onSelectOption(selectedOption, currency);
  };

  const formatPrice = (price: number, curr: 'NGN' | 'USD') => {
    if (price === 0) return 'FREE';
    if (curr === 'NGN') return `₦${price.toLocaleString()}`;
    return `$${(price / 100).toFixed(2)}`;
  };

  // Find currently selected option data (either in options or premium upsell)
  const isSelectedEmpire = selectedOption === 'premium';
  const currentSelectedData = options.find((o) => o.id === selectedOption);
  const selectedPriceText = isSelectedEmpire
    ? currency === 'NGN'
      ? '₦5,000 / mo'
      : '$7.00 / mo'
    : currentSelectedData
    ? formatPrice(currentSelectedData.prices[currency], currency)
    : '';

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto select-none">
      <div className="w-full max-w-xl my-auto bg-white border border-slate-200/90 rounded-2xl shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-[#0F172A]">
        {/* Top Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#22C55E] via-[#16A34A] to-blue-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-20"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 sm:p-7">
          {/* Header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200/80 rounded-md text-[10px] font-black uppercase tracking-wider text-[#16A34A] mb-2">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>MARKETPLACE UPGRADE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mt-1 leading-relaxed font-medium">
                {subtitle}
              </p>
            )}

            {/* Currency Toggle */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 inline-flex items-center">
                <button
                  type="button"
                  onClick={() => setCurrency('NGN')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                    currency === 'NGN'
                      ? 'bg-white text-[#0F172A] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🇳🇬 NGN (₦)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                    currency === 'USD'
                      ? 'bg-white text-[#0F172A] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🇺🇸 USD ($)
                </button>
              </div>
            </div>

            {/* Spotlight Credits Available Notice */}
            {creditsAvailable > 0 && onUseCredit && (
              <div className="mt-3.5 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between gap-2 text-left">
                <div className="flex items-center gap-2 min-w-0">
                  <Star className="w-4 h-4 text-emerald-600 shrink-0 fill-current" />
                  <span className="text-xs font-bold text-emerald-950 truncate">
                    You have <strong className="text-emerald-700">{creditsAvailable} free credit(s)</strong> available!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onUseCredit(options[0]?.id || 'spotlight_3')}
                  className="px-2.5 py-1 bg-[#16A34A] hover:bg-[#15803D] text-white text-[10px] font-black uppercase tracking-wider rounded-lg shrink-0 transition-colors shadow-2xs"
                >
                  Apply Free
                </button>
              </div>
            )}
          </div>

          {/* Vertical Stacked Subscription & Pricing Cards */}
          <div className="space-y-3 mb-6">
            {options.map((option) => {
              const isSelected = selectedOption === option.id;
              const isExpanded = !!expandedOptions[option.id];
              const benefits = option.detailedBenefits || option.quickFeatures || [];

              return (
                <div
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`border rounded-2xl transition-all cursor-pointer overflow-hidden ${
                    isSelected
                      ? 'border-[#16A34A] ring-2 ring-[#16A34A]/20 bg-emerald-50/20 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40'
                  }`}
                >
                  {/* Card Header Row */}
                  <div className="p-3.5 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Radio Selector + Title & Summary */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'border-[#16A34A] bg-[#16A34A]'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="font-black text-sm text-[#0F172A] leading-tight">
                              {option.title}
                            </span>
                            {option.badge && (
                              <span
                                className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider text-white shrink-0 ${
                                  option.badgeColor || 'bg-[#16A34A]'
                                }`}
                              >
                                {option.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium leading-snug">
                            {option.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: Price */}
                      <div className="text-right shrink-0">
                        {option.originalPrices && (
                          <span className="text-[10px] text-slate-400 line-through font-bold block leading-none mb-0.5">
                            {formatPrice(option.originalPrices[currency], currency)}
                          </span>
                        )}
                        <span className="text-base sm:text-lg font-black text-[#0F172A] leading-none">
                          {formatPrice(option.prices[currency], currency)}
                        </span>
                      </div>
                    </div>

                    {/* Dropdown Accordion Toggle Button */}
                    {benefits.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => toggleDropdown(option.id, e)}
                          className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors group"
                        >
                          <span className="text-[#16A34A] font-extrabold group-hover:underline">
                            {isExpanded ? 'Hide benefits' : `What's included (${benefits.length} benefits)`}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-[#16A34A]" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-[#16A34A]" />
                          )}
                        </button>

                        <span className="text-[10px] text-slate-400 font-semibold">
                          Instant Activation
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dropdown Content (Expanded Benefits View) */}
                  {isExpanded && benefits.length > 0 && (
                    <div className="bg-slate-50/80 border-t border-slate-100 px-4 py-3 space-y-2 text-xs">
                      {benefits.map((b, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5 stroke-[2.5]" />
                          <span className="font-medium text-slate-700 leading-snug">{b}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empire Status Pro Upsell Card (Vertical Flagship) */}
            {showPremiumUpsell && (
              <div
                onClick={() => handleSelect('premium')}
                className={`border rounded-2xl transition-all cursor-pointer overflow-hidden ${
                  isSelectedEmpire
                    ? 'border-amber-400 ring-2 ring-amber-400/25 bg-amber-50/20 shadow-sm'
                    : 'border-amber-200/90 bg-gradient-to-br from-amber-50/10 to-orange-50/10 hover:border-amber-300'
                }`}
              >
                <div className="p-3.5 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                          isSelectedEmpire
                            ? 'border-amber-500 bg-amber-500'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelectedEmpire && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />
                          <span className="font-black text-sm text-[#0F172A] leading-tight">
                            Empire Status Pro
                          </span>
                          <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider text-amber-900 bg-amber-300 shrink-0">
                            BEST VALUE
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-snug">
                          All-access VIP membership for serious merchants & high-volume traders.
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 line-through font-bold block leading-none mb-0.5">
                        {currency === 'NGN' ? '₦10,000' : '$14.99'}
                      </span>
                      <span className="text-base sm:text-lg font-black text-amber-700 leading-none">
                        {currency === 'NGN' ? '₦5,000' : '$7.00'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold block">/month</span>
                    </div>
                  </div>

                  {/* Dropdown Toggle */}
                  <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => toggleDropdown('premium', e)}
                      className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 transition-colors group"
                    >
                      <span className="font-extrabold group-hover:underline">
                        {expandedOptions['premium']
                          ? 'Hide VIP privileges'
                          : "What's included in Empire (6 VIP benefits)"}
                      </span>
                      {expandedOptions['premium'] ? (
                        <ChevronUp className="w-3.5 h-3.5 text-amber-700" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-amber-700" />
                      )}
                    </button>

                    <span className="text-[10px] text-amber-700 font-bold">
                      Renews Monthly
                    </span>
                  </div>
                </div>

                {/* Empire Dropdown Benefits */}
                {expandedOptions['premium'] && (
                  <div className="bg-amber-50/60 border-t border-amber-200/70 px-4 py-3 space-y-2 text-xs">
                    {[
                      'Unlimited Daily Chats — Bypass the 15 daily chat limit completely',
                      'Verified Gold Crown Badge displayed on your store & all listings',
                      '2 Free Category Spotlight Credits included every month (₦2,400 value)',
                      'Search Priority — Appear at the very top of buyer search results',
                      'Unlimited Active Listings — No 10-item cap',
                      'Direct WhatsApp Inquiry Button on all your products',
                    ].map((b, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 stroke-[2.5]" />
                        <span className="font-medium text-slate-800 leading-snug">{b}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Action Button */}
          <div className="space-y-2.5">
            <button
              disabled={isLoading || !selectedOption}
              onClick={handleConfirmPay}
              className="w-full py-3.5 bg-gradient-to-r from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] disabled:opacity-40 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting to Paystack...</span>
                </>
              ) : (
                <>
                  <span>
                    Proceed with {isSelectedEmpire ? 'Empire Status' : currentSelectedData?.title || 'Selected Plan'}{' '}
                    {selectedPriceText ? `(${selectedPriceText})` : ''}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 text-xs font-bold hover:text-slate-600 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Specific Modal Variants ──

export function ChatLimitModal({
  isOpen,
  onClose,
  onSelectOption,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (type: string, currency: 'NGN' | 'USD') => void;
  isLoading?: boolean;
}) {
  return (
    <PaywallModal
      isOpen={isOpen}
      onClose={onClose}
      title="Unlock Unlimited Trading"
      subtitle="You've reached your free daily limit of 15 new chats. Upgrade to Empire Status to chat with unlimited buyers and sellers."
      options={[]}
      onSelectOption={onSelectOption}
      showPremiumUpsell={true}
      isLoading={isLoading}
    />
  );
}

export function DistressBoostModal({
  isOpen,
  onClose,
  onSelectOption,
  isPremium = false,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (type: string, currency: 'NGN' | 'USD') => void;
  isPremium?: boolean;
  isLoading?: boolean;
}) {
  return (
    <PaywallModal
      isOpen={isOpen}
      onClose={onClose}
      title="Liquidate & Sell Today"
      subtitle="Don't let your urgent distress deal get buried. Broadcast your item directly to active buyers looking to seal quick deals."
      options={[
        {
          id: 'aggressive_boost',
          title: 'Distress Fast-Track Broadcast',
          description: 'Ping the 10 most active buyers in your city searching for items like yours right now.',
          prices: { NGN: 0, USD: 0 },
          icon: <Bell className="w-5 h-5" />,
          isPrimary: true,
          badge: 'FREE PROMO',
          badgeColor: 'bg-[#16A34A]',
          quickFeatures: ['Smart Pings', 'In-City Only', 'Instant Alerts'],
          detailedBenefits: [
            'Proprietary smart targeting alerts the top 10 users searching for items in your category',
            'Filters strictly for buyers in your local city for immediate physical pickup',
            'Pins your listing to the dedicated Distress Liquidation Hub',
            'Instant WhatsApp notification alerts to high-intent buyers',
          ],
        },
      ]}
      onSelectOption={onSelectOption}
      showPremiumUpsell={!isPremium}
      isLoading={isLoading}
    />
  );
}

export function SpotlightModal({
  isOpen,
  onClose,
  onSelectOption,
  onUseCredit,
  creditsAvailable = 0,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (type: string, currency: 'NGN' | 'USD') => void;
  onUseCredit?: (optionId: string) => void;
  creditsAvailable?: number;
  isLoading?: boolean;
}) {
  return (
    <PaywallModal
      isOpen={isOpen}
      onClose={onClose}
      title="Sell 3x Faster with Spotlight"
      subtitle="Put your item at the very top of search feeds and category pages so verified buyers see your deal first."
      options={[
        {
          id: 'spotlight_3',
          title: 'Spotlight — 3 Days',
          description: 'Fix your listing at the top of its category for a 72-hour visibility peak.',
          prices: { NGN: 500, USD: 199 },
          icon: <Star className="w-5 h-5 fill-current" />,
          badge: 'IMPULSE BUY',
          badgeColor: 'bg-[#22C55E]',
          quickFeatures: ['Top spot', '3x views'],
          detailedBenefits: [
            'Category-specific featured placement above regular listings',
            '3x more clicks and offer proposals from local buyers',
            'Ideal for fast electronics, sneakers, and gadget exchanges',
            '⚡ Days stack automatically if purchased multiple times',
          ],
        },
        {
          id: 'spotlight_7',
          title: 'Spotlight — 7 Days',
          description: 'Own the category top slot for a full week. Perfect for phones, laptops, and vehicles.',
          prices: { NGN: 1200, USD: 399 },
          originalPrices: { NGN: 2500, USD: 699 },
          icon: <TrendingUp className="w-5 h-5" />,
          isPrimary: true,
          badge: 'MOST POPULAR',
          badgeColor: 'bg-[#1D4ED8]',
          quickFeatures: ['One full week', '5x views', 'Featured Tag'],
          detailedBenefits: [
            'Fixed rotating category & search results top carousel placement',
            'Extended 7-day visibility peak for high-value negotiations',
            'Boosts trader credibility with prominent verified "Featured" badge',
            '5x higher deal conclusion rate',
            '⚡ Days stack automatically if renewed',
          ],
        },
      ]}
      onSelectOption={onSelectOption}
      onUseCredit={onUseCredit}
      creditsAvailable={creditsAvailable}
      showPremiumUpsell={true}
      isLoading={isLoading}
    />
  );
}

export function PostLimitModal({
  isOpen,
  onClose,
  onSelectOption,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (type: string, currency: 'NGN' | 'USD') => void;
  isLoading?: boolean;
}) {
  return (
    <PaywallModal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Post Limit Reached"
      subtitle="You've reached the 50 daily community post limit. Upgrade to Empire Status to post without volume restrictions."
      options={[]}
      onSelectOption={onSelectOption}
      showPremiumUpsell={true}
      isLoading={isLoading}
    />
  );
}

export function OfferLimitModal({
  isOpen,
  onClose,
  onSelectOption,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (type: string, currency: 'NGN' | 'USD') => void;
  isLoading?: boolean;
}) {
  return (
    <PaywallModal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Offer Limit Reached"
      subtitle="To prevent network spam, free users can propose up to 5 offers per day. Upgrade to Empire Status for unlimited trade offers."
      options={[]}
      onSelectOption={onSelectOption}
      showPremiumUpsell={true}
      isLoading={isLoading}
    />
  );
}

export function FirstChatModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md my-auto bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-6 text-[#0F172A] animate-in fade-in zoom-in-95 duration-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#16A34A] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-black text-[#0F172A] tracking-tight">
            Safe P2P Trading Guide
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Welcome to BarterWave! Keep these 3 golden rules in mind before meeting:
          </p>
        </div>

        <div className="space-y-3 mb-6 bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-[#16A34A] flex items-center justify-center font-black text-[10px] shrink-0">
              1
            </span>
            <p className="text-slate-700 font-medium">
              <strong className="text-slate-900">Meet in Daylight:</strong> Always meet in public, busy places (malls, banks, eateries).
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-[#16A34A] flex items-center justify-center font-black text-[10px] shrink-0">
              2
            </span>
            <p className="text-slate-700 font-medium">
              <strong className="text-slate-900">Inspect First:</strong> Test phone battery, IMEI, condition, or cash before revealing your PIN.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-[#16A34A] flex items-center justify-center font-black text-[10px] shrink-0">
              3
            </span>
            <p className="text-slate-700 font-medium">
              <strong className="text-slate-900">Exchange Code:</strong> Hand over your 6-digit code only once satisfied with the trade.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
        >
          I Understand &amp; Agree
        </button>
      </div>
    </div>
  );
}
