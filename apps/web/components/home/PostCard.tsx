'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { sanitizeUrl } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/lib/auth-store';
import apiClient from '@/lib/api-client';
import type { CommunityPost, PostAuthor } from '@/lib/types';
import {
  Share2,
  Bookmark,
  MoreVertical,
  Send,
  Twitter,
  Facebook,
  Link as LinkIcon,
  ShieldCheck,
  MessageSquare,
  Repeat,
  Trash2,
  Edit,
  Flag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PremiumBadge from '../PremiumBadge';
import BrandBadge from '../BrandBadge';

// Lazy load heavy interactive components
const ReportModal = dynamic(() => import('./ReportModal'), { ssr: false });
const EditPostModal = dynamic(() => import('./EditPostModal'), { ssr: false });
const OfferForm = dynamic(() => import('./OfferForm'), {
  ssr: false,
  loading: () => <div className="p-4 text-center text-xs text-slate-500">Loading offer form...</div>,
});
const CommentSection = dynamic(() => import('./CommentSection'), {
  ssr: false,
  loading: () => <div className="p-4 text-center text-xs text-slate-500">Loading comments...</div>,
});

function getDisplayName(author: PostAuthor): string {
  return (
    author.profile?.displayName ||
    author.brandName ||
    [author.firstName, author.lastName].filter(Boolean).join(' ') ||
    'Anonymous'
  );
}

function getAvatarUrl(author: PostAuthor): string | null {
  return author.profile?.avatarUrl || null;
}

function AvatarPlaceholder({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const colors = [
    'bg-slate-100 text-slate-700',
    'bg-blue-50 text-blue-700',
    'bg-indigo-50 text-indigo-700',
    'bg-emerald-50 text-emerald-700',
    'bg-amber-50 text-amber-700',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorClass = colors[Math.abs(hash) % colors.length];

  return (
    <div
      className={`w-full h-full rounded-md flex items-center justify-center text-xs font-bold border border-slate-200 ${colorClass}`}
    >
      {initials}
    </div>
  );
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

function ShareButton({
  title,
  text,
  url,
  postId,
}: {
  title: string;
  text: string;
  url: string;
  postId: string;
}) {
  const [open, setOpen] = useState(false);

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: <Send className="w-3.5 h-3.5 text-emerald-600" />,
      href: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
    },
    {
      name: 'Twitter / X',
      icon: <Twitter className="w-3.5 h-3.5 text-slate-900" />,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text
      )}&url=${encodeURIComponent(url)}`,
    },
    {
      name: 'Facebook',
      icon: <Facebook className="w-3.5 h-3.5 text-blue-600" />,
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

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`p-1.5 rounded-md transition-colors ${
          open ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
        }`}
        title="Share"
      >
        <Share2 className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 min-w-[180px] origin-top-right">
            <p className="px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 mb-0.5">
              Share Post
            </p>

            {shareLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {link.icon}
                <span>{link.name}</span>
              </a>
            ))}

            <div className="h-px bg-slate-100 my-1" />

            <button
              onClick={copyToClipboard}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
            >
              <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy Link</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

interface PostCardProps {
  post: CommunityPost;
  onDelete?: (id: string) => void;
  onUpdate?: (post: CommunityPost) => void;
  savedIds?: string[];
  onToggleSave?: (id: string, saved: boolean) => void;
}

export default function PostCard({
  post: initialPost,
  onDelete,
  onUpdate,
  savedIds = [],
  onToggleSave,
}: PostCardProps) {
  const user = useAuthStore((s) => s.user);
  const [post, setPost] = useState(initialPost);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const isOwner = user?.id === post.authorId;
  const author = post.author;
  const isSaved = savedIds.includes(post.id);

  const handleDelete = async () => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/community-posts/${post.id}`);
      onDelete?.(post.id);
    } catch {}
    setDeleting(false);
    setMenuOpen(false);
  };

  const handlePostUpdated = (updated: CommunityPost) => {
    setPost(updated);
    onUpdate?.(updated);
  };

  const handleToggleSave = async () => {
    if (!user) {
      toast.error('Please login to save posts.');
      return;
    }

    onToggleSave?.(post.id, !isSaved);

    try {
      if (isSaved) {
        await apiClient.delete(`/community-posts/${post.id}/save`);
      } else {
        await apiClient.post(`/community-posts/${post.id}/save`);
      }
    } catch {
      onToggleSave?.(post.id, isSaved);
    }
  };

  return (
    <>
      <div
        className={`bg-white rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-all overflow-hidden mb-3 ${
          deleting ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3 p-3.5 sm:p-4 pb-2">
          <div className="flex items-start gap-3 min-w-0">
            {/* Square Avatar */}
            <Link href={`/profile/${author.id}`} className="shrink-0 relative w-9 h-9">
              {getAvatarUrl(author) ? (
                <Image
                  src={sanitizeUrl(getAvatarUrl(author)!)}
                  alt={getDisplayName(author)}
                  fill
                  className="rounded-md object-cover border border-slate-200 hover:opacity-80 transition"
                  sizes="36px"
                />
              ) : (
                <AvatarPlaceholder name={getDisplayName(author)} />
              )}
            </Link>

            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-1.5">
                <Link
                  href={`/profile/${author.id}`}
                  className="font-bold text-slate-900 text-xs sm:text-sm hover:text-blue-600 transition-colors truncate"
                >
                  @{getDisplayName(author)}
                </Link>
                {isVerified(author) && (
                  <span
                    title="Verified User"
                    className="inline-flex items-center p-0.5 rounded bg-blue-50 border border-blue-200 text-blue-600"
                  >
                    <ShieldCheck className="w-3 h-3" />
                  </span>
                )}
                {isBrand(author) && <BrandBadge size="xs" />}
                {author.tier === 'premium' && <PremiumBadge size="xs" />}
              </div>

              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {timeAgo(post.createdAt)}
              </p>
            </div>
          </div>

          {/* TOP RIGHT CONTROLS */}
          <div className="flex items-center gap-1 shrink-0">
            {post.status === 'resolved' && (
              <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded mr-1">
                Resolved
              </span>
            )}

            <ShareButton
              title={`Post by ${getDisplayName(author)}`}
              text={post.content.substring(0, 100)}
              url={`${typeof window !== 'undefined' ? window.location.origin : ''}/post/${post.id}`}
              postId={post.id}
            />

            <button
              onClick={handleToggleSave}
              title={isSaved ? 'Unsave Post' : 'Save Post'}
              className={`p-1.5 rounded-md transition-colors ${
                isSaved
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>

            {/* 3-DOT MENU */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                title="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-7 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 min-w-[140px]">
                    {isOwner ? (
                      <>
                        <button
                          onClick={() => {
                            setShowEditModal(true);
                            setMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-500" />
                          <span>Edit Post</span>
                        </button>
                        <button
                          onClick={handleDelete}
                          className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Delete Post</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setShowReportModal(true);
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <Flag className="w-3.5 h-3.5 text-rose-500" />
                        <span>Report Post</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="px-3.5 sm:px-4 pb-2.5">
          <p className="text-slate-800 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
            {isExpanded || post.content.length <= 600
              ? post.content
              : `${post.content.substring(0, 600)}... `}
            {post.content.length > 600 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-600 font-bold hover:underline ml-1"
              >
                {isExpanded ? 'See less' : 'See more'}
              </button>
            )}
          </p>
        </div>

        {/* HASHTAGS */}
        {post.hashtags.length > 0 && (
          <div className="px-3.5 sm:px-4 pb-2.5 flex flex-wrap gap-1.5">
            {post.hashtags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* IMAGES */}
        {post.images.length > 0 && (
          <div
            className={`px-3.5 sm:px-4 pb-3 grid gap-2 ${
              post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
            }`}
          >
            {post.images.slice(0, 4).map((img, i) => (
              <div
                key={i}
                className={`relative ${
                  post.images.length === 1 ? 'h-64 sm:h-72' : 'h-36 sm:h-44'
                } w-full rounded-md overflow-hidden border border-slate-200`}
              >
                <Image
                  src={sanitizeUrl(img)}
                  alt={`Post attachment ${i + 1}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>
        )}

        {/* ACTION BAR */}
        <div className="flex items-center gap-2 border-t border-slate-100 p-2 sm:px-4 bg-slate-50/50">
          <button
            onClick={() => {
              if (!user) {
                toast.error('Please log in to make an offer.');
                return;
              }
              setShowOfferForm(!showOfferForm);
              setShowComments(false);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-md transition-colors ${
              showOfferForm
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 shadow-2xs'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Make Offer{post._count.offers > 0 ? ` (${post._count.offers})` : ''}</span>
          </button>

          <button
            onClick={() => {
              setShowComments(!showComments);
              setShowOfferForm(false);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-md transition-colors ${
              showComments
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comment{post._count.comments > 0 ? ` (${post._count.comments})` : ''}</span>
          </button>
        </div>

        {/* EXPANDABLE SECTIONS */}
        {showOfferForm && !isOwner && (
          <OfferForm
            postId={post.id}
            postAuthor={author}
            onClose={() => setShowOfferForm(false)}
          />
        )}
        {showOfferForm && isOwner && (
          <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500 text-center bg-slate-50">
            You cannot make an offer on your own post.
          </div>
        )}
        {showComments && <CommentSection postId={post.id} />}
      </div>

      {/* MODALS */}
      {showReportModal && (
        <ReportModal postId={post.id} onClose={() => setShowReportModal(false)} />
      )}
      {showEditModal && (
        <EditPostModal
          post={post}
          onClose={() => setShowEditModal(false)}
          onSaved={handlePostUpdated}
        />
      )}
    </>
  );
}
