'use client';

import Link from 'next/link';
import { Flame, Sparkles, Layers } from 'lucide-react';

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
  return (
    <section className="mb-6">
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide">
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
                className="group flex flex-col items-center gap-2 min-w-[76px] sm:min-w-[86px] p-1.5 sm:p-2 rounded-lg hover:bg-slate-50 transition-all flex-shrink-0 text-center"
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
                    <Flame className="w-6 h-6 text-orange-600 animate-pulse" />
                  ) : item.isBrand ? (
                    <Sparkles className="w-6 h-6 text-amber-600" />
                  ) : (
                    <Layers className="w-5 h-5 text-white" />
                  )}
                </div>

                {/* Category Label */}
                <span
                  className={`text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[80px] transition-colors ${
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
