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

export default function CommunityFeed() {
    const queryClient = useQueryClient();
    const user = useAuthStore(s => s.user);
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
            // Clean up the URL param without re-navigation using Next.js router
            const params = new URLSearchParams(searchParams.toString());
            params.delete('create');
            const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
            router.replace(newUrl, { scroll: false });
        }
    }, [searchParams, pathname, router]);

    // Fetch saved post IDs on mount
    useEffect(() => {
        if (!user) return;
        apiClient.get<string[]>('/community-posts/me/saved-ids')
            .then(r => setSavedIds(r.data))
            .catch(() => { });
    }, [user]);

    const handleToggleSave = useCallback((postId: string, saved: boolean) => {
        setSavedIds(prev => saved ? [...prev, postId] : prev.filter(id => id !== postId));
    }, []);

    // Debounce search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
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
        isFetching,
    } = useInfiniteQuery({
        // CRITICAL FIX: Add countryId to queryKey so it refetches cleanly when auth hydrates
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

    // Infinite scroll trigger
    const { ref: loadMoreRef } = useInView({
        threshold: 0,
        onChange: (inView) => {
            if (inView && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        },
    });

    const allPosts = data?.pages.flatMap(p => p.data) ?? [];

    const handlePostCreated = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    }, [queryClient]);

    const handlePostDeleted = useCallback((id: string) => {
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
    }, [queryClient, debouncedSearch]);

    const handlePostUpdated = useCallback((updatedPost: CommunityPost) => {
        queryClient.setQueryData(['community-posts', debouncedSearch], (old: any) => {
            if (!old) return old;
            return {
                ...old,
                pages: old.pages.map((page: any) => ({
                    ...page,
                    data: page.data.map((p: CommunityPost) => p.id === updatedPost.id ? updatedPost : p),
                })),
            };
        });
    }, [queryClient, debouncedSearch]);

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search topics, tags, or people..."
                    className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all"
                />
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                <div>
                                    <div className="h-3 w-24 bg-gray-200 rounded mb-1" />
                                    <div className="h-2 w-16 bg-gray-100 rounded" />
                                </div>
                            </div>
                            <div className="h-3 w-full bg-gray-100 rounded mb-2" />
                            <div className="h-3 w-3/4 bg-gray-100 rounded" />
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {isError && (
                <div className="text-center py-8">
                    <p className="text-red-500 text-sm mb-2">
                        {(error as any)?.response?.status === 504
                            ? 'Server timed out. Please try again.'
                            : (error as any)?.message || 'Failed to load posts'}
                    </p>
                    <button onClick={() => queryClient.invalidateQueries({ queryKey: ['community-posts'] })} className="text-blue-600 text-sm font-medium hover:underline">
                        Try again
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && allPosts.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {debouncedSearch ? 'No posts found' : 'No posts yet'}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                        {debouncedSearch ? 'Try different keywords' : 'Be the first to post in the community!'}
                    </p>
                    {!debouncedSearch && (
                        <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                            Create a Post
                        </button>
                    )}
                </div>
            )}

            {/* Posts */}
            {allPosts.map(post => (
                <PostCard
                    key={post.id}
                    post={post}
                    onDelete={handlePostDeleted}
                    onUpdate={handlePostUpdated}
                    savedIds={savedIds}
                    onToggleSave={handleToggleSave}
                />
            ))}

            {/* Load More Trigger */}
            {hasNextPage && (
                <div ref={loadMoreRef} className="py-4 flex justify-center">
                    {isFetchingNextPage && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            Loading more...
                        </div>
                    )}
                </div>
            )}

            {/* FAB */}
            <button
                onClick={() => setShowCreateModal(true)}
                className="fixed bottom-24 right-5 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-xl flex items-center gap-2.5 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all z-40 group"
                title="Add Post"
            >
                <div className="bg-white/20 p-1 rounded-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                </div>
                <span className="font-bold text-xs uppercase tracking-tight">Add Post</span>
            </button>

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
