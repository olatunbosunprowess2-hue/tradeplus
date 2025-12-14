'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function AccountPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const { data: user } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const response = await apiClient.get('/users/me');
      return response.data;
    },
    enabled: isAuthenticated(),
  });

  const { data: listings } = useQuery({
    queryKey: ['my-listings'],
    queryFn: async () => {
      const response = await apiClient.get('/listings/my-listings');
      return response.data;
    },
    enabled: isAuthenticated(),
  });

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Account</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Profile</h2>
            {user && (
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Email:</span> {user.email}
                </p>
                {user.profile?.displayName && (
                  <p>
                    <span className="font-medium">Name:</span>{' '}
                    {user.profile.displayName}
                  </p>
                )}
                <p>
                  <span className="font-medium">Role:</span> {user.role}
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/account/seller/new-listing"
                className="block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-center"
              >
                Create Listing
              </Link>
              <Link
                href="/account/buyer/orders"
                className="block bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition text-center"
              >
                My Orders
              </Link>
              <Link
                href="/account/buyer/barter"
                className="block bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition text-center"
              >
                Barter Offers
              </Link>
            </div>
          </div>

          {/* My Listings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">My Listings</h2>
            <p className="text-gray-600 mb-2">
              {listings?.length || 0} active listings
            </p>
            <Link
              href="/account/seller/listings"
              className="text-blue-600 hover:text-blue-700"
            >
              View all →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}




