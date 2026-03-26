'use client';

import { useState } from 'react';
import type { User } from '@/lib/types';
import { toast } from 'react-hot-toast';
import { ADMIN_TEMPLATES, getTemplatesByType } from '@/lib/admin-templates';
import { sanitizeUrl } from '@/lib/utils';

interface ModalProps {
    user: User;
    onClose: () => void;
    onDecision: (userId: string, decision: 'APPROVE' | 'REJECT', reason?: string) => void;
}

export default function VerificationReviewModal({ user, onClose, onDecision }: ModalProps) {
    const [rejectReason, setRejectReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleApprove = async () => {
        if (isProcessing) return;
        setIsProcessing(true);

        toast.success(`Approved ${user.profile?.displayName}`);
        await onDecision(user.id, 'APPROVE');
    };

    const handleRejectClick = () => {
        setIsRejecting(true);
    };

    const handleConfirmReject = async () => {
        if (!rejectReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        if (isProcessing) return;
        setIsProcessing(true);

        console.log(`Sending rejection email to ${user.email}. Reason: ${rejectReason}`);
        toast.success(`Rejected ${user.profile?.displayName}. Email sent.`);
        await onDecision(user.id, 'REJECT', rejectReason);
    };

    const handleTemplateChange = (templateId: string) => {
        if (templateId) {
            const template = ADMIN_TEMPLATES.find(t => t.id === templateId);
            if (template) {
                setRejectReason(template.message);
            }
        } else {
            setRejectReason('');
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Review Verification</h2>
                        <p className="text-gray-500">User: {user.firstName} {user.lastName} ({user.email})</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Profile Info + Selfie side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Profile Info */}
                        <div className="bg-gray-50 p-5 rounded-xl">
                            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Profile Info
                            </h3>
                            <div className="space-y-2.5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Name</span>
                                    <span className="text-gray-900 font-medium">{user.firstName} {user.lastName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Bio</span>
                                    <span className="text-gray-900 font-medium text-right max-w-[60%] truncate">{user.profile?.bio || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Phone</span>
                                    <span className="text-gray-900 font-medium">{user.phoneNumber || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Location</span>
                                    <span className="text-gray-900 font-medium text-right max-w-[60%] truncate">{user.locationAddress || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Selfie */}
                        <div className="bg-gray-50 p-5 rounded-xl">
                            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Verification Selfie
                            </h3>
                            <div className="aspect-[4/3] bg-black rounded-lg overflow-hidden">
                                <img
                                    src={sanitizeUrl(user.faceVerificationUrl) || 'https://placehold.co/400x300?text=No+Selfie'}
                                    alt="Verification Selfie"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = 'https://placehold.co/400x300?text=Error+Loading+Image';
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Verification checklist for reviewer */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2">Review Checklist</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-blue-700">
                            <span>✓ Face is clearly visible & centered</span>
                            <span>✓ Good lighting, not blurry</span>
                            <span>✓ No sunglasses, masks, or filters</span>
                            <span>✓ Only one person in the photo</span>
                        </div>
                    </div>

                </div>

                {/* Footer / Actions */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
                    {isRejecting ? (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Quick Templates</label>
                                <select
                                    onChange={(e) => handleTemplateChange(e.target.value)}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 bg-white"
                                >
                                    <option value="">-- Select a reason --</option>
                                    {getTemplatesByType('verification_reject').map(template => (
                                        <option key={template.id} value={template.id}>
                                            {template.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <label className="block text-sm font-medium text-gray-700">Reason for Rejection (will be emailed to user)</label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                placeholder="e.g. Selfie is blurry, face not clearly visible, wearing sunglasses..."
                                rows={3}
                            />
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setIsRejecting(false)}
                                    disabled={isProcessing}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmReject}
                                    disabled={isProcessing}
                                    className={`px-6 py-2 rounded-lg font-bold shadow-sm ${isProcessing ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'} text-white`}
                                >
                                    {isProcessing ? 'Processing...' : 'Confirm Rejection'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-4 justify-end">
                            <button
                                onClick={onClose}
                                disabled={isProcessing}
                                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectClick}
                                disabled={isProcessing}
                                className="px-6 py-3 bg-white border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition disabled:opacity-50"
                            >
                                Reject
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={isProcessing}
                                className={`px-8 py-3 rounded-xl font-bold shadow-lg transition transform ${isProcessing ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700 hover:-translate-y-0.5'} text-white`}
                            >
                                {isProcessing ? 'Processing...' : 'Approve Verification'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
