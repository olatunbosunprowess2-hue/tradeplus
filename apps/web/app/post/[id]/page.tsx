'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import type { CommunityPost } from '@/lib/types';
import PostCard from '@/components/home/PostCard';
import { ArrowLeft, Loader2, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function SinglePostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;

    setIsLoading(true);
    setError(null);

    apiClient
      .get<CommunityPost>(`/community-posts/${postId}`)
      .then((res) => {
        setPost(res.data);
      })
      .catch((err) => {
        console.error('Failed to load post:', err);
        setError(err.response?.data?.message || 'Post not found or has been removed.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [postId]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-4 sm:pt-6">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/?tab=community"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Trade Requests &amp; Wants</span>
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading trade request post...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-xs">
            <div className="w-12 h-12 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Post Unavailable</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">{error}</p>
            <Link
              href="/?tab=community"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-xs transition-colors"
            >
              Browse Trade Board
            </Link>
          </div>
        )}

        {/* Post View */}
        {!isLoading && post && (
          <div className="space-y-4">
            <PostCard
              post={post}
              onDelete={() => {
                router.push('/?tab=community');
              }}
              onUpdate={(updated) => {
                setPost(updated);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
