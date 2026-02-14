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
    brandPhoneNumber: string | null;
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

    // Modal State
    const [selectedApp, setSelectedApp] = useState<BrandApplication | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);

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
        if (!confirm('Approve this brand? This will instantly unlock the sell panel.')) return;
        setActionLoading(userId);
        try {
            await apiClient.patch(`/brand-verification/admin/${userId}/approve`);
            fetchApplications();
            setSelectedApp(null);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to approve');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        if (!selectedApp || !rejectReason.trim()) return;
        setActionLoading(selectedApp.id);
        try {
            await apiClient.patch(`/brand-verification/admin/${selectedApp.id}/reject`, {
                reason: rejectReason,
            });
            fetchApplications();
            setSelectedApp(null);
            setRejectReason('');
            setShowRejectInput(false);
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
            setSelectedApp(null);
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

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: Record<string, string> = {
            PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
            VERIFIED_BRAND: 'bg-green-100 text-green-800 border-green-200',
            REJECTED: 'bg-red-100 text-red-800 border-red-200',
        };
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
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

            {/* Reference to Lucide icons needed */}

            {/* Applications Tab */}
            {tab === 'applications' && (
                <>
                    {/* Status Filter */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                        {(['PENDING', 'VERIFIED_BRAND', 'REJECTED', 'all'] as StatusFilter[]).map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
                            >
                                {s === 'all' ? 'All' : s.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-gray-400">Loading...</div>
                    ) : applications.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                            <div className="text-4xl mb-4">📭</div>
                            <p className="text-gray-500">No brand applications found</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-gray-500 font-medium">Brand / Applicant</th>
                                            <th className="text-left px-6 py-4 text-gray-500 font-medium">Status</th>
                                            <th className="text-left px-6 py-4 text-gray-500 font-medium">Website</th>
                                            <th className="text-left px-6 py-4 text-gray-500 font-medium">Applied</th>
                                            <th className="text-right px-6 py-4 text-gray-500 font-medium">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {applications.map(app => (
                                            <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-lg shrink-0">
                                                            {(app.brandName || app.firstName || '?')[0]?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 dark:text-white">{app.brandName || 'Unnamed Brand'}</div>
                                                            <div className="text-xs text-gray-500">{app.firstName} {app.lastName} • {app.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={app.brandVerificationStatus} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    {app.brandWebsite ? (
                                                        <a href={app.brandWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[150px] block">
                                                            {app.brandWebsite.replace(/^https?:\/\//, '')}
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">
                                                    {new Date(app.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => setSelectedApp(app)}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm active:scale-95"
                                                    >
                                                        Review Application
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-3">
                                {applications.map(app => (
                                    <div key={app.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-lg shrink-0">
                                                    {(app.brandName || app.firstName || '?')[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white">{app.brandName || 'Unnamed Brand'}</div>
                                                    <StatusBadge status={app.brandVerificationStatus} />
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-400">{new Date(app.createdAt).toLocaleDateString()}</span>
                                        </div>

                                        <div className="text-xs text-gray-500 mb-4 px-1">
                                            <div className="flex items-center gap-1 mb-1">
                                                <span>👤</span> {app.firstName} {app.lastName}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span>📧</span> {app.email}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setSelectedApp(app)}
                                            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span>Review Application</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
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
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                            <div className="text-4xl mb-4">ðŸ“‹</div>
                            <p className="text-gray-500">No waitlist entries yet</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-gray-500 font-medium">Name</th>
                                        <th className="text-left px-6 py-4 text-gray-500 font-medium">Email</th>
                                        <th className="text-left px-6 py-4 text-gray-500 font-medium">Source</th>
                                        <th className="text-left px-6 py-4 text-gray-500 font-medium">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {waitlist.map(w => (
                                        <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{w.name || 'â€”'}</td>
                                            <td className="px-6 py-4 text-blue-600 dark:text-blue-400">{w.email}</td>
                                            <td className="px-6 py-4 text-gray-500">
                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">{w.source}</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400">{new Date(w.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Application Detail Modal */}
            {selectedApp && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between bg-gray-50/50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-300 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-sm">
                                    {(selectedApp.brandName || '?')[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedApp.brandName}</h2>
                                    <p className="text-sm text-gray-500 flex items-center gap-2">
                                        Applied by {selectedApp.firstName} {selectedApp.lastName}
                                        <span className="text-gray-300">â€¢</span>
                                        {selectedApp.email}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setSelectedApp(null); setShowRejectInput(false); }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Status Banner */}
                            <div className="flex items-center justify-between mb-6">
                                <StatusBadge status={selectedApp.brandVerificationStatus} />
                                <span className="text-sm text-gray-500">Applied on {new Date(selectedApp.createdAt).toLocaleDateString()}</span>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                                <div className="space-y-4">
                                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Website</label>
                                        {selectedApp.brandWebsite ? (
                                            <a href={selectedApp.brandWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                                {selectedApp.brandWebsite}
                                            </a>
                                        ) : <span className="text-gray-400">Not provided</span>}
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Instagram</label>
                                        <span className="text-gray-900 dark:text-white font-medium">{selectedApp.brandInstagram || '-'}</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Phone / WhatsApp</label>
                                        <div className="text-gray-900 dark:text-white font-medium">{selectedApp.brandPhoneNumber}</div>
                                        {selectedApp.brandWhatsApp && (
                                            <div className="text-sm text-green-600 mt-1 flex items-center gap-1">
                                                <span>ðŸ“±</span> {selectedApp.brandWhatsApp} (WA)
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Physical Address</label>
                                        <span className="text-gray-900 dark:text-white font-medium">{selectedApp.brandPhysicalAddress}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Application Note */}
                            {selectedApp.brandApplicationNote && (
                                <div className="mb-8">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Application Note</h3>
                                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl text-gray-700 dark:text-gray-300 italic leading-relaxed">
                                        &ldquo;{selectedApp.brandApplicationNote}&rdquo;
                                    </div>
                                </div>
                            )}

                            {/* Proof Documents */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    Proof Documents <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">{selectedApp.brandProofUrls.length}</span>
                                </h3>
                                {selectedApp.brandProofUrls.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {selectedApp.brandProofUrls.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100">
                                                <img src={url} alt={`Proof ${i + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <span className="bg-white/90 text-gray-900 text-xs font-bold px-2 py-1 rounded shadow-sm">View</span>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">No proof documents uploaded.</p>
                                )}
                            </div>

                            {/* Previous Rejection Reason */}
                            {selectedApp.brandRejectionReason && (
                                <div className="mt-8 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl">
                                    <p className="text-red-800 dark:text-red-300 font-bold text-sm mb-1">Previously Rejected</p>
                                    <p className="text-red-700 dark:text-red-400 text-sm">{selectedApp.brandRejectionReason}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3 sticky bottom-0">
                            {showRejectInput ? (
                                <div className="flex-1 flex gap-3 animate-in slide-in-from-bottom-2 duration-200">
                                    <input
                                        type="text"
                                        placeholder="Reason for rejection..."
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-red-500"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => setShowRejectInput(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        disabled={!rejectReason.trim()}
                                        className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
                                    >
                                        Confirm Reject
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setSelectedApp(null)}
                                        className="px-5 py-2.5 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                    >
                                        Close
                                    </button>

                                    {selectedApp.brandVerificationStatus === 'PENDING' && (
                                        <>
                                            <button
                                                onClick={() => setShowRejectInput(true)}
                                                className="px-5 py-2.5 text-red-600 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors border border-transparent hover:border-red-200"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleApprove(selectedApp.id)}
                                                disabled={actionLoading === selectedApp.id}
                                                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/20 transition-all active:scale-[0.98]"
                                            >
                                                {actionLoading === selectedApp.id ? 'Approving...' : (
                                                    <span className="flex items-center gap-2">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                        Approve Brand
                                                    </span>
                                                )}
                                            </button>
                                        </>
                                    )}

                                    {selectedApp.brandVerificationStatus === 'VERIFIED_BRAND' && (
                                        <button
                                            onClick={() => handleRevoke(selectedApp.id)}
                                            className="px-5 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
                                        >
                                            Revoke Verification
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
