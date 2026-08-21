'use client';

import { useState, useRef } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useToastStore } from '@/lib/toast-store';
import apiClient from '@/lib/api-client';
import { PostLimitModal } from '@/components/PaywallModal';
import { initializePayment, redirectToPaystack, PurchaseType } from '@/lib/payments-api';
import { sanitizeUrl } from '@/lib/utils';
import { X, Image as ImageIcon, Loader2, Sparkles, Plus, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreatePostModal({ isOpen, onClose, onCreated }: CreatePostModalProps) {
  const user = useAuthStore((s) => s.user);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const displayName = user?.profile?.displayName || user?.firstName || 'Trader';
  const avatarUrl =
    sanitizeUrl(user?.profile?.avatarUrl) ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'anon'}`;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 4 - images.length;
    if (remainingSlots <= 0) {
      useToastStore.getState().error('You can upload up to 4 photos.');
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
          console.error('Upload failed:', err);
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((url): url is string => !!url);

      if (successfulUploads.length > 0) {
        setImages((prev) => [...prev, ...successfulUploads]);
      } else {
        useToastStore.getState().error('Failed to upload image. Please try again.');
      }
    } catch (err) {
      console.error('Upload batch failed:', err);
      useToastStore.getState().error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);

    const hashtags = (content.match(/#(\w+)/g) || []).map((t) => t.slice(1));

    try {
      await apiClient.post('/community-posts', {
        content: content.trim(),
        hashtags,
        images,
      });
      setContent('');
      setImages([]);
      onCreated();
      onClose();
      useToastStore.getState().success('Trade request published to the board!');
    } catch (err: any) {
      console.error('Failed to create post:', err);
      const errorMsg = err.response?.data?.message || err.message || '';

      if (errorMsg.includes('DAILY_POST_LIMIT_REACHED')) {
        setShowLimitModal(true);
      } else {
        useToastStore.getState().error(errorMsg || 'Failed to create post. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaywallSelect = async (type: string, currency: 'NGN' | 'USD' = 'NGN') => {
    setIsPaymentLoading(true);
    try {
      const result = await initializePayment(type as PurchaseType, undefined, currency);
      if (result?.authorizationUrl) {
        redirectToPaystack(result.authorizationUrl);
      }
    } catch (error) {
      useToastStore.getState().error('Payment initialization failed');
    } finally {
      setIsPaymentLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 z-[10050] flex items-start justify-center pt-[10vh] px-4 backdrop-blur-xs transition-all"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Post Trade Request / Want</h2>
            <p className="text-[11px] text-slate-500">
              Publish to the Trade Requests &amp; Wants Board
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-md transition-colors text-slate-500 hover:text-slate-900"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Author Row */}
        <div className="flex items-center gap-3 px-5 pt-4">
          <div className="w-9 h-9 rounded-md overflow-hidden border border-slate-200 shrink-0 relative bg-slate-100">
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-slate-900">{displayName}</p>
              {user?.isVerified && (
                <span className="p-0.5 rounded bg-blue-50 border border-blue-200 text-blue-600">
                  <ShieldCheck className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Public marketplace request</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe the item you want to buy, barter, or swap. Mention your budget, condition, and location (e.g. #Lekki #iPhone)..."
            className="w-full border border-slate-200 rounded-md p-3 resize-none text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 min-h-[130px] leading-relaxed shadow-2xs"
            maxLength={2000}
            autoFocus
          />
        </div>

        {/* Image Previews */}
        {images.length > 0 && (
          <div className="px-5 pb-3">
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="relative group aspect-square rounded-md overflow-hidden border border-slate-200 shadow-2xs"
                >
                  <img src={sanitizeUrl(img)} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-slate-900/80 text-white rounded flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition hover:bg-rose-600"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {uploading && (
                <div className="aspect-square bg-slate-50 rounded-md flex items-center justify-center border border-slate-200 animate-pulse">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Action Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={images.length >= 4 || uploading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 transition-colors shadow-2xs disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>
                  {uploading
                    ? 'Uploading...'
                    : images.length > 0
                    ? `Photos (${images.length}/4)`
                    : 'Add Photos'}
                </span>
              </button>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {content.length}/2000
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || submitting || uploading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-md shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <span>Publish Request</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <PostLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        onSelectOption={handlePaywallSelect}
        isLoading={isPaymentLoading}
      />
    </div>
  );
}
