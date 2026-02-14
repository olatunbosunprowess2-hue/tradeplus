'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PostCard from '@/components/home/PostCard';
import type { CommunityPost } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';

export default function PostClient({ post }: { post: CommunityPost }) {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/listings?tab=community" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition text-gray-600">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="font-semibold text-gray-900">Post</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-xl mx-auto p-4 pb-20">
                <PostCard
                    post={post}
                    // Pass empty array for savedIds for now; 
                    // ideally we'd fetch this user's saved IDs client-side if we want accurate bookmark state on this isolated page.
                    savedIds={[]}
                />
            </div>
        </div>
    );
}
