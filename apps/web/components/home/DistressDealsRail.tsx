'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import type { Listing, PaginatedResponse } from '@/lib/types';
import ListingCard from '@/components/ListingCard';
import { Flame, ChevronRight } from 'lucide-react';

export default function DistressDealsRail() {
  const { data, isLoading } = useQuery({
    queryKey: ['distress-rail-listings'],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<Listing>>('/listings', {
        params: {
          isDistressSale: 'true',
          limit: 6,
        },
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const listings = data?.data || [];

  if (!isLoading && listings.length === 0) {
    return null;
  }

  return (
    <section className="mb-6">
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs mb-3">
        <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-600 flex-shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Urgent Distress Sales &amp; Liquidation Deals
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                  Up to 50% Off
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Verified items discounted by sellers for immediate cash liquidation.
              </p>
            </div>
          </div>

          <Link
            href="/distress"
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 flex-shrink-0"
          >
            View All
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Distress Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-3 animate-pulse h-64" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
