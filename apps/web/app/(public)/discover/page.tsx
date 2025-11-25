'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import CategoryCard from '@/components/CategoryCard';
import ListingCard from '@/components/ListingCard';

export default function DiscoverPage() {
  const { data: listings, isLoading } = useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      const response = await api.get('/listings', {
        params: { limit: 20 },
      });
      return response.data.data || [];
    },
  });

  const categories = [
    { name: 'Electronics', icon: '💻', href: '/listings?category=electronics' },
    { name: 'Fashion', icon: '👕', href: '/listings?category=fashion' },
    { name: 'Home & Garden', icon: '🏡', href: '/listings?category=home' },
    { name: 'Sports', icon: '⚽', href: '/listings?category=sports' },
    { name: 'Books', icon: '📚', href: '/listings?category=books' },
    { name: 'Toys & Games', icon: '🎮', href: '/listings?category=toys' },
    { name: 'Vehicles', icon: '🚗', href: '/listings?category=vehicles' },
    { name: 'Services', icon: '🛠️', href: '/listings?category=services' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading amazing deals...</div>
      </div>
    );
  }

  // Mock data for featured/flash deals (in production, this would come from API)
  const flashDeals = listings?.slice(0, 4).map((item: any) => ({
    ...item,
    originalPriceCents: item.priceCents ? item.priceCents * 1.5 : undefined,
    rating: 4.5,
    reviewCount: Math.floor(Math.random() * 100) + 10,
  })) || [];

  const regularListings = listings?.slice(4) || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-8 p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)' }}>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Discover Amazing Deals
          </h1>
          <p className="text-xl text-white/90 mb-6">
            Buy, sell, and barter with trusted sellers across Nigeria
          </p>
          <Link
            href="/listings"
            className="inline-block px-8 py-3 bg-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all"
            style={{ color: 'var(--color-primary)' }}
          >
            Browse All Listings →
          </Link>
        </div>

        {/* Categories Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
            <Link href="/listings" className="text-sm font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
              See All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.name}
                name={category.name}
                icon={category.icon}
                href={category.href}
              />
            ))}
          </div>
        </div>

        {/* Flash Deals Section */}
        {flashDeals.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">⚡ Flash Deals</h2>
                <span className="px-3 py-1 rounded-full text-sm font-bold text-white" style={{ backgroundColor: '#FF6B35' }}>
                  Limited Time!
                </span>
              </div>
              <Link href="/listings?sort=discount" className="text-sm font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {flashDeals.map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        )}

        {/* Promoted Listings */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🌟 Recommended for You</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {regularListings?.slice(0, 8).map((listing: any) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>

        {/* All Listings */}
        {regularListings && regularListings.length > 8 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">More Items</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {regularListings.slice(8).map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        )}

        {!listings || listings.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏪</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No listings yet</h3>
            <p className="text-gray-600 mb-6">Be the first to list an item!</p>
            <Link
              href="/listings/create"
              className="inline-block px-8 py-3 rounded-full font-bold text-white shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Create Listing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
