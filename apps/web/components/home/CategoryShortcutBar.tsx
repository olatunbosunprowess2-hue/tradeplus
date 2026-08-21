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
  ShoppingBag,
} from 'lucide-react';

const shortcuts = [
  {
    name: 'Phones',
    slug: 'mobile-phones-tablets',
    icon: Smartphone,
    color: 'bg-blue-50 text-blue-600 border-blue-200/60 hover:bg-blue-100',
  },
  {
    name: 'Laptops',
    slug: 'computers-laptops',
    icon: Laptop,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200/60 hover:bg-indigo-100',
  },
  {
    name: 'Appliances',
    slug: 'electronics',
    icon: Tv,
    color: 'bg-cyan-50 text-cyan-600 border-cyan-200/60 hover:bg-cyan-100',
  },
  {
    name: 'Vehicles',
    slug: 'vehicles',
    icon: Car,
    color: 'bg-amber-50 text-amber-600 border-amber-200/60 hover:bg-amber-100',
  },
  {
    name: 'Real Estate',
    slug: 'real-estate',
    icon: Home,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200/60 hover:bg-emerald-100',
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    icon: Shirt,
    color: 'bg-rose-50 text-rose-600 border-rose-200/60 hover:bg-rose-100',
  },
  {
    name: 'Distress Deals',
    slug: 'distress',
    icon: Flame,
    color: 'bg-orange-50 text-orange-600 border-orange-200/80 hover:bg-orange-100',
    highlight: true,
  },
  {
    name: 'Official Brands',
    slug: 'brand-apply',
    icon: Sparkles,
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200/80 hover:bg-yellow-100',
  },
  {
    name: 'Services',
    slug: 'services',
    icon: Briefcase,
    color: 'bg-purple-50 text-purple-600 border-purple-200/60 hover:bg-purple-100',
  },
  {
    name: 'All Items',
    slug: 'all',
    icon: Layers,
    color: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
  },
];

export default function CategoryShortcutBar() {
  return (
    <section className="mb-6">
      <div className="bg-white border border-slate-200/90 rounded-lg p-3 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {shortcuts.map((item, i) => {
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
                className="group flex flex-col items-center gap-1.5 min-w-[72px] sm:min-w-[84px] p-1.5 rounded-lg hover:bg-slate-50 transition-all flex-shrink-0 text-center"
              >
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-lg border flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xs ${item.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 group-hover:text-blue-600 tracking-tight line-clamp-1">
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
