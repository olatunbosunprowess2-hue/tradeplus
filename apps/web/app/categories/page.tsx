'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import {
  Search,
  Package,
  ChevronRight,
  Flame,
  Sparkles,
  ArrowLeft,
  LayoutGrid,
} from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  _count?: {
    listings?: number;
  };
}

const categoryVisualMap: Record<string, string> = {
  'mobile-phones': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=160&auto=format&fit=crop&q=80',
  'mobile-phones-tablets': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=160&auto=format&fit=crop&q=80',
  'computers': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=160&auto=format&fit=crop&q=80',
  'computers-laptops': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=160&auto=format&fit=crop&q=80',
  'electronics': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=160&auto=format&fit=crop&q=80',
  'vehicles': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=160&auto=format&fit=crop&q=80',
  'real-estate': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=160&auto=format&fit=crop&q=80',
  'fashion': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=160&auto=format&fit=crop&q=80',
  'services': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=160&auto=format&fit=crop&q=80',
  'jobs': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=160&auto=format&fit=crop&q=80',
  'home-garden': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=160&auto=format&fit=crop&q=80',
  'beauty': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=160&auto=format&fit=crop&q=80',
  'gaming': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=160&auto=format&fit=crop&q=80',
  'sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=160&auto=format&fit=crop&q=80',
};

export default function CategoriesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get<Category[]>('/categories');
      return res.data;
    },
  });

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-4 sm:pt-6">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#2563EB] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Marketplace</span>
          </Link>
        </div>

        {/* Header Hero */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7 shadow-xs mb-6">
          <div className="flex items-center gap-2 mb-2">
            <LayoutGrid className="w-5 h-5 text-[#2563EB]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Directory
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Browse All Marketplace Categories
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Explore every verified department in Nigeria. Select a category to find item swaps, cash deals, and urgent distress liquidation offers.
          </p>

          {/* Search Bar */}
          <div className="mt-5 relative max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 20+ departments..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] focus:bg-white transition-all shadow-2xs"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Special Collections Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Link
            href="/distress"
            className="bg-orange-50/80 border border-orange-200 hover:border-orange-300 rounded-xl p-4 flex items-center gap-3.5 transition-all shadow-xs group"
          >
            <div className="w-12 h-12 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 bg-orange-100 border border-orange-200 px-1.5 py-0.2 rounded">
                Distress Deals
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1">Urgent Liquidation Sales</h3>
              <p className="text-xs text-slate-500">Heavily discounted items for instant cash.</p>
            </div>
          </Link>

          <Link
            href="/brand-apply"
            className="bg-[#EFF6FF]/80 border border-[#BFDBFE] hover:border-blue-300 rounded-xl p-4 flex items-center gap-3.5 transition-all shadow-xs group"
          >
            <div className="w-12 h-12 rounded-lg bg-[#1D4ED8] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1D4ED8] bg-[#DBEAFE] border border-[#BFDBFE] px-1.5 py-0.2 rounded">
                Official Brands
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1">Verified Brand Stores</h3>
              <p className="text-xs text-slate-500">Official manufacturers &amp; verified merchants.</p>
            </div>
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              All Departments ({filteredCategories.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-lg animate-pulse h-20" />
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No matching categories found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredCategories.map((cat) => {
                const visualImage =
                  categoryVisualMap[cat.slug] ||
                  'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=160&auto=format&fit=crop&q=80';

                return (
                  <Link
                    key={cat.id}
                    href={`/?categoryId=${cat.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-[#3B82F6] hover:bg-[#EFF6FF]/40 transition-all group"
                  >
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 shadow-2xs">
                      <img
                        src={visualImage}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#2563EB] truncate">
                        {cat.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Explore deals →</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#2563EB] shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
