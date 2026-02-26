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
        let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

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

        // ISR: Cache listing data for 30 seconds at the edge.
        // This is the single biggest mobile perf win — subsequent clicks
        // serve from Vercel's edge cache instead of round-tripping to Koyeb.
        const res = await fetch(fetchUrl, {
            next: { revalidate: 30 },
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'BarterWave-Frontend/1.0'
            }
        });

        if (!res.ok) {
            const errorText = await res.text();
            return {
                isDiagnosticError: true,
                status: res.status,
                statusText: res.statusText,
                url: fetchUrl,
                env: process.env.NODE_ENV,
                apiUrl: process.env.NEXT_PUBLIC_API_URL,
                response: errorText.slice(0, 500)
            } as any;
        }

        return await res.json();
    } catch (error: any) {
        if (error.isDiagnosticError) throw error;

        console.error('[getListing] Server-side error:', error.message);
        return {
            isDiagnosticError: true,
            status: 500,
            statusText: 'Internal Server Error',
            url: 'unknown',
            env: process.env.NODE_ENV,
            apiUrl: process.env.NEXT_PUBLIC_API_URL,
            response: error.message
        } as any;
    }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { id } = await props.params;
    const listing = await getListing(id);

    if (!listing || (listing as any).isDiagnosticError) {
        return {
            title: 'Refining Listing... | BarterWave',
            description: 'Please wait while we diagnose the connection.',
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

    // DIAGNOSTIC RENDER
    if ((listing as any).isDiagnosticError) {
        const err = listing as any;
        return (
            <div className="p-8 max-w-2xl mx-auto mt-10 bg-red-50 border border-red-200 rounded-xl font-sans">
                <h1 className="text-2xl font-bold text-red-700 mb-4">⚠️ Diagnostic Error Report</h1>
                <p className="mb-4 text-red-800">Please screenshot this and send it to support.</p>
                <div className="space-y-3 text-xs font-mono bg-white p-4 rounded border border-red-100 overflow-auto">
                    <p><strong>Attempted URL:</strong> <span className="text-blue-600 break-all">{err.url}</span></p>
                    <p><strong>Status:</strong> <span className="font-bold">{err.status} {err.statusText}</span></p>
                    <p><strong>NODE_ENV:</strong> {err.env}</p>
                    <p><strong>NEXT_PUBLIC_API_URL:</strong> {err.apiUrl || 'undefined'}</p>
                    <div className="mt-2 pt-2 border-t border-gray-100">
                        <strong>Response Body:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-gray-600">{err.response}</pre>
                    </div>
                </div>
            </div>
        );
    }

    return <ListingClient listing={listing} />;
}
