'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import type { PostComment as PostCommentType, PostAuthor } from '@/lib/types';
import PremiumBadge from '../PremiumBadge';
import BrandBadge from '../BrandBadge';
import { sanitizeUrl } from '@/lib/utils';
import {
  ShieldCheck,
  Image as ImageIcon,
  X,
  Loader2,
  Send,
  CornerDownRight,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

function getDisplayName(author: PostAuthor): string {
  return (
    author.profile?.displayName ||
    author.brandName ||
    [author.firstName, author.lastName].filter(Boolean).join(' ') ||
    'Anonymous'
  );
}

function getAvatarUrl(author: PostAuthor): string {
  return (
    author.profile?.avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.id}`
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

// Parse comment text for images attached via [Photo]: url format
function parseCommentContent(text: string): { cleanText: string; imageUrls: string[] } {
  const photoRegex = /\[Photo\]:\s*(\S+)/g;
  const imageUrls: string[] = [];
  let match;

  while ((match = photoRegex.exec(text)) !== null) {
    imageUrls.push(match[1]);
  }

  const cleanText = text.replace(photoRegex, '').trim();
  return { cleanText, imageUrls };
}

export default function CommentSection({ postId }: { postId: string }) {
  const user = useAuthStore((s) => s.user);
  const [comments, setComments] = useState<PostCommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State to track which comment we are currently replying to
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    apiClient
      .get(`/community-posts/${postId}/comments`)
      .then((r) => {
        if (mounted) {
          setComments(r.data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [postId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 2 - images.length;
    if (remainingSlots <= 0) {
      toast.error('You can attach up to 2 photos per response.');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
          const r = await apiClient.post('/uploads', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return r.data?.url || r.data?.secure_url || r.data;
        } catch (err) {
          console.error('Comment upload failed:', err);
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((url): url is string => !!url);

      if (successfulUploads.length > 0) {
        setImages((prev) => [...prev, ...successfulUploads]);
        toast.success(`Attached ${successfulUploads.length} photo(s)`);
      } else {
        toast.error('Failed to upload image.');
      }
    } catch (err) {
      console.error('Comment image error:', err);
      toast.error('Image upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && images.length === 0) return;
    setSubmitting(true);

    try {
      let finalContent = newComment.trim();
      if (images.length > 0) {
        const imageLinks = images.map((img) => `\n[Photo]: ${img}`).join('');
        finalContent = `${finalContent}\n${imageLinks}`.trim();
      }

      const payload = {
        content: finalContent,
        ...(replyTo?.id ? { parentId: replyTo.id } : {}),
      };

      const r = await apiClient.post(`/community-posts/${postId}/comments`, payload);

      if (replyTo?.id) {
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === replyTo.id) {
              return { ...c, replies: [...(c.replies || []), r.data] };
            }
            return c;
          })
        );
      } else {
        setComments((prev) => [...prev, r.data]);
      }

      setNewComment('');
      setImages([]);
      setReplyTo(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to post response.');
    }
    setSubmitting(false);
  };

  // Render a single comment and its nested replies
  const CommentItem = ({ c, isReply = false }: { c: PostCommentType; isReply?: boolean }) => {
    const { cleanText, imageUrls } = parseCommentContent(c.content);

    return (
      <div className={`flex gap-2.5 ${isReply ? 'mt-2.5 relative' : 'px-3.5 sm:px-4 py-2.5'}`}>
        {/* Visual thread line for replies */}
        {isReply && (
          <div className="absolute -left-5 top-3 w-4 border-t-2 border-l-2 border-slate-200 rounded-tl-md h-full -mt-2" />
        )}

        <Link href={`/profile/${c.authorId}`} className="shrink-0">
          <img
            src={sanitizeUrl(getAvatarUrl(c.author))}
            alt=""
            className={`${
              isReply ? 'w-6 h-6' : 'w-7 h-7'
            } rounded-md object-cover border border-slate-200 mt-0.5 hover:opacity-80 transition`}
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="bg-slate-50 border border-slate-200/90 rounded-md p-2.5 sm:p-3 shadow-2xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/profile/${c.authorId}`}
                className="text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors"
              >
                {getDisplayName(c.author)}
              </Link>
              {isVerified(c.author) && (
                <span className="p-0.5 rounded bg-blue-50 border border-blue-200 text-blue-600">
                  <ShieldCheck className="w-2.5 h-2.5" />
                </span>
              )}
              {isBrand(c.author) && <BrandBadge size="xs" />}
              {c.author.tier === 'premium' && <PremiumBadge size="xs" />}
              <span className="text-[10px] text-slate-400 font-medium ml-1">
                {timeAgo(c.createdAt)}
              </span>
            </div>

            {cleanText && (
              <p className="text-xs text-slate-800 mt-1 leading-relaxed break-words whitespace-pre-wrap">
                {cleanText}
              </p>
            )}

            {/* Render Attached Photos */}
            {imageUrls.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                {imageUrls.map((url, idx) => (
                  <a
                    key={idx}
                    href={sanitizeUrl(url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-md overflow-hidden border border-slate-200 block group"
                  >
                    <Image
                      src={sanitizeUrl(url)}
                      alt="Comment Attachment"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Comment Actions */}
          <div className="flex items-center gap-3 mt-1 ml-1">
            {user && !isReply && (
              <button
                onClick={() => setReplyTo({ id: c.id, name: getDisplayName(c.author) })}
                className="text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                <CornerDownRight className="w-3 h-3" />
                <span>Reply</span>
              </button>
            )}
          </div>

          {/* Render Nested Replies */}
          {c.replies && c.replies.length > 0 && (
            <div className="ml-2 pl-3 border-l-2 border-slate-200 mt-1 space-y-1">
              {c.replies.map((reply) => (
                <CommentItem key={reply.id} c={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="border-t border-slate-200 bg-slate-50/40">
      {loading ? (
        <div className="p-4 flex justify-center">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
        </div>
      ) : (
        <>
          <div className="max-h-96 overflow-y-auto py-2 divide-y divide-slate-100">
            {comments.length === 0 && (
              <div className="p-6 text-center">
                <MessageSquare className="w-5 h-5 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-700">No responses yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Have a matching item or advice? Start the discussion below.
                </p>
              </div>
            )}
            {comments.map((c) => (
              <CommentItem key={c.id} c={c} />
            ))}
          </div>

          {user && (
            <div className="p-3 sm:p-3.5 border-t border-slate-200 bg-white">
              {/* Reply Indicator Target */}
              {replyTo && (
                <div className="flex items-center justify-between bg-blue-50 px-2.5 py-1 rounded-t-md border border-blue-200 border-b-0 mb-1">
                  <span className="text-[11px] font-medium text-blue-700">
                    Replying to <span className="font-bold">@{replyTo.name}</span>
                  </span>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="text-blue-500 hover:text-blue-700 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-2">
                <div className="flex items-start gap-2">
                  <img
                    src={sanitizeUrl(
                      user.profile?.avatarUrl ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                    )}
                    alt=""
                    className="w-7 h-7 rounded-md object-cover border border-slate-200 shrink-0 mt-0.5"
                  />
                  <div className="flex-1 space-y-1.5">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={
                        replyTo
                          ? 'Write your reply...'
                          : 'Write a response or counter-offer...'
                      }
                      className="w-full bg-slate-50 border border-slate-300 resize-none p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white rounded-md min-h-[56px] transition-all shadow-2xs leading-relaxed"
                      autoFocus={!!replyTo}
                    />

                    {/* Image Previews */}
                    {images.length > 0 && (
                      <div className="flex items-center gap-2 pt-0.5">
                        {images.map((img, i) => (
                          <div
                            key={i}
                            className="relative w-12 h-12 rounded-md overflow-hidden border border-slate-300 shadow-2xs"
                          >
                            <Image
                              src={sanitizeUrl(img)}
                              alt=""
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="absolute top-0.5 right-0.5 bg-slate-900/80 text-white rounded p-0.5 hover:bg-rose-600 transition-colors"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bottom Action Bar */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={images.length >= 2 || uploading}
                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded text-[11px] font-semibold transition-colors disabled:opacity-50"
                        >
                          {uploading ? (
                            <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                          ) : (
                            <ImageIcon className="w-3 h-3 text-slate-500" />
                          )}
                          <span>
                            {uploading
                              ? 'Uploading...'
                              : images.length > 0
                              ? `Photos (${images.length}/2)`
                              : 'Add Photo'}
                          </span>
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={(!newComment.trim() && images.length === 0) || submitting || uploading}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs"
                      >
                        {submitting ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        <span>{replyTo ? 'Reply' : 'Respond'}</span>
                      </button>
                    </div>
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
