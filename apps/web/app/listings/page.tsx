'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api-client';
import type { Listing, PaginatedResponse } from '@/lib/types';
import ListingCard from '@/components/ListingCard';
import { useListingsStore } from '@/lib/listings-store';

import SearchFilters from '@/components/SearchFilters';
import CategoryPills from '@/components/CategoryPills';

function ListingsContent() {
    const searchParams = useSearchParams();
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || undefined;
    const condition = searchParams.get('condition') || undefined;
    const paymentMode = searchParams.get('paymentMode') || undefined;
    const minPrice = searchParams.get('minPrice') || undefined;
    const maxPrice = searchParams.get('maxPrice') || undefined;
    const category = searchParams.get('category') || undefined;

    const { getPaginatedListings } = useListingsStore();
    const { ref, inView } = useInView();
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = useInfiniteQuery({
        queryKey: ['listings', search, type, condition, paymentMode, minPrice, maxPrice, category],
        queryFn: async ({ pageParam = 1 }) => {
            // Simulate API call using store
            // In a real app, this would be: await api.get('/listings', { params: { ... } })
            return new Promise<any>((resolve) => {
                setTimeout(() => {
                    // Note: The mock store doesn't actually filter by these new params yet
                    // In a real app, the API would handle this (as we implemented in the backend)
                    resolve(getPaginatedListings(pageParam, 12, search, type, condition, paymentMode, minPrice, maxPrice, category));
                }, 300);
            });
        },
        getNextPageParam: (lastPage, pages) => {
            return lastPage.hasMore ? pages.length + 1 : undefined;
        },
        initialPageParam: 1,
    });

    useEffect(() => {
        if (inView && hasNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, fetchNextPage]);

    const listings = data?.pages.flatMap((page) => page.data) || [];
    const isLoading = status === 'pending';

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Filters Sidebar - Desktop */}
                    <div className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-24">
                            <SearchFilters />
                        </div>
                    </div>

                    {/* Mobile Filter Button and Panel */}
                    <div className="lg:hidden mb-4">
                        <button
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className="w-full bg-white border border-gray-300 py-2 rounded-lg text-gray-700 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
                        </button>

                        {showMobileFilters && (
                            <div className="mt-4">
                                <SearchFilters />
                            </div>
                        )}
                    </div>

                    {/* Listings Grid */}
                    <div className="flex-1">
                        <CategoryPills />

                        {isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-xl h-80 animate-pulse border border-gray-200" />
                                ))}
                            </div>
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
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        )}

                        {/* Infinite Scroll Trigger */}
                        <div ref={ref} className="h-4" />

                        {!isLoading && listings.length === 0 && (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No listings found</h3>
                                <p className="text-gray-600">Try adjusting your search terms or filters</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ListingsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
            <ListingsContent />
        </Suspense>
    );
}
