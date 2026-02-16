'use client';

import { useState } from 'react';
import apiClient from '@/lib/api-client';
import { useMessagesStore } from '@/lib/messages-store';
import type { PostAuthor } from '@/lib/types';
import toast from 'react-hot-toast';

export default function OfferForm({ postId, postAuthor, onClose }: { postId: string; postAuthor: PostAuthor; onClose: () => void }) {
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
                await sendMessage(postAuthor.id, `🤝 New Community Offer: ${message.trim()}`);
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
                <p className="text-sm font-medium text-blue-700">✅ Offer sent! The poster has been notified.</p>
            </div>
        );
    }

    return (
        <div className="border-t border-blue-100 bg-blue-50/50">
            <form onSubmit={handleSubmit} className="px-4 py-3">
                <p className="text-xs font-semibold text-blue-700 mb-2">Make an Offer — describe what you&apos;re willing to trade:</p>
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
