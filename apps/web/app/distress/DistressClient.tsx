'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import type { Listing, PaginatedResponse } from '@/lib/types';
import ListingCard from '@/components/ListingCard';
import { ListingsGridSkeleton } from '@/components/ui/Skeleton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import SearchFilters from '@/components/SearchFilters';
import { Flame, ShieldCheck, Tag, PlusCircle } from 'lucide-react';
import Link from 'next/link';

// Debounce hook for live search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function DistressClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || undefined;
  const condition = searchParams.get('condition') || undefined;
  const paymentMode = searchParams.get('paymentMode') || undefined;
  const minPrice = searchParams.get('minPrice') || undefined;
  const maxPrice = searchParams.get('maxPrice') || undefined;
  const categoryId = searchParams.get('categoryId') || searchParams.get('category') || undefined;
  const countryId = searchParams.get('countryId') || undefined;
  const regionId = searchParams.get('regionId') || undefined;

  const { ref, inView } = useInView();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(search);

  // Debounce search for 300ms for live search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Update URL when debounced search changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch.trim()) {
      params.set('search', debouncedSearch.trim());
    } else {
      params.delete('search');
    }

    const newSearch = params.get('search') || '';
    if (newSearch !== search) {
      router.push(`/distress?${params.toString()}`, { scroll: false });
    }
  }, [debouncedSearch]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    isFetching,
  } = useInfiniteQuery({
    queryKey: [
      'distress-listings',
      search,
      type,
      condition,
      paymentMode,
      minPrice,
      maxPrice,
      categoryId,
      countryId,
      regionId,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        page: pageParam,
        limit: 12,
        search,
        type,
        condition,
        paymentMode,
        minPrice,
        maxPrice,
        categoryId,
        countryId,
        regionId,
        isDistressSale: 'true', // Force distress sale filter
      };
      const response = await apiClient.get<PaginatedResponse<Listing>>('/listings', { params });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  // Sync search input with URL params
  useEffect(() => {
    if (search !== searchQuery && search !== debouncedSearch) {
      setSearchQuery(search);
    }
  }, [search]);

  const handleClearSearch = () => {
    setSearchQuery('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    router.replace(`/distress?${params.toString()}`, { scroll: false });
  };

  const listings = data?.pages.flatMap((page) => page.data) || [];
  const isLoading = status === 'pending';

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="container mx-auto px-4 max-w-7xl pt-4">
        {/* ============================================================ */}
        {/* Clean, Refined Header Card                                   */}
        {/* ============================================================ */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7 shadow-xs mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-600 flex-shrink-0 mt-0.5 sm:mt-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Urgent Distress Sales
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                    Discounted Liquidation
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 leading-relaxed max-w-2xl">
                  Verified items heavily discounted by sellers for immediate cash liquidation. All
                  payments are 100% secured with escrow protection.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <Link
                href="/listings/create"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Post Distress Sale</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Main Content Layout                                          */}
        {/* ============================================================ */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-20 bg-white rounded-lg shadow-sm border border-slate-200/90 overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 text-orange-600" />
                  Filter Distress Sales
                </h3>
                <button
                  onClick={handleClearSearch}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                >
                  Clear All
                </button>
              </div>
              <div className="p-4">
                <SearchFilters />
              </div>
            </div>
          </aside>

          {/* Mobile Filter Button and Search */}
          <div className="lg:hidden">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="bg-slate-900 text-white px-3 py-2 rounded-md font-semibold flex items-center justify-center gap-1.5 text-xs shadow-xs shrink-0"
              >
                <span>{showMobileFilters ? 'Hide Filters' : 'Filters'}</span>
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search distress deals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 pl-9 pr-8 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white text-slate-900 placeholder:text-slate-400 text-xs transition-colors"
                />
                <svg
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {showMobileFilters && (
              <div className="mb-4 bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                <SearchFilters onApply={() => setShowMobileFilters(false)} />
              </div>
            )}
          </div>

          {/* Product Grid Area */}
          <div className="flex-1 min-w-0">
            {/* Active search filter bar */}
            {search && (
              <div className="mb-4 flex items-center gap-2 text-xs bg-orange-50 border border-orange-200/80 rounded-md px-3 py-2 text-slate-700">
                <span>
                  Results for: <strong className="text-orange-700">&quot;{search}&quot;</strong>
                </span>
                <button
                  onClick={handleClearSearch}
                  className="ml-auto text-orange-700 font-semibold hover:underline"
                >
                  Clear
                </button>
              </div>
            )}

            {isLoading ? (
              <ListingsGridSkeleton count={8} />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}

            {/* Loading More Indicator */}
            {isFetchingNextPage && (
              <div className="flex justify-center py-6">
                <LoadingSpinner size="lg" />
              </div>
            )}

            {/* Infinite Scroll Trigger */}
            <div ref={ref} className="h-4" />

            {/* Clean Professional Empty State */}
            {!isLoading && !isFetching && listings.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="w-12 h-12 rounded-lg bg-orange-50 border border-orange-200/80 flex items-center justify-center mx-auto mb-3 text-orange-600">
                  <Tag className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  No distress sales found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  There are currently no distress sale listings matching your active filters. Check
                  back soon or explore general marketplace items.
                </p>
                <div className="mt-5 flex items-center justify-center gap-3">
                  <Link
                    href="/"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                  >
                    Browse Marketplace
                  </Link>
                  <Link
                    href="/listings/create"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md border border-slate-200 transition-colors"
                  >
                    Post an Item
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
