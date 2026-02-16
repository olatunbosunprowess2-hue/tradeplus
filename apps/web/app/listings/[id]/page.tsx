import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ListingClient from './ListingClient';
import type { Listing } from '@/lib/types';

interface Props {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getListing(id: string): Promise<Listing | null> {
    if (!id || id === 'undefined') return null;

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';
        const res = await fetch(`${apiUrl}/listings/${id}`, {
            cache: 'no-store',
        });

        if (!res.ok) {
            if (res.status === 404 || res.status === 400) return null;
            throw new Error(`Failed to fetch listing: ${res.status} ${res.statusText}`);
        }

        return res.json();
    } catch (error) {
        console.error('Error fetching listing server-side:', error);
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
