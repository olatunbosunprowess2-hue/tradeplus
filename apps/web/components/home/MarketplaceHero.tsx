'use client';

import Link from 'next/link';
import {
  ShieldCheck,
  Repeat,
  Flame,
  CheckCircle2,
} from 'lucide-react';

export default function MarketplaceHero() {
  return (
    <section className="mb-6">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Main Hero Value Proposition */}
          <div className="lg:col-span-8 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
            <div>
              {/* Main Headline */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Trade What You Have for What You Need.
              </h1>

              {/* Subheadline */}
              <p className="mt-3 text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-2xl">
                Nigeria&apos;s verified marketplace for pure item-for-item swaps, cash-supplemented trades,
                and urgent distress sales—all backed by 100% escrow buyer protection.
              </p>
            </div>

            {/* CTAs and Trust Bar */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <Link
                  href="/listings/create"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-md transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <span>+ Post Free Listing</span>
                </Link>

                <Link
                  href="/distress"
                  className="px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs sm:text-sm font-semibold rounded-md border border-orange-200/80 transition-colors flex items-center gap-1.5"
                >
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Browse Distress Deals</span>
                </Link>
              </div>

              {/* 3-Point Trust Signals */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>100% Escrow Protection</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Repeat className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Item-for-Item Barter</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-700 flex-shrink-0" />
                  <span>Verified Traders Only</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Feature Callouts */}
          <div className="lg:col-span-4 bg-slate-50/80 border-t lg:border-t-0 lg:border-l border-slate-200 p-6 flex flex-col justify-between gap-4">
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
                Browse Distress Deals
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
                Post on Wants Board
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
