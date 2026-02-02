'use client';

import { useState, useEffect } from 'react';
import { disputesApi, Dispute, DisputeStats } from '@/lib/disputes-api';
import { useToastStore } from '@/lib/toast-store';

const RESOLUTION_OPTIONS = [
    { value: 'full_refund', label: 'Full Refund', icon: '💰' },
    { value: 'partial_refund', label: 'Partial Refund', icon: '💵' },
    { value: 'no_action', label: 'No Action Needed', icon: '✅' },
    { value: 'warning_issued', label: 'Warning Issued', icon: '⚠️' },
];

export default function AdminDisputesPage() {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [stats, setStats] = useState<DisputeStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const { addToast } = useToastStore();

    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [resolution, setResolution] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);


    const fetchDisputes = async () => {
        setIsLoading(true);
        try {
            const [disputesResponse, statsData] = await Promise.all([
                disputesApi.getAll(statusFilter || undefined, page, 10),
                disputesApi.getStats(),
            ]);
            setDisputes(disputesResponse.data);
            setStats(statsData);
            setTotalPages(disputesResponse.meta.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch disputes:', error);
            addToast('error', 'Failed to load disputes');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDisputes();
    }, [statusFilter, page]);


    const openResolveModal = (dispute: Dispute) => {
        setSelectedDispute(dispute);
        setResolution('');
        setAdminNotes('');
        setShowResolveModal(true);
    };

    const handleResolve = async () => {
        if (!selectedDispute || !resolution) return;

        setActionLoading(true);
        try {
            await disputesApi.resolve(selectedDispute.id, { resolution, adminNotes });
            addToast('success', 'Dispute resolved successfully');
            setShowResolveModal(false);
            fetchDisputes();
        } catch (error) {
            console.error('Failed to resolve dispute:', error);
            addToast('error', 'Failed to resolve dispute');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            open: 'bg-yellow-100 text-yellow-800',
            under_review: 'bg-blue-100 text-blue-800',
            resolved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        };
        return styles[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Dispute Resolution Center</h1>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <p className="text-yellow-600 text-sm font-medium">Open</p>
                        <p className="text-2xl font-bold text-yellow-700">{stats.open}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-blue-600 text-sm font-medium">Under Review</p>
                        <p className="text-2xl font-bold text-blue-700">{stats.underReview}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-green-600 text-sm font-medium">Resolved</p>
                        <p className="text-2xl font-bold text-green-700">{stats.resolved}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-red-600 text-sm font-medium">Rejected</p>
                        <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <p className="text-gray-600 text-sm font-medium">Total</p>
                        <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="flex items-center gap-4">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                >
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="under_review">Under Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {/* Disputes Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Reporter</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Reason</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Status</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Date</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        Loading disputes...
                                    </td>
                                </tr>
                            ) : disputes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No disputes found
                                    </td>
                                </tr>
                            ) : (
                                disputes.map((dispute) => (
                                    <tr key={dispute.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {dispute.reporter?.profile?.displayName || dispute.reporter?.email}
                                                </p>
                                                <p className="text-sm text-gray-500">{dispute.reporter?.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-gray-900 font-medium">
                                                {dispute.reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </p>
                                            <p className="text-sm text-gray-500 line-clamp-1">{dispute.description}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(dispute.status)}`}>
                                                {dispute.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(dispute.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openResolveModal(dispute)}
                                                    className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                                                >
                                                    {dispute.status === 'resolved' ? 'View' : 'Resolve'}
                                                </button>
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
                    <div className="flex items-center justify-center gap-4 py-4 border-t border-gray-200">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 text-sm bg-gray-100 rounded-lg disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1 text-sm bg-gray-100 rounded-lg disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Resolve Modal */}
            {showResolveModal && selectedDispute && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Resolve Dispute</h2>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Dispute Details */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-bold text-gray-900 mb-2">
                                    {selectedDispute.reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </h3>
                                <p className="text-gray-600 text-sm mb-4">{selectedDispute.description}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span>Reporter: {selectedDispute.reporter?.profile?.displayName || selectedDispute.reporter?.email}</span>
                                    <span>•</span>
                                    <span>Filed: {new Date(selectedDispute.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Evidence Images */}
                            {selectedDispute.evidenceImages?.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Evidence ({selectedDispute.evidenceImages.length})</h4>
                                    <div className="flex gap-2 flex-wrap">
                                        {selectedDispute.evidenceImages.map((img, i) => (
                                            <img key={i} src={img} alt={`Evidence ${i + 1}`} className="w-24 h-24 object-cover rounded-lg border" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedDispute.status !== 'resolved' && (
                                <>
                                    {/* Resolution Options */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Resolution *</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {RESOLUTION_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setResolution(opt.value)}
                                                    className={`p-3 border-2 rounded-xl text-left transition ${resolution === opt.value
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <span className="mr-2">{opt.icon}</span>
                                                    <span className="font-medium text-gray-900">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Admin Notes */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Admin Notes</label>
                                        <textarea
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            placeholder="Internal notes about this resolution..."
                                            rows={3}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900"
                                        />
                                    </div>
                                </>
                            )}

                            {selectedDispute.status === 'resolved' && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                    <p className="font-medium text-green-800">
                                        Resolution: {selectedDispute.resolution?.replace(/_/g, ' ')}
                                    </p>
                                    {selectedDispute.adminNotes && (
                                        <p className="text-sm text-green-700 mt-2">{selectedDispute.adminNotes}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-200 flex gap-4">
                            <button
                                onClick={() => setShowResolveModal(false)}
                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                            >
                                {selectedDispute.status === 'resolved' ? 'Close' : 'Cancel'}
                            </button>
                            {selectedDispute.status !== 'resolved' && (
                                <button
                                    onClick={handleResolve}
                                    disabled={!resolution || actionLoading}
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Resolving...' : 'Resolve Dispute'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
