'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Repeat,
  Flame,
  CheckCircle2,
  X,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

const HERO_STORAGE_KEY = 'barterwave_dismiss_hero_v1';

export default function MarketplaceHero() {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const dismissed = localStorage.getItem(HERO_STORAGE_KEY) === 'true';
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(HERO_STORAGE_KEY, 'true');
    } catch {
      // Ignore localStorage errors (e.g. private browsing)
    }
  };

  const handleRestore = () => {
    setIsDismissed(false);
    try {
      localStorage.removeItem(HERO_STORAGE_KEY);
    } catch {
      // Ignore localStorage errors
    }
  };

  if (!isMounted) {
    return null;
  }

  // Minimized Sleek Marketplace Strip
  if (isDismissed) {
    return (
      <div className="mb-4 bg-white border border-slate-200 rounded-lg px-3.5 sm:px-4 py-2.5 shadow-2xs flex items-center justify-between gap-3 animate-in fade-in duration-300">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded bg-emerald-500 shrink-0" />
          <p className="text-xs font-semibold text-slate-700 truncate">
            <span className="font-bold text-slate-900">Trade What You Have for What You Need</span>
            <span className="hidden sm:inline text-slate-400 mx-2">•</span>
            <span className="hidden sm:inline text-slate-500">100% Escrow Protection</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/distress"
            className="hidden md:inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-md transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Distress Deals</span>
          </Link>

          <button
            onClick={handleRestore}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-all shadow-2xs"
            title="Expand Welcome Banner"
          >
            <span>Show Banner</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Full Expanded Hero Banner
  return (
    <section className="mb-4 sm:mb-6 relative animate-in fade-in duration-300">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs relative">
        {/* Clearly Visible & Styled Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 z-10 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-md transition-all shadow-2xs cursor-pointer"
          title="Minimize Welcome Banner"
          aria-label="Minimize Welcome Banner"
        >
          <X className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Hide Banner</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Main Hero Value Proposition */}
          <div className="lg:col-span-8 p-5 sm:p-7 lg:p-10 flex flex-col justify-between">
            <div className="pr-12 sm:pr-24 lg:pr-0">
              {/* Main Headline */}
              <h1 className="text-xl sm:text-2xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Trade What You Have for What You Need.
              </h1>

              {/* Subheadline */}
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm lg:text-base text-slate-600 font-normal leading-relaxed max-w-2xl">
                Nigeria&apos;s verified marketplace for pure item-for-item swaps, cash-supplemented trades, and urgent distress sales.
              </p>
            </div>

            {/* CTAs and Trust Signals */}
            <div className="mt-5 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5">
                <Link
                  href="/listings/create"
                  className="flex-1 sm:flex-initial justify-center px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-md transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <span>+ Post Free Listing</span>
                </Link>

                <Link
                  href="/distress"
                  className="flex-1 sm:flex-initial justify-center px-3.5 sm:px-4 py-2 sm:py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs sm:text-sm font-semibold rounded-md border border-orange-200/80 transition-colors flex items-center gap-1.5"
                >
                  <Flame className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>Distress Deals</span>
                </Link>
              </div>

              {/* 3-Point Trust Signals */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] sm:text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>100% Escrow</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Item Swaps</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  <span>Verified Traders</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Feature Callouts (Hidden on mobile to save vertical space) */}
          <div className="hidden lg:flex lg:col-span-4 bg-slate-50/80 border-l border-slate-200 p-6 flex-col justify-between gap-4">
            {/* Action Box 1: Distress Liquidation */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  Urgent Sales
                </span>
                <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                  Up to 50% Off
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Fast Cash Liquidation Deals
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Heavily discounted items from verified sellers needing quick cash.
              </p>
              <Link
                href="/distress"
                className="mt-3 inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Browse Distress Deals →
              </Link>
            </div>

            {/* Action Box 2: Wants Board */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Wants Board
                </span>
                <span className="text-[10px] font-medium text-slate-400">Request Item</span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Can&apos;t find what you want?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Post your specific request and let sellers with matching items find you.
              </p>
              <Link
                href="/wants"
                className="mt-3 inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Post on Wants Board →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
