'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';
import type { CommunityPost, PaginatedResponse } from '@/lib/types';
import { Search, Plus, MessageSquare, Loader2, Sparkles, Image as ImageIcon, Send } from 'lucide-react';
import Image from 'next/image';
import { sanitizeUrl } from '@/lib/utils';

export default function CommunityFeed() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Auto-open create modal if create=true query param is present
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('create');
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  // Fetch saved post IDs on mount
  useEffect(() => {
    if (!user) return;
    apiClient
      .get<string[]>('/community-posts/me/saved-ids')
      .then((r) => setSavedIds(r.data))
      .catch(() => {});
  }, [user]);

  const handleToggleSave = useCallback((postId: string, saved: boolean) => {
    setSavedIds((prev) => (saved ? [...prev, postId] : prev.filter((id) => id !== postId)));
  }, []);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Infinite query for posts
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['community-posts', debouncedSearch, user?.profile?.countryId],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({ page: String(pageParam), limit: '15' });
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (user?.profile?.countryId) params.append('countryId', String(user.profile.countryId));
      const r = await apiClient.get<PaginatedResponse<CommunityPost>>(`/community-posts?${params}`);
      return r.data;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const { ref: loadMoreRef } = useInView({
    threshold: 0,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  const allPosts = data?.pages.flatMap((p) => p.data) ?? [];

  const handlePostCreated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['community-posts'] });
  }, [queryClient]);

  const handlePostDeleted = useCallback(
    (id: string) => {
      queryClient.setQueryData(['community-posts', debouncedSearch], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.filter((p: CommunityPost) => p.id !== id),
          })),
        };
      });
    },
    [queryClient, debouncedSearch]
  );

  const handlePostUpdated = useCallback(
    (updatedPost: CommunityPost) => {
      queryClient.setQueryData(['community-posts', debouncedSearch], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((p: CommunityPost) => (p.id === updatedPost.id ? updatedPost : p)),
          })),
        };
      });
    },
    [queryClient, debouncedSearch]
  );

  return (
    <div className="space-y-3.5 max-w-3xl mx-auto">
      {/* ============================================================ */}
      {/* 1. Unified Trade Board Composer & Search Card                */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3">
        {/* Quick Composer Action Row */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
            {user?.profile?.avatarUrl ? (
              <img
                src={sanitizeUrl(user.profile.avatarUrl)}
                alt="Avatar"
                className="object-cover w-full h-full"
              />
            ) : (
              <span>{user?.firstName?.[0]?.toUpperCase() || 'U'}</span>
            )}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3.5 py-2.5 text-left text-xs text-slate-500 font-medium transition-colors truncate"
          >
            What do you want to swap, buy, or request?
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Post Request</span>
            <span className="sm:hidden">Post</span>
          </button>
        </div>

        {/* Integrated Filter / Search Input */}
        <div className="relative pt-1 border-t border-slate-100">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trade requests, hashtags (#Lekki, #iPhone), or traders..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all shadow-2xs"
          />
          <Search className="absolute left-3 top-1/2 translate-y-[-35%] w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. Loading State                                             */}
      {/* ============================================================ */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-200 rounded-md" />
                <div className="space-y-1">
                  <div className="h-3 w-28 bg-slate-200 rounded" />
                  <div className="h-2 w-16 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-3 w-3/4 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="text-center py-8 bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-rose-600 text-xs font-semibold mb-2">
            {(error as any)?.response?.status === 504
              ? 'Server timed out. Please try again.'
              : (error as any)?.message || 'Failed to load community feed'}
          </p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['community-posts'] })}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && allPosts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-3 text-blue-600">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            {debouncedSearch ? 'No matching trade requests' : 'No trade requests yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed">
            {debouncedSearch
              ? `No requests match "${debouncedSearch}". Try different keywords or hashtags.`
              : 'Be the first trader to publish a swap request or barter discussion!'}
          </p>
          {!debouncedSearch && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publish First Request</span>
            </button>
          )}
        </div>
      )}

      {/* Post List */}
      <div className="space-y-3">
        {allPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onDelete={handlePostDeleted}
            onUpdate={handlePostUpdated}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
          />
        ))}
      </div>

      {/* Infinite Scroll Trigger */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="py-4 flex justify-center">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Loading more discussions...</span>
            </div>
          )}
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={handlePostCreated}
        />
      )}
    </div>
  );
}
