'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Smartphone,
  Laptop,
  Tv,
  Car,
  Home,
  Shirt,
  Briefcase,
  Layers,
  Flame,
  ShieldCheck,
  PlusCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Tag,
} from 'lucide-react';

interface CategoryItem {
  id?: number | string;
  name: string;
  slug: string;
  icon: any;
  badge?: string;
}

const mainCategories: CategoryItem[] = [
  { name: 'Phones & Tablets', slug: 'mobile-phones-tablets', icon: Smartphone },
  { name: 'Computers & Laptops', slug: 'computers-laptops', icon: Laptop },
  { name: 'Electronics & TVs', slug: 'electronics', icon: Tv },
  { name: 'Vehicles & Autos', slug: 'vehicles', icon: Car },
  { name: 'Real Estate & Property', slug: 'real-estate', icon: Home },
  { name: 'Fashion & Wearables', slug: 'fashion', icon: Shirt },
  { name: 'Jobs & Services', slug: 'services', icon: Briefcase },
  { name: 'Urgent Distress Sales', slug: 'distress', icon: Flame, badge: 'Hot' },
  { name: 'All Categories', slug: 'all', icon: Layers },
];

const promoSlides = [
  {
    id: 1,
    tag: 'PEER-TO-PEER BARTER',
    title: 'Swap What You Have for What You Need',
    subtitle: 'Pure barter & cash-supplement trades with 100% escrow buyer protection.',
    ctaText: 'Start Swapping',
    ctaLink: '/listings',
    secondaryText: 'Post Free Listing',
    secondaryLink: '/sell',
    bgGradient: 'from-blue-700 via-blue-800 to-indigo-950',
    accentColor: 'text-blue-200',
    tagBg: 'bg-blue-500/30 text-blue-200 border-blue-400/30',
  },
  {
    id: 2,
    tag: 'UP TO 50% OFF',
    title: 'Urgent Distress Sales & Fast Cash Deals',
    subtitle: 'Verified sellers offering heavily discounted items for immediate liquidation.',
    ctaText: 'Explore Distress Sales',
    ctaLink: '/distress',
    secondaryText: 'How It Works',
    secondaryLink: '/help',
    bgGradient: 'from-amber-600 via-orange-700 to-rose-950',
    accentColor: 'text-amber-200',
    tagBg: 'bg-amber-500/30 text-amber-200 border-amber-400/30',
  },
  {
    id: 3,
    tag: 'AUTHENTICATED STORES',
    title: 'Verified Brands & Official Merchants',
    subtitle: 'Shop directly from accredited retailers with guaranteed item quality.',
    ctaText: 'Shop Verified Stores',
    ctaLink: '/brand-apply',
    secondaryText: 'Apply as Brand',
    secondaryLink: '/brand-apply',
    bgGradient: 'from-emerald-700 via-teal-800 to-slate-950',
    accentColor: 'text-emerald-200',
    tagBg: 'bg-emerald-500/30 text-emerald-200 border-emerald-400/30',
  },
];

export default function MarketplaceHero() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + promoSlides.length) % promoSlides.length);

  return (
    <section className="mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* ============================================================ */}
        {/* LEFT COLUMN: Vertical Category Menu (Desktop only)           */}
        {/* ============================================================ */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="h-full bg-white border border-slate-200/90 rounded-lg shadow-sm flex flex-col justify-between py-2 overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Categories
              </span>
              <Link href="/listings" className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                View All
              </Link>
            </div>

            <nav className="py-1 flex-1">
              {mainCategories.map((cat, i) => {
                const IconComponent = cat.icon;
                const isDistress = cat.slug === 'distress';
                const href = isDistress
                  ? '/distress'
                  : cat.slug === 'all'
                  ? '/listings'
                  : `/listings?category=${cat.slug}`;

                return (
                  <Link
                    key={i}
                    href={href}
                    className={`group flex items-center justify-between px-4 py-2 text-xs font-medium transition-colors ${
                      isDistress
                        ? 'text-orange-600 hover:bg-orange-50 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <IconComponent
                        className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                          isDistress ? 'text-orange-500' : 'text-slate-400 group-hover:text-blue-600'
                        }`}
                      />
                      <span className="truncate">{cat.name}</span>
                    </div>

                    {cat.badge ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-500 text-white px-1.5 py-0.5 rounded">
                        {cat.badge}
                      </span>
                    ) : (
                      <span className="text-slate-300 group-hover:text-slate-500 text-[10px] font-mono">
                        ›
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="px-3 pt-2 border-t border-slate-100">
              <Link
                href="/brand-apply"
                className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/70 rounded text-[11px] font-semibold text-amber-800 hover:from-amber-100 hover:to-yellow-100 transition-all"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Official Brands Store
                </span>
                <span className="text-[10px] font-bold text-amber-700 font-mono">›</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CENTER COLUMN: High-Impact Promo Carousel Banner            */}
        {/* ============================================================ */}
        <div className="lg:col-span-6 xl:col-span-6">
          <div
            className="relative h-[280px] sm:h-[340px] lg:h-full min-h-[320px] rounded-lg overflow-hidden shadow-sm"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {promoSlides.map((slide, index) => {
              const isActive = index === currentSlide;
              return (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out bg-gradient-to-br ${
                    slide.bgGradient
                  } p-6 sm:p-8 flex flex-col justify-between ${
                    isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  {/* Subtle decorative grid background */}
                  <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none" />

                  {/* Top tag */}
                  <div className="relative z-10">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider border ${slide.tagBg}`}
                    >
                      <Tag className="w-3 h-3" />
                      {slide.tag}
                    </span>
                  </div>

                  {/* Headline & Subtitle */}
                  <div className="relative z-10 max-w-lg">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
                      {slide.title}
                    </h2>
                    <p className={`mt-2 text-xs sm:text-sm font-medium leading-relaxed ${slide.accentColor}`}>
                      {slide.subtitle}
                    </p>
                  </div>

                  {/* CTAs */}
                  <div className="relative z-10 flex items-center gap-3 pt-2">
                    <Link
                      href={slide.ctaLink}
                      className="px-5 py-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm rounded shadow transition-all hover:scale-[1.02]"
                    >
                      {slide.ctaText}
                    </Link>
                    <Link
                      href={slide.secondaryLink}
                      className="px-4 py-2.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-semibold text-xs sm:text-sm rounded border border-white/20 backdrop-blur-sm transition-all"
                    >
                      {slide.secondaryText}
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm transition-all opacity-75 hover:opacity-100"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm transition-all opacity-75 hover:opacity-100"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Slide Pagination Indicator Bars */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
              {promoSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-1.5 rounded-sm transition-all ${
                    i === currentSlide ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Quick Action Cards (Desktop / Tablet)         */}
        {/* ============================================================ */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {/* Card 1: Sell / Swap Quick Card */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-sm flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <PlusCircle className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Fast Listing</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                Sell or Swap in Minutes
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                List unused items for direct cash sale or swap value-for-value.
              </p>
            </div>
            <Link
              href="/sell"
              className="mt-3 block w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold text-center rounded shadow-sm transition-colors"
            >
              Post an Item Free
            </Link>
          </div>

          {/* Card 2: Escrow Protection */}
          <div className="bg-slate-900 text-white rounded-lg p-4 shadow-sm flex flex-col justify-between flex-1 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-10">
              <ShieldCheck className="w-24 h-24 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">100% Secure</span>
              </div>
              <h3 className="text-sm font-bold text-white leading-snug">
                Escrow Trade Protection
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Funds & swaps are held safely until both buyer and seller verify item receipt.
              </p>
            </div>
            <Link
              href="/help"
              className="mt-3 inline-flex items-center text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              How Escrow Works ›
            </Link>
          </div>

          {/* Card 3: Wants Board Quick Card */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 rounded-lg p-3.5 shadow-sm flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                Looking for something specific?
              </p>
              <p className="text-[11px] text-purple-700 mt-0.5">
                Post on the Wants Board and let sellers contact you.
              </p>
            </div>
            <Link
              href="/wants"
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded shadow-sm flex-shrink-0 transition-colors"
            >
              Wants
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
