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
        ? `${listing.currencyCode || 'NGN'} ${(listing.priceCents / 100).toLocaleString()}`
        : 'Contact for Price';

    return {
        title: `${listing.title} | BarterWave`,
        description: listing.description || `Check out this listing on BarterWave: ${listing.title} - ${price}`,
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
