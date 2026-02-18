'use client';

import { useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import type { PostComment as PostCommentType, PostAuthor } from '@/lib/types';
import { CheckCircle2 } from 'lucide-react';
import PremiumBadge from '../PremiumBadge';
import BrandBadge from '../BrandBadge';
import { sanitizeUrl } from '@/lib/utils';

function getDisplayName(author: PostAuthor): string {
    return author.profile?.displayName || author.brandName || [author.firstName, author.lastName].filter(Boolean).join(' ') || 'Anonymous';
}

function getAvatarUrl(author: PostAuthor): string {
    return author.profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.id}`;
}

function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function isVerified(author: PostAuthor): boolean {
    return author.isVerified || author.verificationStatus === 'VERIFIED';
}

function VerifiedBadge() {
    return (
        <span className="flex items-center gap-1 px-1 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[9px] font-bold shadow-sm border border-blue-100 ml-0.5">
            <svg className="w-2.5 h-2.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Verified
        </span>
    );
}

function isBrand(author: PostAuthor): boolean {
    return author.brandVerificationStatus === 'VERIFIED_BRAND';
}

export default function CommentSection({ postId }: { postId: string }) {
    const user = useAuthStore(s => s.user);
    const [comments, setComments] = useState<PostCommentType[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useState(() => {
        apiClient.get(`/community-posts/${postId}/comments`)
            .then(r => setComments(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || submitting) return;
        setSubmitting(true);
        try {
            const r = await apiClient.post(`/community-posts/${postId}/comments`, { content: newComment.trim() });
            setComments(prev => [...prev, r.data]);
            setNewComment('');
        } catch { }
        setSubmitting(false);
    };

    return (
        <div className="border-t border-gray-100 bg-gray-50/50">
            {loading ? (
                <div className="px-4 py-3 text-sm text-gray-400">Loading comments...</div>
            ) : (
                <>
                    <div className="max-h-60 overflow-y-auto">
                        {comments.length === 0 && (
                            <p className="px-4 py-3 text-sm text-gray-400">No comments yet. Be the first!</p>
                        )}
                        {comments.map(c => (
                            <div key={c.id} className="px-4 py-2.5 flex gap-2.5">
                                <Link href={`/profile/${c.authorId}`}>
                                    <img src={sanitizeUrl(getAvatarUrl(c.author))} alt="" className="w-7 h-7 rounded-full shrink-0 mt-0.5 hover:opacity-80 transition" />
                                </Link>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <Link href={`/profile/${c.authorId}`} className="text-xs font-semibold text-gray-900 hover:underline">
                                            {getDisplayName(c.author)}
                                        </Link>
                                        {isVerified(c.author) && <VerifiedBadge />}
                                        {isBrand(c.author) && <BrandBadge size="xs" />}
                                        {c.author.tier === 'premium' && <PremiumBadge size="xs" />}
                                        <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 mt-0.5">{c.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {user && (
                        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-2.5 border-t border-gray-100">
                            <img src={sanitizeUrl(user.profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`)} alt="" className="w-7 h-7 rounded-full shrink-0" />
                            <input
                                type="text"
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                            <button type="submit" disabled={!newComment.trim() || submitting} className="text-blue-600 font-semibold text-sm disabled:opacity-40">Post</button>
                        </form>
                    )}
                </>
            )}
        </div>
    );
}
