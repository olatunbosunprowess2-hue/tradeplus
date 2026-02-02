'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/admin-api';
import { useToastStore } from '@/lib/toast-store';
import Link from 'next/link';

export default function AdminReportsPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToastStore();

    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Admin message modal state
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [adminMessage, setAdminMessage] = useState('');
    const [pendingAction, setPendingAction] = useState<{ type: 'resolve' | 'delete', reportId: string } | null>(null);

    // Filter and Pagination state
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);


    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const response = await adminApi.getReports({
                page,
                limit: 10,
                status: status || undefined
            });
            setReports(response.data.data);
            setTotalPages(response.data.meta.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
            addToast('error', 'Failed to load reports');
        } finally {
            setIsLoading(false);
        }
    };


    const openMessageModal = (type: 'resolve' | 'delete', reportId: string) => {
        setPendingAction({ type, reportId });
        setAdminMessage('');
        setShowMessageModal(true);
    };

    const handleSubmitWithMessage = async () => {
        if (!pendingAction) return;

        setShowMessageModal(false);
        setActionLoading(pendingAction.reportId);

        try {
            if (pendingAction.type === 'resolve') {
                await adminApi.resolveReport(pendingAction.reportId, adminMessage || undefined);
                addToast('success', 'Report marked as resolved. Reporter has been notified.');
            } else {
                await adminApi.deleteReportedListing(pendingAction.reportId, adminMessage || undefined);
                addToast('success', 'Listing deleted successfully. Reporter has been notified.');
            }
            fetchReports();
        } catch (error) {
            console.error('Failed to process action:', error);
            addToast('error', `Failed to ${pendingAction.type === 'resolve' ? 'resolve report' : 'delete listing'}`);
        } finally {
            setActionLoading(null);
            setPendingAction(null);
            setAdminMessage('');
        }
    };

    useEffect(() => {
        fetchReports();
    }, [page, status]);


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                <div className="flex gap-3">
                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                        <option value="">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="resolved">Resolved</option>
                    </select>
                </div>
            </div>


            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Type</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Reporter</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Reported Entity</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Reason</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Evidence</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Status</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Date</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                        Loading reports...
                                    </td>
                                </tr>
                            ) : reports.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                        No reports found
                                    </td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${report.listingId ? 'bg-blue-50 text-blue-800' :
                                                report.reportedUserId ? 'bg-purple-100 text-purple-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {report.listingId ? 'Listing' : report.reportedUserId ? 'User' : 'Message'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm">
                                            {report.reporter?.profile?.displayName || report.reporter?.email}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {report.listing ? (
                                                <Link href={`/listings/${report.listing.id}`} className="text-blue-600 hover:underline" target="_blank">
                                                    {report.listing.title}
                                                </Link>
                                            ) : report.reportedUser ? (
                                                <span className="text-gray-900 font-medium">
                                                    {report.reportedUser.profile?.displayName || report.reportedUser.email}
                                                </span>
                                            ) : (
                                                <span className="text-gray-500">Unknown</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm max-w-xs truncate" title={report.reason}>
                                            {report.reason}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {report.evidenceImages && report.evidenceImages.length > 0 ? (
                                                <button
                                                    onClick={() => setSelectedReport(report)}
                                                    className="text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    View ({report.evidenceImages.length})
                                                </button>
                                            ) : (
                                                <span className="text-gray-400">None</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${report.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm">
                                            {new Date(report.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {report.status !== 'resolved' && (
                                                    <>
                                                        <button
                                                            onClick={() => openMessageModal('resolve', report.id)}
                                                            disabled={actionLoading === report.id}
                                                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {actionLoading === report.id ? 'Processing...' : 'Resolve'}
                                                        </button>
                                                        {report.listingId && (
                                                            <button
                                                                onClick={() => openMessageModal('delete', report.id)}
                                                                disabled={actionLoading === report.id}
                                                                className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Delete Listing
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
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

            {/* Admin Message Modal */}
            {showMessageModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">
                                {pendingAction?.type === 'delete' ? 'Delete Listing & Send Message' : 'Resolve Report & Send Message'}
                            </h3>
                            <button
                                onClick={() => setShowMessageModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Message to Reporter (Optional)
                            </label>
                            <p className="text-xs text-gray-500 mb-3">
                                {pendingAction?.type === 'delete'
                                    ? 'A default message will be sent if you leave this blank: "Thank you for your report. After reviewing the evidence, we have removed the reported listing. We appreciate your help in keeping our community safe."'
                                    : 'A default message will be sent if you leave this blank: "Your report has been reviewed and resolved by our team. Thank you for helping us maintain a safe community."'
                                }
                            </p>
                            <textarea
                                value={adminMessage}
                                onChange={(e) => setAdminMessage(e.target.value)}
                                placeholder="Enter a personalized message (optional)..."
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={5}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowMessageModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitWithMessage}
                                className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${pendingAction?.type === 'delete'
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-green-600 hover:bg-green-700'
                                    }`}
                            >
                                {pendingAction?.type === 'delete' ? 'Delete & Notify' : 'Resolve & Notify'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Evidence Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Evidence for Report</h3>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6">
                            <h4 className="font-bold text-gray-800 mb-2">Reason</h4>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedReport.reason}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {selectedReport.evidenceImages.map((image: string, index: number) => (
                                <div key={index} className="rounded-lg overflow-hidden border border-gray-200">
                                    <img src={image} alt={`Evidence ${index + 1}`} className="w-full h-auto" />
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
