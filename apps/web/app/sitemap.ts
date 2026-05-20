import { MetadataRoute } from 'next';
import { serverFetch } from '@/lib/api-server';
import type { Listing, PaginatedResponse } from '@/lib/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://barterwave.com';

  // Base routes for the application
  const routes = [
    '',
    '/discover',
    '/distress',
    '/help',
    '/terms',
    '/privacy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  try {
    // Fetch top 100 listings to index in sitemap dynamically
    const response = await serverFetch<PaginatedResponse<Listing>>('/listings', {
      limit: 100,
    });
    
    const listingUrls = (response?.data || []).map((listing) => ({
      url: `${baseUrl}/listings/${listing.id}`,
      lastModified: new Date(listing.updatedAt || listing.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...routes, ...listingUrls];
  } catch (error) {
    console.error('Failed to generate dynamic sitemap:', error);
    return routes;
  }
}
