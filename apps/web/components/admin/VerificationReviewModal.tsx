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
        if (isProcessing) return; // Prevent multiple clicks
        setIsProcessing(true);

        toast.success(`Approved ${user.profile?.displayName}`);
        await onDecision(user.id, 'APPROVE');
        // Don't reset isProcessing - modal will close
    };

    const handleRejectClick = () => {
        setIsRejecting(true);
    };

    const handleConfirmReject = async () => {
        if (!rejectReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        if (isProcessing) return; // Prevent multiple clicks
        setIsProcessing(true);

        console.log(`Sending rejection email to ${user.email}. Reason: ${rejectReason}`);
        toast.success(`Rejected ${user.profile?.displayName}. Email sent.`);
        // Pass rejection reason to onDecision
        await onDecision(user.id, 'REJECT', rejectReason);
        // Don't reset isProcessing - modal will close
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Review Verification</h2>
                        <p className="text-gray-500">User: {user.firstName} {user.lastName} ({user.email})</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">

                    {/* User Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <h3 className="font-semibold text-gray-700 mb-2">Profile Info</h3>
                            <div className="space-y-2 text-sm">
                                <p><span className="text-gray-600 font-semibold">Name:</span> <span className="text-gray-900">{user.firstName} {user.lastName}</span></p>
                                <p><span className="text-gray-600 font-semibold">Bio:</span> <span className="text-gray-900">{user.profile?.bio || 'N/A'}</span></p>
                                <p><span className="text-gray-600 font-semibold">Phone:</span> <span className="text-gray-900">{user.phoneNumber}</span></p>
                                <p><span className="text-gray-600 font-semibold">Location:</span> <span className="text-gray-900">{user.locationAddress}</span></p>
                            </div>
                        </div>

                        {/* Selfie */}
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <h3 className="font-semibold text-gray-700 mb-2">Live Selfie</h3>
                            <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                <img
                                    src={sanitizeUrl(user.faceVerificationUrl) || 'https://placehold.co/400x300?text=No+Image'}
                                    alt="Selfie"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = 'https://placehold.co/400x300?text=Error+Loading+Image';
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ID Documents */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-4">Government ID</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Front Side</p>
                                <div className="aspect-[3/2] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                    <img
                                        src={sanitizeUrl(user.idDocumentFrontUrl) || 'https://placehold.co/600x400?text=No+Image'}
                                        alt="ID Front"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://placehold.co/600x400?text=Error+Loading+Image';
                                        }}
                                    />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Back Side</p>
                                <div className="aspect-[3/2] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                    <img
                                        src={sanitizeUrl(user.idDocumentBackUrl) || 'https://placehold.co/600x400?text=No+Image'}
                                        alt="ID Back"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://placehold.co/600x400?text=Error+Loading+Image';
                                        }}
                                    />
                                </div>
                            </div>
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
                                placeholder="e.g. ID image is blurry, Name does not match profile..."
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
