import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ListingClient from './ListingClient';
import type { Listing } from '@/lib/types';

interface Props {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getListing(id: string): Promise<Listing | null> {
    if (!id || id === 'undefined') {
        console.error('[getListing] Invalid id:', id);
        return null;
    }

    try {
        let apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api').trim();

        // ROBUST PRODUCTION FALLBACK: If Vercel build defaulted to localhost, force the known live backend
        if (process.env.NODE_ENV === 'production' && apiUrl.includes('localhost')) {
            apiUrl = 'https://api.barterwave.com/api';
        }

        // Normalize: strip trailing slashes
        apiUrl = apiUrl.replace(/\/+$/, '');

        // FORCE HTTPS for production/live environments (server-side)
        if (!apiUrl.includes('localhost') && apiUrl.startsWith('http:')) {
            apiUrl = apiUrl.replace('http:', 'https:');
        }

        // ENSURE /api SUFFIX (only if not already present)
        if (!apiUrl.endsWith('/api') && !apiUrl.includes('localhost') && apiUrl.startsWith('http')) {
            apiUrl += '/api';
        }

        // SAFETY: Deduplicate any accidental /api/api
        apiUrl = apiUrl.replace(/\/api\/api(\/|$)/, '/api$1');

        const fetchUrl = `${apiUrl}/listings/${id}`;

        const res = await fetch(fetchUrl, {
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'BarterWave-Frontend/1.0'
            }
        });

        if (!res.ok) {
            console.error(`[getListing] API returned ${res.status} for ${fetchUrl}`);
            return null;
        }

        return await res.json();
    } catch (error: any) {
        console.error('[getListing] Server-side error:', error.message);
        return null;
    }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { id } = await props.params;
    const listing = await getListing(id);

    if (!listing || (listing as any).isDiagnosticError) {
        return {
            title: 'Listing Not Found | BarterWave',
            description: 'This listing may have been removed or is no longer available.',
        };
    }

    const price = listing.priceCents
        ? `${listing.currencyCode || 'USD'} ${(listing.priceCents / 100).toLocaleString()}`
        : 'Contact for Price';

    const title = `${listing.title} - ${price} | BarterWave`;
    const description = listing.description
        ? `${listing.description.substring(0, 150)}...`
        : `Check out ${listing.title} on BarterWave. Price: ${price}. Trade safely on the global marketplace.`;

    const imageUrl = listing.images?.[0]?.url || '/og-image.png';

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `/listings/${id}`,
            type: 'article',
            siteName: 'BarterWave',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: listing.title,
                }
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
        },
    };
}

export default async function ListingPage(props: Props) {
    const { id } = await props.params;
    const listing = await getListing(id);

    if (!listing) {
        notFound();
    }

    return <ListingClient listing={listing} />;
}
