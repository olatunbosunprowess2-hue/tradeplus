'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';

interface BrandApplication {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    brandName: string | null;
    brandWebsite: string | null;
    brandInstagram: string | null;
    brandPhysicalAddress: string | null;
    brandWhatsApp: string | null;
    brandApplicationNote: string | null;
    brandVerificationStatus: string;
    brandVerifiedAt: string | null;
    brandRejectionReason: string | null;
    brandProofUrls: string[];
    createdAt: string;
    profile: { avatarUrl: string | null } | null;
}

interface WaitlistEntry {
    id: string;
    email: string;
    name: string | null;
    source: string;
    createdAt: string;
}

type Tab = 'applications' | 'waitlist';
type StatusFilter = 'all' | 'PENDING' | 'VERIFIED_BRAND' | 'REJECTED';

export default function AdminBrandsPage() {
    const [tab, setTab] = useState<Tab>('applications');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
    const [applications, setApplications] = useState<BrandApplication[]>([]);
    const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
    const [totalApps, setTotalApps] = useState(0);
    const [totalWaitlist, setTotalWaitlist] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectModal, setRejectModal] = useState<{ userId: string; brandName: string } | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    // Fetch data
    useEffect(() => {
        if (tab === 'applications') fetchApplications();
        else fetchWaitlist();
    }, [tab, statusFilter]);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/brand-verification/admin/applications', {
                params: { status: statusFilter, limit: 50 },
            });
            setApplications(res.data.applications);
            setTotalApps(res.data.total);
        } catch (err) {
            console.error('Failed to fetch brand applications:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWaitlist = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/brand-verification/admin/waitlist', { params: { limit: 100 } });
            setWaitlist(res.data.entries);
            setTotalWaitlist(res.data.total);
        } catch (err) {
            console.error('Failed to fetch waitlist:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId: string) => {
        setActionLoading(userId);
        try {
            await apiClient.patch(`/brand-verification/admin/${userId}/approve`);
            fetchApplications();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to approve');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        if (!rejectModal || !rejectReason.trim()) return;
        setActionLoading(rejectModal.userId);
        try {
            await apiClient.patch(`/brand-verification/admin/${rejectModal.userId}/reject`, {
                reason: rejectReason,
            });
            setRejectModal(null);
            setRejectReason('');
            fetchApplications();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to reject');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRevoke = async (userId: string) => {
        if (!confirm('Are you sure you want to revoke this brand verification?')) return;
        setActionLoading(userId);
        try {
            await apiClient.patch(`/brand-verification/admin/${userId}/revoke`);
            fetchApplications();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to revoke');
        } finally {
            setActionLoading(null);
        }
    };

    const exportWaitlistCSV = () => {
        const headers = 'Name,Email,Source,Date\n';
        const rows = waitlist.map(w =>
            `"${w.name || ''}","${w.email}","${w.source}","${new Date(w.createdAt).toLocaleDateString()}"`
        ).join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `barterwave-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const statusBadge = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
            VERIFIED_BRAND: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    return (
        <div className="p-6 max-w-6xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Brand Verification</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Manage brand applications and waitlist</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6 w-fit">
                <button
                    onClick={() => setTab('applications')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'applications' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Applications ({totalApps})
                </button>
                <button
                    onClick={() => setTab('waitlist')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'waitlist' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Waitlist ({totalWaitlist})
                </button>
            </div>

            {/* Applications Tab */}
            {tab === 'applications' && (
                <>
                    {/* Status Filter */}
                    <div className="flex gap-2 mb-4">
                        {(['PENDING', 'VERIFIED_BRAND', 'REJECTED', 'all'] as StatusFilter[]).map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
                            >
                                {s === 'all' ? 'All' : s.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-gray-400">Loading...</div>
                    ) : applications.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-4">📭</div>
                            <p className="text-gray-500">No brand applications found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {applications.map(app => (
                                <div key={app.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-300 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                {(app.brandName || app.firstName || '?')[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white">{app.brandName || 'Unnamed Brand'}</h3>
                                                <p className="text-sm text-gray-500">{app.firstName} {app.lastName} · {app.email}</p>
                                            </div>
                                        </div>
                                        {statusBadge(app.brandVerificationStatus)}
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                                        {app.brandWebsite && (
                                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
                                                <p className="text-gray-400 text-xs mb-0.5">Website</p>
                                                <a href={app.brandWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate block">
                                                    {app.brandWebsite.replace(/^https?:\/\//, '')}
                                                </a>
                                            </div>
                                        )}
                                        {app.brandInstagram && (
                                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
                                                <p className="text-gray-400 text-xs mb-0.5">Instagram</p>
                                                <p className="text-gray-900 dark:text-white">{app.brandInstagram}</p>
                                            </div>
                                        )}
                                        {app.brandPhysicalAddress && (
                                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
                                                <p className="text-gray-400 text-xs mb-0.5">Address</p>
                                                <p className="text-gray-900 dark:text-white truncate">{app.brandPhysicalAddress}</p>
                                            </div>
                                        )}
                                        {app.brandWhatsApp && (
                                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
                                                <p className="text-gray-400 text-xs mb-0.5">WhatsApp</p>
                                                <p className="text-gray-900 dark:text-white">{app.brandWhatsApp}</p>
                                            </div>
                                        )}
                                    </div>

                                    {app.brandApplicationNote && (
                                        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 mb-4 text-sm text-gray-700 dark:text-gray-300 italic">
                                            &ldquo;{app.brandApplicationNote}&rdquo;
                                        </div>
                                    )}

                                    {/* Proof Images */}
                                    {app.brandProofUrls && app.brandProofUrls.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Proof Documents ({app.brandProofUrls.length})</p>
                                            <div className="flex flex-wrap gap-2">
                                                {app.brandProofUrls.map((url: string, i: number) => (
                                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                                                        <img
                                                            src={url}
                                                            alt={`Proof ${i + 1}`}
                                                            className="w-16 h-16 rounded-lg object-cover border-2 border-amber-200 dark:border-amber-700 hover:border-amber-400 hover:scale-105 transition-all shadow-sm cursor-pointer"
                                                        />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {app.brandRejectionReason && (
                                        <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-3 mb-4 text-sm text-red-700 dark:text-red-300">
                                            <strong>Rejection reason:</strong> {app.brandRejectionReason}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                        {app.brandVerificationStatus === 'PENDING' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(app.id)}
                                                    disabled={actionLoading === app.id}
                                                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all"
                                                >
                                                    {actionLoading === app.id ? '...' : '✓ Approve'}
                                                </button>
                                                <button
                                                    onClick={() => setRejectModal({ userId: app.id, brandName: app.brandName || 'Brand' })}
                                                    disabled={actionLoading === app.id}
                                                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all"
                                                >
                                                    ✗ Reject
                                                </button>
                                            </>
                                        )}
                                        {app.brandVerificationStatus === 'VERIFIED_BRAND' && (
                                            <button
                                                onClick={() => handleRevoke(app.id)}
                                                disabled={actionLoading === app.id}
                                                className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-all"
                                            >
                                                Revoke Verification
                                            </button>
                                        )}
                                        <span className="text-xs text-gray-400 ml-auto self-center">
                                            Applied {new Date(app.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Waitlist Tab */}
            {tab === 'waitlist' && (
                <>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={exportWaitlistCSV}
                            disabled={waitlist.length === 0}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export CSV
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-gray-400">Loading...</div>
                    ) : waitlist.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-4">📋</div>
                            <p className="text-gray-500">No waitlist entries yet</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
                                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Source</th>
                                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {waitlist.map(w => (
                                        <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                            <td className="px-4 py-3 text-gray-900 dark:text-white">{w.name || '—'}</td>
                                            <td className="px-4 py-3 text-blue-600 dark:text-blue-400">{w.email}</td>
                                            <td className="px-4 py-3 text-gray-500">{w.source}</td>
                                            <td className="px-4 py-3 text-gray-400">{new Date(w.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Reject Modal */}
            {rejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            Reject &ldquo;{rejectModal.brandName}&rdquo;
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">Provide a reason — the applicant will see this in their rejection email.</p>
                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="e.g., Insufficient proof of brand identity. Please provide more documentation."
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 resize-none mb-4"
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={rejectReason.length < 5 || actionLoading !== null}
                                className="px-5 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all"
                            >
                                {actionLoading ? '...' : 'Reject Application'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
