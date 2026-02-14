'use client';

import { useState } from 'react';
import apiClient from '@/lib/api-client';
import type { CommunityPost } from '@/lib/types';

export default function EditPostModal({ post, onClose, onSaved }: { post: CommunityPost; onClose: () => void; onSaved: (p: CommunityPost) => void }) {
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
