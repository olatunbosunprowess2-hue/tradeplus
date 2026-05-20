import { Suspense } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { serverFetch } from '@/lib/api-server';
import type { Listing, PaginatedResponse } from '@/lib/types';
import { ListingsGridSkeleton, SkeletonStyles } from '@/components/ui/Skeleton';
import HomeContent from '@/components/home/HomeContent';

/**
 * Home Page — Server Component (async)
 *
 * This is the key performance optimization. Instead of rendering a skeleton
 * and waiting for the client to mount + fetch data, we prefetch the initial
 * listings and featured listings on the SERVER during HTML generation.
 *
 * The data is serialized via `dehydrate()` and injected into the page via
 * `<HydrationBoundary>`, so when React Query boots on the client, it already
 * has the data — resulting in an instant render with no loading spinner.
 */
export default async function HomePage() {
  const queryClient = getQueryClient();

  // Prefetch the initial listings page and featured listings in parallel.
  // These use the same query keys as MarketFeed.tsx so React Query
  // automatically picks them up on the client — zero wasted fetches.
  await Promise.allSettled([
    queryClient.prefetchInfiniteQuery({
      queryKey: ['listings', '', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      queryFn: async () => {
        return serverFetch<PaginatedResponse<Listing>>('/listings', {
          page: 1,
          limit: 12,
        });
      },
      initialPageParam: 1,
    }),

    queryClient.prefetchQuery({
      queryKey: ['featured-listings'],
      queryFn: async () => {
        return serverFetch<Listing[]>('/listings/featured');
      },
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            'name': 'BarterWave',
            'url': 'https://barterwave.com',
            'potentialAction': {
              '@type': 'SearchAction',
              'target': 'https://barterwave.com/listings?search={search_term_string}',
              'query-input': 'required name=search_term_string'
            }
          })
        }}
      />
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 py-4">
          <SkeletonStyles />
          <div className="container mx-auto px-4 max-w-7xl">
            <ListingsGridSkeleton count={6} />
          </div>
        </div>
      }>
        <HomeContent />
      </Suspense>
    </HydrationBoundary>
  );
}
