'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import apiClient from '@/lib/api-client';

export default function ReportModal({ postId, onClose }: { postId: string; onClose: () => void }) {
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
