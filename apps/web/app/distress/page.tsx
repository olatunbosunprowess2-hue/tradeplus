'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import type { Listing, PaginatedResponse } from '@/lib/types';
import ListingCard from '@/components/ListingCard';
import { ListingsGridSkeleton, SkeletonStyles } from '@/components/ui/Skeleton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import SearchFilters from '@/components/SearchFilters';
import CategoryPills from '@/components/CategoryPills';

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

function DistressContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || undefined;
    const condition = searchParams.get('condition') || undefined;
    const paymentMode = searchParams.get('paymentMode') || undefined;
    const minPrice = searchParams.get('minPrice') || undefined;
    const maxPrice = searchParams.get('maxPrice') || undefined;
    const category = searchParams.get('category') || undefined;
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

        // Only update URL if the search has actually changed
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
    } = useInfiniteQuery({
        queryKey: ['distress-listings', search, type, condition, paymentMode, minPrice, maxPrice, category, countryId, regionId],
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
                category,
                countryId,
                regionId,
                isDistressSale: 'true', // FORCE DISTRESS FILTER
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
    };

    const listings = data?.pages.flatMap((page) => page.data) || [];
    const isLoading = status === 'pending';

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Distress Sale Banner */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-8 mb-6">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
                                <span className="text-4xl">🔥</span> Distress Sales
                            </h1>
                            <p className="text-red-100 max-w-2xl text-lg">
                                Urgent deals requiring quick cash. Prices are significantly dropped for immediate sale.
                                Secure payments only via Escrow.
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                                <div className="text-sm font-semibold opacity-90 mb-1">Buyer Protection</div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="bg-white text-red-600 px-2 py-0.5 rounded font-bold">ESCROW</span>
                                    <span>Funds held until you confirm receipt</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-7xl">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Filters Sidebar - Desktop */}
                    <div className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-24">
                            <SearchFilters />
                        </div>
                    </div>

                    {/* Mobile Filter Button, Search Bar, and Panel */}
                    <div className="lg:hidden">
                        <div className="flex items-center gap-3 mb-4">
                            {/* Filter Button */}
                            <button
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                                className="bg-white border border-gray-300 px-4 py-2.5 rounded-xl text-gray-700 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition shadow-sm shrink-0"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                                <span className="text-sm">{showMobileFilters ? 'Hide' : 'Filters'}</span>
                            </button>

                            {/* Search Bar - Mobile */}
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Search urgent deals..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-2.5 pl-10 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400 transition-colors text-sm"
                                />
                                <svg
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {showMobileFilters && (
                            <div className="mb-4">
                                <SearchFilters />
                            </div>
                        )}
                    </div>

                    {/* Listings Grid */}
                    <div className="flex-1">
                        <CategoryPills />

                        {/* Search status indicator */}
                        {search && (
                            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                                <span>Showing results for:</span>
                                <span className="font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded-lg">"{search}"</span>
                                <button
                                    onClick={handleClearSearch}
                                    className="text-red-600 hover:text-red-700 ml-2"
                                >
                                    Clear
                                </button>
                            </div>
                        )}

                        {isLoading ? (
                            <ListingsGridSkeleton count={9} />
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {listings.map((listing) => (
                                    <ListingCard key={listing.id} listing={listing} />
                                ))}
                            </div>
                        )}

                        {/* Loading More Indicator */}
                        {isFetchingNextPage && (
                            <div className="flex justify-center py-8">
                                <LoadingSpinner size="lg" />
                            </div>
                        )}

                        {/* Infinite Scroll Trigger */}
                        <div ref={ref} className="h-4" />

                        {!isLoading && listings.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="text-6xl mb-4">😌</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No distress sales right now</h3>
                                <p className="text-gray-600 max-w-md mx-auto">
                                    That's actually good news for sellers! Check back later for urgent deals, or browse regular listings.
                                </p>
                                <button
                                    onClick={() => router.push('/listings')}
                                    className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                                >
                                    Browse All Listings
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DistressPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 py-6">
                <SkeletonStyles />
                <div className="container mx-auto px-4 max-w-7xl">
                    <ListingsGridSkeleton count={12} />
                </div>
            </div>
        }>
            <DistressContent />
        </Suspense>
    );
}
