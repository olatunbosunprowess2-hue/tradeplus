'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api-client';
import {
  Smartphone,
  Laptop,
  Tv,
  Car,
  Building2,
  Shirt,
  Briefcase,
  Flame,
  Sparkles,
  Search,
  X,
  ChevronRight,
  Package,
  Layers,
  ArrowRight,
  Check,
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

interface CategoryDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Category visual images
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

export default function CategoryDirectoryModal({ isOpen, onClose }: CategoryDirectoryModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const currentCategoryId = searchParams.get('categoryId') || '';

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get<Category[]>('/categories');
      return res.data;
    },
    enabled: isOpen,
  });

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  if (!isOpen) return null;

  const handleSelectCategory = (categoryId?: number | string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!categoryId) {
      params.delete('categoryId');
    } else {
      params.set('categoryId', String(categoryId));
    }
    params.delete('page');
    router.push(`/?${params.toString()}`, { scroll: false });
    onClose();

    // Scroll smoothly to the feed
    setTimeout(() => {
      const feedEl = document.getElementById('marketplace-listings-heading');
      if (feedEl) {
        feedEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-[10060] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              All Marketplace Categories
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any department to filter verified goods, barters, and liquidation deals.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Search Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-100 shrink-0">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 20+ departments (e.g. Phones, Cars, Real Estate, Fashion)..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-2xs"
              autoFocus
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Special Highlights Bar */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0 text-xs">
          <button
            onClick={() => handleSelectCategory('')}
            className={`px-3 py-1 rounded-md font-bold text-xs shrink-0 transition-colors border ${
              currentCategoryId === ''
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            All Products &amp; Swaps
          </button>

          <Link
            href="/distress"
            onClick={onClose}
            className="px-3 py-1 rounded-md font-bold text-xs shrink-0 bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors flex items-center gap-1"
          >
            <Flame className="w-3.5 h-3.5 text-orange-600" />
            <span>Distress Sales</span>
          </Link>

          <Link
            href="/brand-apply"
            onClick={onClose}
            className="px-3 py-1 rounded-md font-bold text-xs shrink-0 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Official Brands</span>
          </Link>
        </div>

        {/* Categories Directory Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-50 border border-slate-100 rounded-lg animate-pulse flex items-center gap-3"
                >
                  <div className="w-12 h-12 bg-slate-200 rounded-md shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-slate-200 rounded w-2/3" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No categories found</p>
              <p className="text-xs text-slate-400 mt-0.5">Try searching with different keywords.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredCategories.map((cat) => {
                const isSelected = String(cat.id) === currentCategoryId;
                const visualImage =
                  categoryVisualMap[cat.slug] ||
                  'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=160&auto=format&fit=crop&q=80';

                return (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left group cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="relative w-11 h-11 rounded-md overflow-hidden border border-slate-200 shrink-0 shadow-2xs">
                      <img
                        src={visualImage}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs sm:text-sm font-bold truncate ${
                          isSelected ? 'text-blue-700' : 'text-slate-900 group-hover:text-blue-600'
                        }`}
                      >
                        {cat.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        Browse listings &amp; barter deals
                      </p>
                    </div>

                    <div className="shrink-0 text-slate-400 group-hover:text-blue-600">
                      {isSelected ? (
                        <span className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center text-xs">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={() => handleSelectCategory('')}
            className="text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            Clear Category Filter
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-md shadow-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
