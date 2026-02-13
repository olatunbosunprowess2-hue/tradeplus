'use client';

import { useState, useRef } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useToastStore } from '@/lib/toast-store';
import apiClient from '@/lib/api-client';

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
    const fileRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const displayName = user?.profile?.displayName || user?.firstName || 'You';
    const avatarUrl = user?.profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'anon'}`;

    // Upload images to Cloudinary via API
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const remaining = 4 - images.length;
        const toUpload = Array.from(files).slice(0, remaining);

        setUploading(true);
        for (const file of toUpload) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                const r = await apiClient.post('/uploads', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                const url = r.data?.url || r.data?.secure_url || r.data;
                if (typeof url === 'string') {
                    setImages(prev => [...prev, url]);
                }
            } catch (err) {
                console.error('Upload failed:', err);
            }
        }
        setUploading(false);
        if (fileRef.current) fileRef.current.value = '';
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
            useToastStore.getState().error(err.response?.data?.message || 'Failed to create post. Please try again.');
        }
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[10vh] px-4" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Create Post</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Author Row */}
                <div className="flex items-center gap-3 px-5 pt-4">
                    <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full border border-gray-100" />
                    <div>
                        <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                        <p className="text-xs text-gray-400">Posting to Community Feed</p>
                    </div>
                </div>

                {/* Content */}
                <div className="px-5 py-3">
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder="What do you want to trade, share, or discuss? Use #hashtags to help others find your post..."
                        className="w-full border-0 resize-none text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none min-h-[120px]"
                        maxLength={2000}
                        autoFocus
                    />
                    <div className="text-right">
                        <span className={`text-xs ${content.length > 1900 ? 'text-red-500' : 'text-gray-300'}`}>{content.length}/2000</span>
                    </div>
                </div>

                {/* Image Previews */}
                {images.length > 0 && (
                    <div className="px-5 pb-3 grid grid-cols-4 gap-2">
                        {images.map((img, i) => (
                            <div key={i} className="relative group">
                                <img src={img} alt="" className="w-full h-20 object-cover rounded-lg" />
                                <button
                                    onClick={() => removeImage(i)}
                                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fileRef.current?.click()}
                            disabled={images.length >= 4 || uploading}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-40"
                        >
                            {uploading ? (
                                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            )}
                            Photo ({images.length}/4)
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

                    <button
                        onClick={handleSubmit}
                        disabled={!content.trim() || submitting}
                        className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                        {submitting ? 'Posting...' : 'Post'}
                    </button>
                </div>
            </div>
        </div>
    );
}
