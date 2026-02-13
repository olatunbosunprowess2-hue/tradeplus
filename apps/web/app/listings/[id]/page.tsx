import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ListingClient from './ListingClient';
import type { Listing } from '@/lib/types';

interface Props {
    params: { id: string };
    searchParams: { [key: string]: string | string[] | undefined };
}

async function getListing(id: string): Promise<Listing | null> {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';
        // Ensure strictly internal URL if needed, but localhost usually works
        const res = await fetch(`${apiUrl}/listings/${id}`, {
            cache: 'no-store',
        });

        if (!res.ok) {
            if (res.status === 404) return null;
            throw new Error(`Failed to fetch listing: ${res.status} ${res.statusText}`);
        }

        return res.json();
    } catch (error) {
        console.error('Error fetching listing server-side:', error);
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const listing = await getListing(params.id);

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

export default async function ListingPage({ params }: Props) {
    const listing = await getListing(params.id);

    if (!listing) {
        notFound();
    }

    return <ListingClient listing={listing} />;
}
