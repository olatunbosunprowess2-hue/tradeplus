'use client';

import { useState, useRef } from 'react';
import apiClient from '@/lib/api-client';
import { useMessagesStore } from '@/lib/messages-store';
import type { PostAuthor } from '@/lib/types';
import toast from 'react-hot-toast';
import { OfferLimitModal } from '@/components/PaywallModal';
import { initializePayment, redirectToPaystack, PurchaseType } from '@/lib/payments-api';
import { sanitizeUrl } from '@/lib/utils';
import { Image as ImageIcon, X, Loader2, Send, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export default function OfferForm({
  postId,
  postAuthor,
  onClose,
}: {
  postId: string;
  postAuthor: PostAuthor;
  onClose: () => void;
}) {
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createConversation } = useMessagesStore();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 3 - images.length;
    if (remainingSlots <= 0) {
      toast.error('You can upload up to 3 photos per offer.');
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
        toast.success(`Attached ${successfulUploads.length} photo(s)`);
      } else {
        toast.error('Failed to upload image. Please try again.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Image upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && images.length === 0) {
      toast.error('Please describe what you are offering or attach photos.');
      return;
    }

    setSubmitting(true);
    try {
      // Build offer text with image attachments
      let finalOfferText = message.trim();
      if (images.length > 0) {
        const imageLinks = images.map((img) => `\n[Photo]: ${img}`).join('');
        finalOfferText = `${finalOfferText}\n${imageLinks}`.trim();
      }

      await apiClient.post(`/community-posts/${postId}/offers`, { message: finalOfferText });

      // Create a message conversation with the post author
      const authorName =
        postAuthor.profile?.displayName ||
        postAuthor.brandName ||
        [postAuthor.firstName, postAuthor.lastName].filter(Boolean).join(' ') ||
        'User';
      const authorAvatar = sanitizeUrl(postAuthor.profile?.avatarUrl);
      createConversation(postAuthor.id, authorName, authorAvatar);

      // Send the offer as a direct message
      try {
        const { sendMessage } = useMessagesStore.getState();
        await sendMessage(
          postAuthor.id,
          `🤝 New Trade Offer on your post:\n"${message.trim()}"${
            images.length > 0 ? `\n(${images.length} photo(s) attached)` : ''
          }`
        );
      } catch {
        /* best-effort */
      }

      setSubmitted(true);
      toast.success('Trade offer sent! The seller has been notified.');
      setTimeout(onClose, 1500);
    } catch (err: any) {
      console.error('Failed to send offer:', err);
      const errorMsg = err.response?.data?.message || err.message || '';

      if (errorMsg.includes('DAILY_OFFER_LIMIT_REACHED')) {
        setShowLimitModal(true);
      } else {
        toast.error(errorMsg || 'Failed to send offer. Please try again.');
      }
    }
    setSubmitting(false);
  };

  const handlePaywallSelect = async (type: string, currency: 'NGN' | 'USD' = 'NGN') => {
    setIsPaymentLoading(true);
    try {
      const result = await initializePayment(type as PurchaseType, undefined, currency);
      if (result?.authorizationUrl) {
        redirectToPaystack(result.authorizationUrl);
      }
    } catch (error) {
      toast.error('Payment initialization failed');
    } finally {
      setIsPaymentLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="border-t border-emerald-100 bg-emerald-50/80 p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-emerald-800 font-bold text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Trade offer submitted! Check your direct messages for updates.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-200 bg-slate-50/70 p-3.5 sm:p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-900">Make a Trade Offer</p>
            <p className="text-[11px] text-slate-500">
              Describe your swap item or cash balance, and attach photos if available.
            </p>
          </div>
        </div>

        {/* Text Area */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. I have a clean iPhone 13 Pro 256GB + ₦30,000 cash balance to trade for this..."
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white shadow-2xs leading-relaxed"
          rows={3}
        />

        {/* Attached Photos Strip */}
        {images.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            {images.map((img, i) => (
              <div
                key={i}
                className="relative w-14 h-14 rounded-md overflow-hidden border border-slate-300 group shadow-2xs"
              >
                <Image
                  src={sanitizeUrl(img)}
                  alt={`Attachment ${i + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-0.5 right-0.5 bg-slate-900/80 text-white rounded p-0.5 hover:bg-rose-600 transition-colors"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1">
          {/* Add Image Button */}
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
              disabled={uploading || images.length >= 3}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 transition-colors shadow-2xs disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{uploading ? 'Uploading...' : images.length > 0 ? 'Add More Photos' : 'Attach Photos'}</span>
            </button>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={(!message.trim() && images.length === 0) || submitting || uploading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-md transition-colors shadow-xs disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  <span>Send Offer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <OfferLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        onSelectOption={handlePaywallSelect}
        isLoading={isPaymentLoading}
      />
    </div>
  );
}
