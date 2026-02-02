'use client';

import { useState, useEffect } from 'react';
import { appealsApi } from '@/lib/appeals-api';
import { useToastStore } from '@/lib/toast-store';
import Link from 'next/link';

export default function AdminAppealsPage() {
    const [appeals, setAppeals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToastStore();

    const [selectedAppeal, setSelectedAppeal] = useState<any>(null);
    const [reviewAction, setReviewAction] = useState<'approved' | 'rejected' | 'view' | null>(null);
    const [adminMessage, setAdminMessage] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);


    const fetchAppeals = async () => {
        setIsLoading(true);
        try {
            const response = await appealsApi.getAppeals(page, 10);
            setAppeals(response.data.data);
            setTotalPages(response.data.meta.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch appeals:', error);
            addToast('error', 'Failed to load appeals');
        } finally {
            setIsLoading(false);
        }
    };

    const openReviewModal = (appeal: any, action: 'approved' | 'rejected' | 'view') => {
        setSelectedAppeal(appeal);
        setReviewAction(action);
        setAdminMessage('');
    };

    const handleReviewSubmit = async () => {
        if (!selectedAppeal || !reviewAction || reviewAction === 'view') return;

        setActionLoading(true);
        try {
            await appealsApi.reviewAppeal(selectedAppeal.id, {
                decision: reviewAction,
                adminMessage: adminMessage || undefined
            });
            addToast('success', `Appeal ${reviewAction} successfully`);
            fetchAppeals();
            setSelectedAppeal(null);
            setReviewAction(null);
        } catch (error) {
            console.error('Failed to review appeal:', error);
            addToast('error', 'Failed to submit review');
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        fetchAppeals();
    }, [page]);


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Appeals Management</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">User</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Reason</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Message</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Evidence</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Status</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Date</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        Loading appeals...
                                    </td>
                                </tr>
                            ) : appeals.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        No appeals found
                                    </td>
                                </tr>
                            ) : (
                                appeals.map((appeal) => (
                                    <tr key={appeal.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {appeal.user?.profile?.avatarUrl ? (
                                                    <img src={appeal.user.profile.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                                        {appeal.user?.email?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {appeal.user?.profile?.displayName || appeal.user?.email || 'Unknown User'}
                                                    </p>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded ${appeal.user?.status === 'suspended' ? 'bg-red-100 text-red-800' :
                                                        appeal.user?.status === 'banned' ? 'bg-gray-800 text-white' :
                                                            'bg-green-100 text-green-800'
                                                        }`}>
                                                        {appeal.user?.status || 'unknown'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-900 text-sm font-medium">
                                            {appeal.reason}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm max-w-xs truncate" title={appeal.message}>
                                            {appeal.message}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {appeal.evidenceImages && appeal.evidenceImages.length > 0 ? (
                                                <span className="text-blue-600 font-medium">
                                                    {appeal.evidenceImages.length} images
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">None</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${appeal.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                appeal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {appeal.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm">
                                            {new Date(appeal.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {appeal.status === 'pending' ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openReviewModal(appeal, 'view')}
                                                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => openReviewModal(appeal, 'approved')}
                                                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => openReviewModal(appeal, 'rejected')}
                                                        className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => openReviewModal(appeal, 'view')}
                                                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200"
                                                >
                                                    View Details
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-center gap-4">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600 font-medium px-4">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {selectedAppeal && reviewAction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">
                                {reviewAction === 'view' ? 'Appeal Details' : (reviewAction === 'approved' ? 'Approve Appeal' : 'Reject Appeal')}
                            </h3>
                            <button
                                onClick={() => {
                                    setSelectedAppeal(null);
                                    setReviewAction(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6 space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-bold text-gray-900 mb-1">{selectedAppeal.reason}</h4>
                                <p className="text-gray-700 text-sm">{selectedAppeal.message}</p>
                            </div>

                            {selectedAppeal.evidenceImages && selectedAppeal.evidenceImages.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Evidence:</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {selectedAppeal.evidenceImages.map((url: string, index: number) => (
                                            <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="block">
                                                <img src={url} alt={`Evidence ${index + 1}`} className="w-full h-20 object-cover rounded border border-gray-200" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {reviewAction !== 'view' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Admin Message (Optional)
                                    </label>
                                    <p className="text-xs text-gray-500 mb-2">
                                        {reviewAction === 'approved'
                                            ? 'Default: "Your appeal has been approved."'
                                            : 'Default: "After careful review, we have decided to uphold our original decision."'
                                        }
                                    </p>
                                    <textarea
                                        value={adminMessage}
                                        onChange={(e) => setAdminMessage(e.target.value)}
                                        placeholder="Enter a personalized response..."
                                        className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={4}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setSelectedAppeal(null);
                                    setReviewAction(null);
                                }}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                            >
                                {reviewAction === 'view' ? 'Close' : 'Cancel'}
                            </button>
                            {reviewAction !== 'view' && (
                                <button
                                    onClick={handleReviewSubmit}
                                    disabled={actionLoading}
                                    className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${reviewAction === 'approved'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                        } disabled:opacity-50`}
                                >
                                    {actionLoading ? 'Processing...' : `Confirm ${reviewAction === 'approved' ? 'Approval' : 'Rejection'}`}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
