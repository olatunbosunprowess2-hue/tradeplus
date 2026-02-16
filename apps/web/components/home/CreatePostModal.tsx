'use client';

import { useState, useRef } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useToastStore } from '@/lib/toast-store';
import apiClient from '@/lib/api-client';
import { PostLimitModal } from '@/components/PaywallModal';
import { initializePayment, redirectToPaystack, PurchaseType } from '@/lib/payments-api';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export default function CreatePostModal({ isOpen, onClose, onCreated }: CreatePostModalProps) {
    const user = useAuthStore(s => s.user);
    const [content, setContent] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const displayName = user?.profile?.displayName || user?.firstName || 'You';
    const avatarUrl = user?.profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'anon'}`;

    // Upload images to Cloudinary via API (Parallelized)
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const remainingSlots = 4 - images.length;
        if (remainingSlots <= 0) {
            useToastStore.getState().error('You can only upload up to 4 images.');
            return;
        }

        const filesToUpload = Array.from(files).slice(0, remainingSlots);
        setUploading(true);

        try {
            // Upload all images in parallel
            const uploadPromises = filesToUpload.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);
                try {
                    const r = await apiClient.post('/uploads', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    return r.data?.url || r.data?.secure_url || r.data;
                } catch (err) {
                    console.error('Single upload failed:', err);
                    return null;
                }
            });

            const results = await Promise.all(uploadPromises);
            const successfulUploads = results.filter((url): url is string => !!url);

            if (successfulUploads.length > 0) {
                setImages(prev => [...prev, ...successfulUploads]);
                if (successfulUploads.length < filesToUpload.length) {
                    useToastStore.getState().error('Some images failed to upload.');
                }
            } else {
                useToastStore.getState().error('Failed to upload images.');
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
        setImages(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        if (!content.trim()) return;
        setSubmitting(true);

        // Extract hashtags from content
        const hashtags = (content.match(/#(\w+)/g) || []).map(t => t.slice(1));

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
            useToastStore.getState().success('Post created successfully!');
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-[10vh] px-4 backdrop-blur-sm transition-all" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Create Post</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Author Row */}
                <div className="flex items-center gap-3 px-5 pt-4">
                    <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full border border-gray-100 object-cover" />
                    <div>
                        <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <p className="text-xs text-gray-500 font-medium">Posting to Community Feed</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-5 py-3">
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder="What's on your mind? Share a thought, ask a question, or list a trade..."
                        className="w-full border-0 resize-none text-base text-gray-800 placeholder:text-gray-400 focus:outline-none min-h-[140px] py-2"
                        maxLength={2000}
                        autoFocus
                    />
                </div>

                {/* Image Previews */}
                {images.length > 0 && (
                    <div className="px-5 pb-4">
                        <div className="grid grid-cols-4 gap-2">
                            {images.map((img, i) => (
                                <div key={i} className="relative group aspect-square">
                                    <img src={img} alt="" className="w-full h-full object-cover rounded-lg border border-gray-100" />
                                    <button
                                        onClick={() => removeImage(i)}
                                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition hover:bg-black/80"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            {uploading && (
                                <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 animate-pulse">
                                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer Action Bar */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <button
                                onClick={() => fileRef.current?.click()}
                                disabled={images.length >= 4 || uploading}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${images.length >= 4
                                    ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                                    : 'hover:bg-blue-50 text-gray-600 hover:text-blue-600'
                                    }`}
                                title="Add photos"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm font-medium">Add Photos</span>
                            </button>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                        </div>
                        <div className="text-xs text-gray-400 font-medium">
                            {content.length}/2000
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!content.trim() || submitting || uploading}
                        className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-md hover:shadow-lg transform active:scale-95"
                    >
                        {submitting ? 'Posting...' : 'Post'}
                    </button>
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
