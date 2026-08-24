'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight, Grid } from 'lucide-react';

interface CategoryItem {
  name: string;
  slug: string;
  image: string;
  badge?: string;
  badgeColor?: string;
}

const categories: CategoryItem[] = [
  {
    name: 'Phones & Tablets',
    slug: 'mobile-phones-tablets',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Computers & Laptops',
    slug: 'computers-laptops',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Electronics & TVs',
    slug: 'electronics',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Vehicles & Autos',
    slug: 'vehicles',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Real Estate & Housing',
    slug: 'real-estate',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Fashion & Wearables',
    slug: 'fashion',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Distress Sales',
    slug: 'distress',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=160&auto=format&fit=crop&q=80',
    badge: 'HOT',
    badgeColor: 'bg-orange-600 text-white',
  },
  {
    name: 'Services & Jobs',
    slug: 'services',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Official Brands',
    slug: 'brand-apply',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=160&auto=format&fit=crop&q=80',
    badge: 'OFFICIAL',
    badgeColor: 'bg-blue-600 text-white',
  },
  {
    name: 'All Categories',
    slug: 'all',
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=160&auto=format&fit=crop&q=80',
    badge: 'EXPLORE',
    badgeColor: 'bg-slate-900 text-white',
  },
];

export default function CategoryShortcutBar() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 15);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === 'left' ? -320 : 320;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  return (
    <section className="mb-4 sm:mb-6">
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs relative">
        {/* Header Strip with Direct View All Navigation */}
        <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-100 px-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
              Browse Categories
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* View All Categories Link (Fully Functional) */}
            <Link
              href="/listings"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Desktop / Tablet Scroll Chevrons */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                className="w-6 h-6 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                title="Scroll Left"
                aria-label="Scroll Left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                className="w-6 h-6 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                title="Scroll Right"
                aria-label="Scroll Right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Category Rail with Real Photos & Visible Overflow Peek */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-start gap-2.5 sm:gap-3.5 overflow-x-auto pt-1.5 pb-1 scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
        >
          {categories.map((item, i) => {
            const href =
              item.slug === 'distress'
                ? '/distress'
                : item.slug === 'brand-apply'
                ? '/brand-apply'
                : item.slug === 'all'
                ? '/listings'
                : `/listings?category=${item.slug}`;

            return (
              <Link
                key={i}
                href={href}
                className="group flex flex-col items-center gap-1.5 w-[76px] sm:w-[86px] p-1.5 rounded-lg hover:bg-slate-50 transition-all shrink-0 text-center relative"
              >
                {/* Thumbnail Box with Real High-Res Photography */}
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center transition-all shadow-2xs group-hover:scale-105 group-hover:border-blue-300">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />

                  {/* Micro Badge for special categories */}
                  {item.badge && (
                    <span
                      className={`absolute bottom-0 inset-x-0 text-[8px] font-black uppercase tracking-tighter py-0.2 text-center ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Category Label */}
                <span className="text-[11px] font-semibold leading-tight line-clamp-2 text-slate-700 group-hover:text-blue-600 transition-colors">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
