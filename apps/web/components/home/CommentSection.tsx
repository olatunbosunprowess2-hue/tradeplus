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

    // State to track which comment we are currently replying to
    const [replyTo, setReplyTo] = useState<{ id: string, name: string } | null>(null);

    // FIX: Changed from useState to useEffect to prevent infinite fetch loop
    useEffect(() => {
        let mounted = true;
        apiClient.get(`/community-posts/${postId}/comments`)
            .then(r => {
                if (mounted) {
                    setComments(r.data);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (mounted) setLoading(false);
            });

        return () => { mounted = false; };
    }, [postId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || submitting) return;
        setSubmitting(true);
        try {
            const payload = {
                content: newComment.trim(),
                ...(replyTo?.id ? { parentId: replyTo.id } : {})
            };

            const r = await apiClient.post(`/community-posts/${postId}/comments`, payload);

            // If it's a reply, find the parent and append to its replies loop
            if (replyTo?.id) {
                setComments(prev => prev.map(c => {
                    if (c.id === replyTo.id) {
                        return { ...c, replies: [...(c.replies || []), r.data] };
                    }
                    return c;
                }));
            } else {
                // Top level comment
                setComments(prev => [...prev, r.data]);
            }

            setNewComment('');
            setReplyTo(null);
        } catch (err) {
            console.error(err);
        }
        setSubmitting(false);
    };

    // Recursive component to render a single comment and its replies
    const CommentItem = ({ c, isReply = false }: { c: PostCommentType, isReply?: boolean }) => (
        <div className={`flex gap-2.5 ${isReply ? 'mt-3 relative' : 'px-4 py-3'}`}>
            {/* Visual thread line for replies */}
            {isReply && (
                <div className="absolute -left-6 top-3 w-5 border-t-2 border-l-2 border-gray-200 rounded-tl-lg h-full -mt-2"></div>
            )}

            <Link href={`/profile/${c.authorId}`} className="shrink-0">
                <img src={sanitizeUrl(getAvatarUrl(c.author))} alt="" className={`${isReply ? 'w-6 h-6' : 'w-8 h-8'} rounded-full mt-0.5 hover:opacity-80 transition`} />
            </Link>

            <div className="min-w-0 flex-1">
                <div className="bg-white rounded-2xl rounded-tl-none px-3.5 py-2.5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <Link href={`/profile/${c.authorId}`} className="text-xs font-bold text-gray-900 hover:underline">
                            {getDisplayName(c.author)}
                        </Link>
                        {isVerified(c.author) && <VerifiedBadge />}
                        {isBrand(c.author) && <BrandBadge size="xs" />}
                        {c.author.tier === 'premium' && <PremiumBadge size="xs" />}
                        <span className="text-[11px] text-gray-400 font-medium ml-1">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-[13px] text-gray-800 mt-1 leading-snug break-words whitespace-pre-wrap">{c.content}</p>
                </div>

                {/* Comment Actions */}
                <div className="flex items-center gap-4 mt-1.5 ml-2">
                    {user && !isReply && (
                        <button
                            onClick={() => setReplyTo({ id: c.id, name: getDisplayName(c.author) })}
                            className="text-[11px] font-bold text-gray-400 hover:text-blue-600 transition"
                        >
                            Reply
                        </button>
                    )}
                </div>

                {/* Render Nested Replies */}
                {c.replies && c.replies.length > 0 && (
                    <div className="ml-2 pl-4 border-l-2 border-gray-100 mt-1">
                        {c.replies.map(reply => (
                            <CommentItem key={reply.id} c={reply} isReply={true} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="border-t border-gray-100 bg-gray-50/50">
            {loading ? (
                <div className="px-4 py-4 flex justify-center">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    <div className="max-h-96 overflow-y-auto pb-2">
                        {comments.length === 0 && (
                            <div className="px-4 py-8 text-center">
                                <p className="text-sm font-medium text-gray-600">No comments yet</p>
                                <p className="text-xs text-gray-400 mt-1">Start the conversation!</p>
                            </div>
                        )}
                        {comments.map(c => (
                            <CommentItem key={c.id} c={c} />
                        ))}
                    </div>

                    {user && (
                        <div className="px-4 py-3 border-t border-gray-100 bg-white">
                            {/* Reply Indicator Target */}
                            {replyTo && (
                                <div className="flex items-center justify-between bg-blue-50 px-3 py-1.5 rounded-t-lg border border-blue-100 border-b-0 -mx-1 mb-1">
                                    <span className="text-xs font-medium text-blue-700">
                                        Replying to <span className="font-bold">@{replyTo.name}</span>
                                    </span>
                                    <button
                                        onClick={() => setReplyTo(null)}
                                        className="text-blue-400 hover:text-blue-700 transition"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                                <div className="flex items-start gap-2.5">
                                    <img src={sanitizeUrl(user.profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`)} alt="" className="w-8 h-8 rounded-full shrink-0" />
                                    <div className="flex-1 relative">
                                        <textarea
                                            value={newComment}
                                            onChange={e => setNewComment(e.target.value)}
                                            placeholder={replyTo ? "Write your reply..." : "Write a comment..."}
                                            className={`w-full bg-gray-50 border border-gray-200 resize-none px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-400 focus:bg-white transition-all ${replyTo ? 'rounded-b-xl rounded-tr-xl min-h-[60px]' : 'rounded-2xl min-h-[60px]'}`}
                                            autoFocus={!!replyTo}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newComment.trim() || submitting}
                                            className="absolute right-2 bottom-2 p-1.5 rounded-full bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 transition"
                                        >
                                            {submitting ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
