import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProfileClient from './ProfileClient';

interface Props {
    params: Promise<{ id: string }>;
}

async function getUser(id: string): Promise<any | null> {
    if (!id || id === 'undefined') {
        console.error('[getUser] Invalid id:', id);
        return null;
    }

    try {
        let apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api').trim();

        // ROBUST PRODUCTION FALLBACK
        if (process.env.NODE_ENV === 'production' && apiUrl.includes('localhost')) {
            apiUrl = 'https://api.barterwave.com/api';
        }

        apiUrl = apiUrl.replace(/\/+$/, '');

        if (!apiUrl.includes('localhost') && apiUrl.startsWith('http:')) {
            apiUrl = apiUrl.replace('http:', 'https:');
        }

        if (!apiUrl.endsWith('/api') && !apiUrl.includes('localhost') && apiUrl.startsWith('http')) {
            apiUrl += '/api';
        }

        apiUrl = apiUrl.replace(/\/api\/api(\/|$)/, '/api$1');

        const fetchUrl = `${apiUrl}/users/${id}`;
        const res = await fetch(fetchUrl, {
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'BarterWave-Frontend/1.0'
            }
        });

        if (!res.ok) {
            console.error(`[getUser] API returned ${res.status} for ${fetchUrl}`);
            return null;
        }

        return await res.json();
    } catch (error: any) {
        console.error('[getUser] Server-side error:', error.message);
        return null;
    }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { id } = await props.params;
    const user = await getUser(id);

    if (!user) {
        return {
            title: 'User Profile Not Found | BarterWave',
            description: 'This user profile may have been deactivated or is no longer available.',
        };
    }

    const displayName = user.profile?.displayName || 'User';
    const rating = user.profile?.rating ? `${user.profile.rating}★` : 'no ratings yet';
    const bio = user.profile?.bio || 'Check out my profile, active trade listings, and community posts on BarterWave.';
    const title = `${displayName} (${rating}) - BarterWave Profile`;
    const description = `${displayName} has a rating of ${rating} on BarterWave. ${bio.substring(0, 150)}`;
    const avatarUrl = user.profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `/profile/${id}`,
            type: 'profile',
            username: displayName,
            images: [
                {
                    url: avatarUrl,
                    width: 400,
                    height: 400,
                    alt: displayName,
                }
            ],
        },
        twitter: {
            card: 'summary',
            title,
            description,
            images: [avatarUrl],
        },
    };
}

export default async function PublicProfilePage(props: Props) {
    const { id } = await props.params;
    const user = await getUser(id);

    if (!user) {
        notFound();
    }

    return <ProfileClient userId={id} />;
}
