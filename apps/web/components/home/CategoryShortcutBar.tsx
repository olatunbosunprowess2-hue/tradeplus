'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, Sparkles, Layers, ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryItem {
  name: string;
  slug: string;
  image?: string;
  isDistress?: boolean;
  isBrand?: boolean;
  isAll?: boolean;
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
    isDistress: true,
  },
  {
    name: 'Services & Jobs',
    slug: 'services',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Official Brands',
    slug: 'brand-apply',
    isBrand: true,
  },
  {
    name: 'All Categories',
    slug: 'all',
    isAll: true,
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
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === 'left' ? -220 : 220;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <section className="mb-4 sm:mb-6">
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs relative">
        {/* Header Strip with Scroll Hint */}
        <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-100 px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              Browse Categories
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 font-medium sm:hidden">
              Swipe to view more &rarr;
            </span>

            {/* Desktop / Tablet Scroll Chevrons */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                className="w-6 h-6 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-slate-600 transition-colors"
                title="Scroll Left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                className="w-6 h-6 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-slate-600 transition-colors"
                title="Scroll Right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Category Rail with Visible Peek */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-start gap-2.5 sm:gap-3 overflow-x-auto pt-1.5 pb-1 scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
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
                className="group flex flex-col items-center gap-1.5 w-[74px] sm:w-[84px] p-1.5 rounded-lg hover:bg-slate-50 transition-all shrink-0 text-center"
              >
                {/* Thumbnail Box */}
                <div
                  className={`w-12 h-12 sm:w-13 sm:h-13 rounded-lg border overflow-hidden flex items-center justify-center transition-all shadow-2xs group-hover:scale-105 ${
                    item.isDistress
                      ? 'bg-orange-50 border-orange-200 text-orange-600 group-hover:bg-orange-100 group-hover:border-orange-300'
                      : item.isBrand
                      ? 'bg-amber-50 border-amber-200 text-amber-700 group-hover:bg-amber-100 group-hover:border-amber-300'
                      : item.isAll
                      ? 'bg-slate-900 border-slate-900 text-white group-hover:bg-slate-800'
                      : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : item.isDistress ? (
                    <Flame className="w-5 h-5 text-orange-600 animate-pulse" />
                  ) : item.isBrand ? (
                    <Sparkles className="w-5 h-5 text-amber-600" />
                  ) : (
                    <Layers className="w-5 h-5 text-white" />
                  )}
                </div>

                {/* Category Label */}
                <span
                  className={`text-[11px] font-semibold leading-tight line-clamp-2 transition-colors ${
                    item.isDistress
                      ? 'text-orange-700 font-bold'
                      : item.isBrand
                      ? 'text-amber-800 font-bold'
                      : 'text-slate-700 group-hover:text-blue-600'
                  }`}
                >
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
