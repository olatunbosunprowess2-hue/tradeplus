'use client';

import Link from 'next/link';
import {
  Smartphone,
  Laptop,
  Tv,
  Car,
  Home,
  Shirt,
  Flame,
  Briefcase,
  Layers,
  Sparkles,
} from 'lucide-react';

const categories = [
  {
    name: 'Phones & Tablets',
    slug: 'mobile-phones-tablets',
    icon: Smartphone,
  },
  {
    name: 'Computers & Laptops',
    slug: 'computers-laptops',
    icon: Laptop,
  },
  {
    name: 'Electronics & TVs',
    slug: 'electronics',
    icon: Tv,
  },
  {
    name: 'Vehicles & Autos',
    slug: 'vehicles',
    icon: Car,
  },
  {
    name: 'Real Estate & Housing',
    slug: 'real-estate',
    icon: Home,
  },
  {
    name: 'Fashion & Wearables',
    slug: 'fashion',
    icon: Shirt,
  },
  {
    name: 'Distress Sales',
    slug: 'distress',
    icon: Flame,
    isDistress: true,
  },
  {
    name: 'Services & Jobs',
    slug: 'services',
    icon: Briefcase,
  },
  {
    name: 'Official Brands',
    slug: 'brand-apply',
    icon: Sparkles,
  },
  {
    name: 'All Categories',
    slug: 'all',
    icon: Layers,
  },
];

export default function CategoryShortcutBar() {
  return (
    <section className="mb-6">
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((item, i) => {
            const Icon = item.icon;
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
                className="group flex flex-col items-center gap-2 min-w-[76px] sm:min-w-[88px] p-2 rounded-lg hover:bg-slate-50 transition-all flex-shrink-0 text-center"
              >
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg border flex items-center justify-center transition-colors ${
                    item.isDistress
                      ? 'bg-orange-50 border-orange-200 text-orange-600 group-hover:bg-orange-100'
                      : 'bg-slate-50 border-slate-200/90 text-slate-600 group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[11px] font-medium tracking-tight line-clamp-1 transition-colors ${
                    item.isDistress
                      ? 'text-orange-700 font-semibold'
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
