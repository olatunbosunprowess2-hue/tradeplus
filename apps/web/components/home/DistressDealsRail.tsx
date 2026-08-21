'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import type { Listing, PaginatedResponse } from '@/lib/types';
import ListingCard from '@/components/ListingCard';
import { Flame, Clock, ArrowRight, ShieldCheck, ChevronRight } from 'lucide-react';

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
    return null; // Don't show rail if no active distress sales
  }

  return (
    <section className="mb-6">
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 rounded-lg p-3.5 sm:p-4 text-white shadow-sm mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                Distress Sales &amp; Urgent Cash Liquidation
              </h2>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider bg-white text-orange-700 px-2 py-0.5 rounded">
                Up to 50% Off
              </span>
            </div>
            <p className="text-xs text-orange-100 font-medium">
              Verified discounted items listed for immediate sale with escrow protection.
            </p>
          </div>
        </div>

        <Link
          href="/distress"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-orange-700 hover:bg-orange-50 font-bold text-xs rounded transition-all shadow-xs"
        >
          View All Distress Deals
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Distress Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg p-3 animate-pulse h-64" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </section>
  );
}
