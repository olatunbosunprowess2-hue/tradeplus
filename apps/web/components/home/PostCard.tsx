'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import apiClient from '@/lib/api-client';
import { useMessagesStore } from '@/lib/messages-store';
import type { CommunityPost, PostComment as PostCommentType, PostAuthor } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Share2, Bookmark, MoreVertical, MessageSquare, Send, Twitter, Facebook, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

// ============================================================================
// HELPERS
// ============================================================================
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

function isBrand(author: PostAuthor): boolean {
    return author.brandVerificationStatus === 'VERIFIED_BRAND';
}

// ============================================================================
// BADGE COMPONENTS
// ============================================================================
function VerifiedBadge() {
    return (
        <CheckCircle2 className="w-4 h-4 text-blue-500 inline-block ml-1" />
    );
}

function BrandBadge() {
    return (
        <span className="inline-flex items-center ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700">
            BRAND
        </span>
    );
}

// ============================================================================
// SHARE BUTTON
// ============================================================================
function ShareButton({ title, text, url, postId }: { title: string; text: string; url: string; postId: string }) {
    const [open, setOpen] = useState(false);

    const shareLinks = [
        {
            name: 'WhatsApp',
            icon: <Send className="w-4 h-4 text-green-500" />,
            href: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
        },
        {
            name: 'Twitter / X',
            icon: <Twitter className="w-4 h-4 text-gray-900" />,
            href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        },
        {
            name: 'Facebook',
            icon: <Facebook className="w-4 h-4 text-blue-600" />,
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        },
    ];

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard!');
            setOpen(false);
        } catch {
            toast.error('Failed to copy link');
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
                setOpen(false);
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    toast.error('Could not share');
                }
            }
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={`p-1.5 rounded-full transition ${open ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
                <Share2 className="w-5 h-5" />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 min-w-[200px] overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                        <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 mb-1">Share post</p>

                        {shareLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                            >
                                {link.icon}
                                {link.name}
                            </a>
                        ))}

                        <div className="h-px bg-gray-100 my-1" />

                        <button
                            onClick={copyToClipboard}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                        >
                            <LinkIcon className="w-4 h-4 text-gray-400" />
                            Copy Link
                        </button>

                        {typeof navigator !== 'undefined' && (navigator as any).share && (
                            <button
                                onClick={handleNativeShare}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                                <Share2 className="w-4 h-4" />
                                More Options...
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// ============================================================================
// REPORT MODAL
// ============================================================================
function ReportModal({ postId, onClose }: { postId: string; onClose: () => void }) {
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const reasons = ['Spam', 'Harassment', 'Scam / Fraud', 'Inappropriate Content', 'Impersonation', 'Other'];

    const handleSubmit = async () => {
        if (!reason) return;

        // GUEST CHECK: Prevent 401 logout
        if (!useAuthStore.getState().user) {
            alert('You must be logged in to report a post.');
            onClose();
            return;
        }

        setSubmitting(true);
        try {
            await apiClient.post('/reports', { reason: `Community Post: ${reason}`, reportedUserId: null, listingId: null, communityPostId: postId });
            setSubmitted(true);
            setTimeout(onClose, 1500);
        } catch {
            // fallback - just close
            setSubmitted(true);
            setTimeout(onClose, 1500);
        }
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                {submitted ? (
                    <div className="text-center py-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="font-semibold text-gray-900">Report Submitted</p>
                        <p className="text-sm text-gray-500 mt-1">Thank you. Our team will review this post.</p>
                    </div>
                ) : (
                    <>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Report Post</h3>
                        <div className="space-y-2">
                            {reasons.map(r => (
                                <button
                                    key={r}
                                    onClick={() => setReason(r)}
                                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition ${reason === r ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : 'hover:bg-gray-50 text-gray-700'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleSubmit} disabled={!reason || submitting} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                                {submitting ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// INLINE COMMENT SECTION
// ============================================================================
function CommentSection({ postId }: { postId: string }) {
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
                                    <img src={getAvatarUrl(c.author)} alt="" className="w-7 h-7 rounded-full shrink-0 mt-0.5 hover:opacity-80 transition" />
                                </Link>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <Link href={`/profile/${c.authorId}`} className="text-xs font-semibold text-gray-900 hover:underline">
                                            {getDisplayName(c.author)}
                                        </Link>
                                        {isVerified(c.author) && <VerifiedBadge />}
                                        <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 mt-0.5">{c.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {user && (
                        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-2.5 border-t border-gray-100">
                            <img src={user.profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt="" className="w-7 h-7 rounded-full shrink-0" />
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

// ============================================================================
// INLINE OFFER FORM
// ============================================================================
function OfferForm({ postId, postAuthor, onClose }: { postId: string; postAuthor: PostAuthor; onClose: () => void }) {
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const { createConversation } = useMessagesStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;
        setSubmitting(true);
        try {
            await apiClient.post(`/community-posts/${postId}/offers`, { message: message.trim() });

            // Create a message conversation with the post author
            const authorName = postAuthor.profile?.displayName || postAuthor.brandName || [postAuthor.firstName, postAuthor.lastName].filter(Boolean).join(' ') || 'User';
            const authorAvatar = postAuthor.profile?.avatarUrl;
            createConversation(postAuthor.id, authorName, authorAvatar);

            // Send the offer as a message
            try {
                const { sendMessage } = useMessagesStore.getState();
                await sendMessage(postAuthor.id, `ðŸ·ï¸ Community Offer: ${message.trim()}`);
            } catch { /* best-effort */ }

            setSubmitted(true);
            toast.success('Offer sent! Check your messages.');
            setTimeout(onClose, 1500);
        } catch {
            toast.error('Failed to send offer. Please try again.');
        }
        setSubmitting(false);
    };

    if (submitted) {
        return (
            <div className="border-t border-blue-100 bg-blue-50 px-4 py-3 text-center">
                <p className="text-sm font-medium text-blue-700">âœ… Offer sent! The poster has been notified.</p>
            </div>
        );
    }

    return (
        <div className="border-t border-blue-100 bg-blue-50/50">
            <form onSubmit={handleSubmit} className="px-4 py-3">
                <p className="text-xs font-semibold text-blue-700 mb-2">Make an Offer â€” describe what you&apos;re willing to trade:</p>
                <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="e.g. I have a PS5 controller I can trade for this..."
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                    rows={2}
                />
                <div className="flex justify-end gap-2 mt-2">
                    <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button type="submit" disabled={!message.trim() || submitting} className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {submitting ? 'Sending...' : 'Send Offer'}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ============================================================================
// EDIT POST MODAL
// ============================================================================
export function EditPostModal({ post, onClose, onSaved }: { post: CommunityPost; onClose: () => void; onSaved: (p: CommunityPost) => void }) {
    const [content, setContent] = useState(post.content);
    const [submitting, setSubmitting] = useState(false);

    const handleSave = async () => {
        if (!content.trim()) return;
        setSubmitting(true);
        try {
            const r = await apiClient.patch(`/community-posts/${post.id}`, { content: content.trim() });
            onSaved(r.data);
            onClose();
        } catch { }
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Post</h3>
                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[120px]"
                    maxLength={2000}
                />
                <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-gray-400">{content.length}/2000</span>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button onClick={handleSave} disabled={!content.trim() || submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                            {submitting ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MAIN POST CARD
// ============================================================================
interface PostCardProps {
    post: CommunityPost;
    onDelete?: (id: string) => void;
    onUpdate?: (post: CommunityPost) => void;
    savedIds?: string[];
    onToggleSave?: (id: string, saved: boolean) => void;
}

export default function PostCard({ post: initialPost, onDelete, onUpdate, savedIds = [], onToggleSave }: PostCardProps) {
    const user = useAuthStore(s => s.user);
    const [post, setPost] = useState(initialPost);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showOfferForm, setShowOfferForm] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const isOwner = user?.id === post.authorId;
    const author = post.author;
    const isSaved = savedIds.includes(post.id);

    const handleDelete = async () => {
        if (!confirm('Delete this post? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await apiClient.delete(`/community-posts/${post.id}`);
            onDelete?.(post.id);
        } catch { }
        setDeleting(false);
        setMenuOpen(false);
    };

    const handlePostUpdated = (updated: CommunityPost) => {
        setPost(updated);
        onUpdate?.(updated);
    };

    const handleToggleSave = async () => {
        if (!user) {
            alert('Please login to save posts.');
            return;
        }

        // Optimistic update
        onToggleSave?.(post.id, !isSaved);

        try {
            if (isSaved) {
                await apiClient.delete(`/community-posts/${post.id}/save`);
            } else {
                await apiClient.post(`/community-posts/${post.id}/save`);
            }
        } catch {
            // Revert on error
            onToggleSave?.(post.id, isSaved);
        }
    };

    return (
        <>
            <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition ${deleting ? 'opacity-50 pointer-events-none' : ''}`}>
                {/* HEADER */}
                <div className="flex items-start gap-3 p-4 pb-2">
                    <Link href={`/profile/${author.id}`}>
                        <img
                            src={getAvatarUrl(author)}
                            alt={getDisplayName(author)}
                            className="w-10 h-10 rounded-full object-cover border border-gray-100 hover:opacity-80 transition"
                        />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-x-1">
                            <Link href={`/profile/${author.id}`} className="font-semibold text-gray-900 text-sm hover:underline">
                                @{getDisplayName(author)}
                            </Link>
                            {isVerified(author) && <VerifiedBadge />}
                            {isBrand(author) && <BrandBadge />}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{timeAgo(post.createdAt)}</span>
                            {post.status === 'resolved' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold uppercase tracking-wide">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    Resolved
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wide">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    Active
                                </span>
                            )}
                        </div>
                    </div>

                    {/* TOP ACTIONS */}
                    <div className="flex items-center gap-1">
                        <ShareButton
                            title={`Post by ${getDisplayName(author)}`}
                            text={post.content.substring(0, 100)}
                            url={`${window.location.origin}/post/${post.id}`}
                            postId={post.id}
                        />

                        <button onClick={handleToggleSave} title={isSaved ? "Unsave Post" : "Save Post"} className={`p-1.5 rounded-full transition ${isSaved ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}>
                            {isSaved ? (
                                <Bookmark className="w-5 h-5 fill-current" />
                            ) : (
                                <Bookmark className="w-5 h-5" />
                            )}
                        </button>

                        {/* 3-DOT MENU */}
                        <div className="relative">
                            <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 hover:bg-gray-100 rounded-full transition">
                                <MoreVertical className="w-5 h-5 text-gray-400" />
                            </button>
                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                                    <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 min-w-[160px]">
                                        {isOwner ? (
                                            <>
                                                <button onClick={() => { setShowEditModal(true); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    Edit Post
                                                </button>
                                                <button onClick={handleDelete} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    Delete Post
                                                </button>
                                            </>
                                        ) : (
                                            <button onClick={() => { setShowReportModal(true); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                                                Report Post
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="px-4 pb-2">
                    <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
                </div>

                {/* HASHTAGS */}
                {post.hashtags.length > 0 && (
                    <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                        {post.hashtags.map(tag => (
                            <span key={tag} className="text-blue-600 text-xs font-medium">#{tag}</span>
                        ))}
                    </div>
                )}

                {/* IMAGES */}
                {post.images.length > 0 && (
                    <div className={`px-4 pb-3 grid gap-1.5 ${post.images.length === 1 ? 'grid-cols-1' : post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                        {post.images.slice(0, 4).map((img, i) => (
                            <img
                                key={i}
                                src={img}
                                alt={`Post image ${i + 1}`}
                                className={`rounded-lg object-cover w-full ${post.images.length === 1 ? 'max-h-80' : 'h-40'}`}
                            />
                        ))}
                    </div>
                )}

                {/* ACTION BAR */}
                <div className="flex items-center border-t border-gray-100 px-2">
                    <button
                        onClick={() => {
                            if (!user) {
                                toast.error('Please log in to make an offer.');
                                return;
                            }
                            setShowOfferForm(!showOfferForm); setShowComments(false);
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-lg transition ${showOfferForm ? 'text-blue-700 bg-blue-50' : 'text-blue-600 hover:bg-blue-50'}`}
                    >
                        <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span>Make Offer{post._count.offers > 0 ? ` (${post._count.offers})` : ''}</span>
                    </button>
                    <div className="w-px h-6 bg-gray-100" />
                    <button
                        onClick={() => { setShowComments(!showComments); setShowOfferForm(false); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-lg transition ${showComments ? 'text-gray-800 bg-gray-50' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>Comment{post._count.comments > 0 ? ` (${post._count.comments})` : ''}</span>
                    </button>
                </div>

                {/* EXPANDABLE SECTIONS */}
                {showOfferForm && !isOwner && <OfferForm postId={post.id} postAuthor={author} onClose={() => setShowOfferForm(false)} />}
                {showOfferForm && isOwner && (
                    <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-500 text-center bg-gray-50">
                        You can&apos;t make an offer on your own post.
                    </div>
                )}
                {showComments && <CommentSection postId={post.id} />}
            </div>

            {/* MODALS */}
            {showReportModal && <ReportModal postId={post.id} onClose={() => setShowReportModal(false)} />}
            {showEditModal && <EditPostModal post={post} onClose={() => setShowEditModal(false)} onSaved={handlePostUpdated} />}
        </>
    );
}
