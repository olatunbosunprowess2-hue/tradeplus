'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ActionConfirmModal from './ActionConfirmModal';
import { adminApi } from '@/lib/admin-api';
import { useToastStore } from '@/lib/toast-store';
import { sanitizeUrl } from '@/lib/utils';

interface UserDetailModalProps {
    user: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        locationAddress?: string;
        locationLat?: number;
        locationLng?: number;
        verificationStatus: string;
        idDocumentType?: string;
        idDocumentFrontUrl?: string;
        idDocumentBackUrl?: string;
        faceVerificationUrl?: string;
        createdAt: string;
        profile?: {
            displayName?: string;
            avatarUrl?: string;
        };
        _count?: {
            listings: number;
            ordersBought: number;
            ordersSold: number;
            reportsMade: number;
            reportsAgainst: number;
        };
    };
    isOpen: boolean;
    onClose: () => void;
    onStatusUpdate?: () => void;
}

export default function UserDetailModal({ user, isOpen, onClose, onStatusUpdate }: UserDetailModalProps) {
    const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
    const [actionModal, setActionModal] = useState<{
        open: boolean;
        type: 'APPROVE' | 'REJECT' | null;
    }>({ open: false, type: null });
    const { addToast } = useToastStore();

    // Report history state
    const [userReports, setUserReports] = useState<any[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [showReportHistory, setShowReportHistory] = useState(false);

    // Fetch reports when user has reports against them and modal is open
    useEffect(() => {
        if (isOpen && user._count?.reportsAgainst && user._count.reportsAgainst > 0) {
            const fetchReports = async () => {
                setLoadingReports(true);
                try {
                    const response = await adminApi.getUserReports(user.id);
                    setUserReports(response.data.reports || []);
                } catch (error) {
                    console.error('Failed to fetch user reports:', error);
                } finally {
                    setLoadingReports(false);
                }
            };
            fetchReports();
        }
    }, [isOpen, user.id, user._count?.reportsAgainst]);

    const handleVerificationAction = async (reason?: string) => {
        if (!actionModal.type) return;

        try {
            if (actionModal.type === 'APPROVE') {
                await adminApi.updateUserStatus(user.id, {
                    verificationStatus: 'VERIFIED',
                    adminMessage: reason // Optional welcome message
                });
                addToast('success', 'User verification approved');
            } else {
                await adminApi.updateUserStatus(user.id, {
                    verificationStatus: 'REJECTED',
                    rejectionReason: reason
                });
                addToast('success', 'User verification rejected');
            }
            if (onStatusUpdate) onStatusUpdate();
            setActionModal({ open: false, type: null });
            onClose();
        } catch (error: any) {
            addToast('error', error.response?.data?.message || 'Failed to update verification status');
        }
    };

    if (!isOpen) return null;

    const getVerificationStatusColor = (status: string) => {
        switch (status) {
            case 'VERIFIED': return 'bg-green-100 text-green-800';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };



    return (
        <>
            {/* Modal Backdrop */}
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                                        {user.profile?.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">
                                            {user.firstName && user.lastName
                                                ? `${user.firstName} ${user.lastName}`
                                                : user.profile?.displayName || 'Unknown User'}
                                        </h2>
                                        <p className="text-blue-100">{user.email}</p>
                                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${getVerificationStatusColor(user.verificationStatus)}`}>
                                            {user.verificationStatus}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => window.open(`/admin/users/print?userId=${user.id}`, '_blank')}
                                    className="p-2 hover:bg-white/20 rounded-lg transition ml-2"
                                    title="Print Security Report"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/20 rounded-lg transition ml-2"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {/* User Info Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">User ID</p>
                                    <p className="text-sm font-mono text-gray-900 break-all">{user.id}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Phone Number</p>
                                    <p className="text-sm font-semibold text-gray-900">{user.phoneNumber || 'Not provided'}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">ID Document Type</p>
                                    <p className="text-sm font-semibold text-gray-900 capitalize">{user.idDocumentType?.replace('_', ' ') || 'Not provided'}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Joined</p>
                                    <p className="text-sm font-semibold text-gray-900">{formatDate(user.createdAt)}</p>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Location</p>
                                <p className="text-sm font-semibold text-gray-900">{user.locationAddress || 'Not provided'}</p>
                                {user.locationLat && user.locationLng && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Coordinates: {user.locationLat.toFixed(6)}, {user.locationLng.toFixed(6)}
                                    </p>
                                )}
                            </div>

                            {/* Activity Stats */}
                            {user._count && (
                                <div className="grid grid-cols-5 gap-2 mb-6">
                                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold text-blue-600">{user._count.listings}</p>
                                        <p className="text-xs text-gray-600">Listings</p>
                                    </div>
                                    <div className="bg-green-50 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold text-green-600">{user._count.ordersBought}</p>
                                        <p className="text-xs text-gray-600">Bought</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold text-purple-600">{user._count.ordersSold}</p>
                                        <p className="text-xs text-gray-600">Sold</p>
                                    </div>
                                    <div className="bg-yellow-50 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold text-yellow-600">{user._count.reportsMade}</p>
                                        <p className="text-xs text-gray-600">Reports Made</p>
                                    </div>
                                    <div className="bg-red-50 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold text-red-600">{user._count.reportsAgainst}</p>
                                        <p className="text-xs text-gray-600">Reports Against</p>
                                    </div>
                                </div>
                            )}

                            {/* Report History Section - Show if user has reports against them */}
                            {user._count && user._count.reportsAgainst > 0 && (
                                <div className="border border-red-200 bg-red-50 rounded-xl p-4 mb-6">
                                    <button
                                        onClick={() => setShowReportHistory(!showReportHistory)}
                                        className="w-full flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-red-800 font-bold">
                                                ⚠️ User has been reported {user._count.reportsAgainst} time{user._count.reportsAgainst > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <svg
                                            className={`w-5 h-5 text-red-600 transition-transform ${showReportHistory ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {showReportHistory && (
                                        <div className="mt-4 space-y-3">
                                            {loadingReports ? (
                                                <div className="text-center text-red-600 py-4">Loading report history...</div>
                                            ) : userReports.length === 0 ? (
                                                <div className="text-center text-red-600 py-4">No reports found</div>
                                            ) : (
                                                userReports.map((report: any) => (
                                                    <div key={report.id} className="bg-white border border-red-100 rounded-lg p-3">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div>
                                                                <span className={`px-2 py-0.5 text-xs font-bold rounded ${report.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                                    }`}>
                                                                    {report.status?.toUpperCase()}
                                                                </span>
                                                                <span className="ml-2 text-xs text-gray-500">
                                                                    {new Date(report.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            {report.listing && (
                                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                                                    Listing: {report.listing.title}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-900">{report.reason}</p>
                                                        {report.description && (
                                                            <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                                                        )}
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            Reported by: {report.reporter?.profile?.displayName || report.reporter?.email || 'Unknown'}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Identity Documents Section */}
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Identity Documents (For Investigation)
                                </h3>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                                    <p className="text-sm text-yellow-800">
                                        <strong>⚠️ Confidential:</strong> These documents are stored securely for verification and fraud investigation purposes only. Handle with care and in accordance with data protection regulations.
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {/* Face Verification */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-xs text-gray-500 uppercase font-bold mb-2">Selfie Verification</p>
                                        {user.faceVerificationUrl ? (
                                            <div
                                                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition"
                                                onClick={() => setActiveImageUrl(user.faceVerificationUrl!)}
                                            >
                                                <Image
                                                    src={sanitizeUrl(user.faceVerificationUrl!)}
                                                    alt="Face verification"
                                                    fill
                                                    className="object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition flex items-center justify-center">
                                                    <span className="text-white opacity-0 hover:opacity-100 font-semibold">View Full</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                                                <span className="text-gray-400 text-sm">Not provided</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* ID Front */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-xs text-gray-500 uppercase font-bold mb-2">ID Front</p>
                                        {user.idDocumentFrontUrl ? (
                                            <div
                                                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition"
                                                onClick={() => setActiveImageUrl(user.idDocumentFrontUrl!)}
                                            >
                                                <Image
                                                    src={sanitizeUrl(user.idDocumentFrontUrl!)}
                                                    alt="ID Front"
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                                                <span className="text-gray-400 text-sm">Not provided</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* ID Back */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-xs text-gray-500 uppercase font-bold mb-2">ID Back</p>
                                        {user.idDocumentBackUrl ? (
                                            <div
                                                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition"
                                                onClick={() => setActiveImageUrl(user.idDocumentBackUrl!)}
                                            >
                                                <Image
                                                    src={sanitizeUrl(user.idDocumentBackUrl!)}
                                                    alt="ID Back"
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                                                <span className="text-gray-400 text-sm">Not provided</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions for Pending Verification */}
                        {user.verificationStatus === 'PENDING' && (
                            <div className="bg-white border-t border-gray-200 p-4 absolute bottom-0 left-0 right-0 rounded-b-2xl flex justify-between items-center z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                                <p className="text-sm font-medium text-gray-600">Verification Pending</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setActionModal({ open: true, type: 'REJECT' })}
                                        className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 font-semibold rounded-lg transition"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => setActionModal({ open: true, type: 'APPROVE' })}
                                        className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 font-semibold rounded-lg transition shadow-sm"
                                    >
                                        Approve
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Footer - Only show if not pending (otherwise actions bar covers it) or make it scrollable */}
                        {user.verificationStatus !== 'PENDING' && (
                            <div className="border-t border-gray-200 p-4 flex justify-end gap-2">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 text-gray-700 font-semibold hover:bg-gray-100 rounded-xl transition"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div >
            </div >

            {/* Full Image Viewer */}
            {
                activeImageUrl && (
                    <div
                        className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
                        onClick={() => setActiveImageUrl(null)}
                    >
                        <button
                            onClick={() => setActiveImageUrl(null)}
                            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-lg transition"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
                            <Image
                                src={sanitizeUrl(activeImageUrl)}
                                alt="Full size document"
                                fill
                                className="object-contain"
                                draggable={false}
                            />
                        </div>
                    </div>
                )
            }

            <ActionConfirmModal
                isOpen={actionModal.open}
                onClose={() => setActionModal({ open: false, type: null })}
                onConfirm={handleVerificationAction}
                title={actionModal.type === 'APPROVE' ? 'Approve Verification' : 'Reject Verification'}
                message={actionModal.type === 'APPROVE'
                    ? 'Are you sure you want to approve this user? They will receive an email notification.'
                    : 'Are you sure you want to reject this verification request?'}
                confirmText={actionModal.type === 'APPROVE' ? 'Approve' : 'Reject'}
                confirmColor={actionModal.type === 'APPROVE' ? 'green' : 'red'}
                showInput={actionModal.type === 'REJECT'}
                inputLabel="Rejection Reason"
                inputPlaceholder="Please explain why the documents were rejected (e.g., blurry image, name mismatch)..."
            />
        </>
    );
}
