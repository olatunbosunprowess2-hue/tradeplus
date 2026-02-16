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
        try {
            const fs = require('fs');
            const logPath = 'C:/Users/PC/Desktop/BarterWave/BarterWave/debug_frontend.log';
            fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] getListing: Invalid ID: ${id}`);
        } catch (e) { }
        console.error('[DEBUG] getListing called with invalid id:', id);
        return null;
    }

    try {
        let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

        // FORCE HTTPS for production/live environments (server-side)
        if (!apiUrl.includes('localhost') && apiUrl.startsWith('http:')) {
            apiUrl = apiUrl.replace('http:', 'https:');
        }

        const fetchUrl = `${apiUrl}/listings/${id}`;

        try {
            const fs = require('fs');
            const logPath = 'C:/Users/PC/Desktop/BarterWave/BarterWave/debug_frontend.log';
            fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] getListing: Fetching from ${fetchUrl}`);
        } catch (e) { }

        console.log(`[DEBUG] Fetching listing from: ${fetchUrl}`);

        const res = await fetch(fetchUrl, {
            cache: 'no-store',
        });

        if (!res.ok) {
            try {
                const fs = require('fs');
                const logPath = 'C:/Users/PC/Desktop/BarterWave/BarterWave/debug_frontend.log';
                fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] getListing: FAILED ${res.status} ${res.statusText} for ${fetchUrl}`);
            } catch (e) { }

            console.error(`[DEBUG] Failed to fetch listing: ${res.status} ${res.statusText} for URL: ${fetchUrl}`);
            if (res.status === 404 || res.status === 400) return null;
            throw new Error(`Failed to fetch listing: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        try {
            const fs = require('fs');
            const logPath = 'C:/Users/PC/Desktop/BarterWave/BarterWave/debug_frontend.log';
            fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] getListing: SUCCESS for ${data.title}`);
        } catch (e) { }

        console.log(`[DEBUG] Successfully fetched listing: ${data.title}`);
        return data;
    } catch (error: any) {
        try {
            const fs = require('fs');
            const logPath = 'C:/Users/PC/Desktop/BarterWave/BarterWave/debug_frontend.log';
            fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] getListing: EXCEPTION for ${id}: ${error.message}\n${error.stack}`);
        } catch (e) { }

        console.error('[DEBUG] Error fetching listing server-side:', error);
        return null;
    }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { id } = await props.params;
    const listing = await getListing(id);

    if (!listing) {
        return {
            title: 'Listing Not Found | BarterWave',
            description: 'The requested listing could not be found.',
        };
    }

    const price = listing.priceCents
        ? `${listing.currencyCode || 'NGN'} ${(listing.priceCents / 100).toLocaleString()}`
        : 'Contact for Price';

    return {
        title: `${listing.title} | BarterWave`,
        description: listing.description || `Check out this listing on BarterWave: ${listing.title} - ${price}`,
        openGraph: {
            title: listing.title,
            description: listing.description || `Check out this listing on BarterWave: ${listing.title} - ${price}`,
            images: listing.images?.[0]?.url ? [listing.images[0].url] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: listing.title,
            description: listing.description || `Check out this listing on BarterWave`,
            images: listing.images?.[0]?.url ? [listing.images[0].url] : [],
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
