'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import type { Listing, PaginatedResponse } from '@/lib/types';
import ListingCard from '@/components/ListingCard';
import { ListingsGridSkeleton } from '@/components/ui/Skeleton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import SearchFilters from '@/components/SearchFilters';
import CategoryPills from '@/components/CategoryPills';
import CategorySidebar from '@/components/CategorySidebar';
import SpotlightCarousel from '@/components/SpotlightCarousel';

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

export default function MarketFeed() {
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const router = useRouter();
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || undefined;
    const condition = searchParams.get('condition') || undefined;
    const paymentMode = searchParams.get('paymentMode') || undefined;
    const minPrice = searchParams.get('minPrice') || undefined;
    const maxPrice = searchParams.get('maxPrice') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const isDistressSale = searchParams.get('isDistressSale') || undefined;
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

        // Preserve tab param
        if (!params.has('tab')) {
            params.delete('tab');
        }

        // Only update URL if the search has actually changed
        const newSearch = params.get('search') || '';
        if (newSearch !== search) {
            router.push(`/listings?${params.toString()}`, { scroll: false });
        }
    }, [debouncedSearch]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
        error,
    } = useInfiniteQuery({
        queryKey: ['listings', search, type, condition, paymentMode, minPrice, maxPrice, categoryId, isDistressSale, countryId, regionId],
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
                isDistressSale,
                countryId,
                regionId,
            };
            const response = await apiClient.get<PaginatedResponse<Listing>>('/listings', { params });
            return response.data;
        },
        getNextPageParam: (lastPage) => {
            return lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined;
        },
        initialPageParam: 1,
        staleTime: 1000 * 60 * 5, // Keep listings fresh for 5 minutes
    });

    const listings = data?.pages.flatMap((page) => page.data) || [];

    // Smart Prefetching: Fetch the next page when the user is close to the bottom
    useEffect(() => {
        if (hasNextPage && !isFetchingNextPage && listings.length > 0) {
            const nextPage = (data?.pages.length || 0) + 1;
            const queryKey = ['listings', search, type, condition, paymentMode, minPrice, maxPrice, categoryId, isDistressSale, countryId, regionId];

            // Only prefetch if not already fetching
            queryClient.prefetchInfiniteQuery({
                queryKey,
                queryFn: async () => {
                    const params = {
                        page: nextPage,
                        limit: 12,
                        search,
                        type,
                        condition,
                        paymentMode,
                        minPrice,
                        maxPrice,
                        categoryId,
                        isDistressSale,
                        countryId,
                        regionId,
                    };
                    const response = await apiClient.get<PaginatedResponse<Listing>>('/listings', { params });
                    return response.data;
                },
                initialPageParam: 1,
            });
        }
    }, [listings.length, hasNextPage, isFetchingNextPage, queryClient]);

    useEffect(() => {
        if (inView && hasNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, fetchNextPage]);

    // Sync search input with URL params (for external navigation or back button)
    useEffect(() => {
        if (search !== searchQuery && search !== debouncedSearch) {
            setSearchQuery(search);
        }
    }, [search]);

    const handleClearSearch = () => {
        setSearchQuery('');
    };

    const isLoading = status === 'pending';
    const isError = status === 'error';

    // DIAGNOSTIC ERROR DISPLAY
    if (isError) {
        return (
            <div className="p-8 bg-red-50 border border-red-200 rounded-xl">
                <h3 className="text-xl font-bold text-red-800 mb-2">Feed Error (Diagnostic Mode)</h3>
                <p className="text-red-700 mb-4">Please screenshot this for support:</p>
                <div className="bg-white p-4 rounded border border-red-100 font-mono text-xs overflow-auto">
                    <p><strong>Status:</strong> {(error as any)?.response?.status || 'Network Error'}</p>
                    <p><strong>Message:</strong> {(error as Error).message}</p>
                    <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL}</p>
                    <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
                    <p><strong>Endpoint:</strong> /listings</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Sidebar - Filters (Desktop) */}
                <aside className="hidden lg:block w-72 shrink-0">
                    <div className="sticky top-24 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                Filter Results
                            </h3>
                        </div>
                        <div className="p-4">
                            <SearchFilters />
                        </div>
                    </div>
                </aside>

                {/* Mobile Filter Button, Search Bar, and Panel */}
                <div className="lg:hidden">
                    <div className="flex items-center gap-2 mb-3">
                        {/* Filter Button */}
                        <button
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 hover:shadow-lg transition shadow-sm shrink-0 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            <span>{showMobileFilters ? 'Hide' : 'Filters'}</span>
                        </button>

                        {/* Search Bar - Mobile */}
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search listings..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-2 pl-9 pr-8 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-900 placeholder:text-gray-400 transition-all text-sm"
                            />
                            <svg
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {showMobileFilters && (
                        <div className="mb-3 bg-white rounded-xl shadow-sm border border-gray-100 p-3">
                            <SearchFilters onApply={() => setShowMobileFilters(false)} />
                        </div>
                    )}
                </div>

                {/* Listings Grid - Main Center Content */}
                <div className="flex-1">
                    {/* Spotlight Carousel - Featured Items */}
                    {!isLoading && listings.length > 0 && (
                        <SpotlightCarousel listings={listings} />
                    )}

                    {/* Mobile Only Category Pills - Still useful for quick navigation on mobile */}
                    <div className="block lg:hidden">
                        <CategoryPills />
                    </div>

                    {/* Search status indicator */}
                    {search && (
                        <div className="mb-3 flex items-center gap-2 text-sm bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span className="text-gray-600 truncate">Results for: <strong className="text-blue-700">"{search}"</strong></span>
                            <button
                                onClick={handleClearSearch}
                                className="ml-auto text-blue-600 hover:text-blue-700 font-medium shrink-0"
                            >
                                Clear
                            </button>
                        </div>
                    )}

                    {isLoading ? (
                        <ListingsGridSkeleton count={6} />
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4">
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

                    {!isLoading && listings.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">No listings found</h3>
                            <p className="text-gray-600 text-sm mb-4 max-w-xs mx-auto">Try adjusting your search terms or filters to discover more great items</p>
                            <button
                                onClick={handleClearSearch}
                                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition text-sm"
                            >
                                Clear Search
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Sidebar - Categories (Desktop) */}
                <aside className="hidden lg:block w-64 shrink-0">
                    <div className="sticky top-24">
                        <CategorySidebar />
                    </div>
                </aside>
            </div>
        </div>
    );
}
