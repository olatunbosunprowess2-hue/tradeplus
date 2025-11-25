'use client';

import { useState } from 'react';
import type { User } from '@/lib/types';
import { toast } from 'react-hot-toast';

interface ModalProps {
    user: User;
    onClose: () => void;
    onDecision: (userId: string, decision: 'APPROVE' | 'REJECT') => void;
}

export default function VerificationReviewModal({ user, onClose, onDecision }: ModalProps) {
    const [rejectReason, setRejectReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    const handleApprove = () => {
        toast.success(`Approved ${user.profile?.displayName}`);
        onDecision(user.id, 'APPROVE');
    };

    const handleRejectClick = () => {
        setIsRejecting(true);
    };

    const handleConfirmReject = () => {
        if (!rejectReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }
        console.log(`Sending rejection email to ${user.email}. Reason: ${rejectReason}`);
        toast.success(`Rejected ${user.profile?.displayName}. Email sent.`);
        onDecision(user.id, 'REJECT');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Review Verification</h2>
                        <p className="text-gray-500">User: {user.profile?.displayName} ({user.email})</p>
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
                                <p><span className="text-gray-500">Name:</span> {user.profile?.displayName}</p>
                                <p><span className="text-gray-500">Bio:</span> {user.profile?.bio}</p>
                                <p><span className="text-gray-500">Phone:</span> {user.phoneNumber}</p>
                                <p><span className="text-gray-500">Location:</span> {user.locationAddress}</p>
                            </div>
                        </div>

                        {/* Selfie */}
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <h3 className="font-semibold text-gray-700 mb-2">Live Selfie</h3>
                            <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                <img src={user.faceVerificationUrl} alt="Selfie" className="w-full h-full object-cover" />
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
                                    <img src={user.idDocumentFrontUrl} alt="ID Front" className="w-full h-full object-cover" />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Back Side</p>
                                <div className="aspect-[3/2] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                    <img src={user.idDocumentBackUrl} alt="ID Back" className="w-full h-full object-cover" />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer / Actions */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
                    {isRejecting ? (
                        <div className="space-y-4 animate-fadeIn">
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
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmReject}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-sm"
                                >
                                    Confirm Rejection
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-4 justify-end">
                            <button
                                onClick={handleRejectClick}
                                className="px-6 py-3 bg-white border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition"
                            >
                                Reject
                            </button>
                            <button
                                onClick={handleApprove}
                                className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg transition transform hover:-translate-y-0.5"
                            >
                                Approve Verification
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
