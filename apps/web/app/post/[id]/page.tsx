import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PostClient from './PostClient';
import type { CommunityPost } from '@/lib/types';

interface Props {
    params: { id: string };
    searchParams: { [key: string]: string | string[] | undefined };
}

async function getPost(id: string): Promise<CommunityPost | null> {
    try {
        let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';
        // Normalize: strip trailing slashes and deduplicate any /api/api
        apiUrl = apiUrl.replace(/\/+$/, '').replace(/\/api\/api(\/|$)/, '/api$1');
        const res = await fetch(`${apiUrl}/community-posts/${id}`, {
            cache: 'no-store',
        });

        if (!res.ok) {
            if (res.status === 404) return null;
            // Best effort - sometimes shared links might reference deleted posts
            return null;
        }

        return res.json();
    } catch (error) {
        console.error('Error fetching post server-side:', error);
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const post = await getPost(params.id);

    if (!post) {
        return {
            title: 'Post Not Found | BarterWave',
            description: 'The requested post could not be found.',
        };
    }

    const authorName = post.author.profile?.displayName || post.author.brandName || 'BarterWave User';
    const description = post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content;

    return {
        title: `Post by ${authorName} | BarterWave`,
        description: description,
        openGraph: {
            title: `Post by ${authorName}`,
            description: description,
            images: post.images || [],
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: `Post by ${authorName}`,
            description: description,
            images: post.images || [],
        },
    };
}

export default async function PostPage({ params }: Props) {
    const post = await getPost(params.id);

    if (!post) {
        notFound();
    }

    return <PostClient post={post} />;
}
