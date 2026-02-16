'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import ActionConfirmModal from '@/components/admin/ActionConfirmModal';

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
    // Confirmation Modal State
    const [confirmAction, setConfirmAction] = useState<{
        type: 'APPROVE' | 'REVOKE';
        userId: string;
        userName: string;
        title: string;
        message: string;
        open: boolean;
    }>({ type: 'APPROVE', userId: '', userName: '', title: '', message: '', open: false });

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

    const handleApproveClick = (userId: string, userName: string) => {
        setConfirmAction({
            type: 'APPROVE',
            userId,
            userName,
            title: 'Approve Brand Verification',
            message: `Are you sure you want to approve verification for ${userName}? This will instantly unlock the sell panel and verified features for this user.`,
            open: true,
        });
    };

    const handleRevokeClick = (userId: string, userName: string) => {
        setConfirmAction({
            type: 'REVOKE',
            userId,
            userName,
            title: 'Revoke Brand Verification',
            message: `Are you sure you want to revoke verification for ${userName}? This will remove the verified badge and disable access to the sell panel.`,
            open: true,
        });
    };

    const executeConfirmAction = async () => {
        if (!confirmAction.userId) return;
        const { type, userId } = confirmAction;
        setActionLoading(userId);

        try {
            if (type === 'APPROVE') {
                await apiClient.patch(`/brand-verification/admin/${userId}/approve`);
            } else {
                await apiClient.patch(`/brand-verification/admin/${userId}/revoke`);
            }
            fetchApplications();
            setSelectedApp(null);
            setConfirmAction(prev => ({ ...prev, open: false }));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to execute action');
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
        <div className="p-6 max-w-7xl mx-auto pb-20"> {/* pb-20 for mobile nav clearance */}
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
                            <div className="text-4xl mb-4">📋</div>
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

            {/* Application Detail Modal - Mobile Optimized */}
            {selectedApp && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-in fade-in duration-200 p-0 sm:p-4">
                    <div className="bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl w-full max-w-xl max-h-[90dvh] h-[90dvh] sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
                        {/* Header - Compact */}
                        <div className="p-4 border-b border-gray-100 flex items-start justify-between bg-gray-50/80 sticky top-0 z-10 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-300 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
                                    {(selectedApp.brandName || '?')[0]?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg font-bold text-gray-900 leading-tight truncate">{selectedApp.brandName}</h2>
                                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5 truncate">
                                        {selectedApp.firstName} {selectedApp.lastName}
                                        <span className="text-gray-300">•</span>
                                        {selectedApp.email}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setSelectedApp(null); setShowRejectInput(false); }}
                                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-5 overscroll-contain">
                            {/* Status Banner */}
                            <div className="flex items-center justify-between">
                                <StatusBadge status={selectedApp.brandVerificationStatus} />
                                <span className="text-xs text-gray-500">Applied on {new Date(selectedApp.createdAt).toLocaleDateString()}</span>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Website</label>
                                        {selectedApp.brandWebsite ? (
                                            <a href={selectedApp.brandWebsite} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all font-medium">
                                                {selectedApp.brandWebsite}
                                            </a>
                                        ) : <span className="text-sm text-gray-400">Not provided</span>}
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Instagram</label>
                                        <span className="text-sm text-gray-900 font-medium block">{selectedApp.brandInstagram || '-'}</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Phone / WhatsApp</label>
                                        <div className="text-sm text-gray-900 font-medium">{selectedApp.brandPhoneNumber}</div>
                                        {selectedApp.brandWhatsApp && (
                                            <div className="text-xs text-green-600 mt-1 flex items-center gap-1 font-medium">
                                                <span>📱</span> {selectedApp.brandWhatsApp}
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Physical Address</label>
                                        <span className="text-sm text-gray-900 font-medium block leading-snug">{selectedApp.brandPhysicalAddress}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Application Note */}
                            {selectedApp.brandApplicationNote && (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-900 mb-2">Application Note</h3>
                                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-sm text-gray-700 italic leading-relaxed">
                                        &ldquo;{selectedApp.brandApplicationNote}&rdquo;
                                    </div>
                                </div>
                            )}

                            {/* Proof Documents */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    Proof Documents <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">{selectedApp.brandProofUrls.length}</span>
                                </h3>
                                {selectedApp.brandProofUrls.length > 0 ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {selectedApp.brandProofUrls.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                                                <img src={url} alt={`Proof ${i + 1}`} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <span className="bg-white/90 text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">View</span>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">No proof documents.</p>
                                )}
                            </div>

                            {/* Previous Rejection Reason */}
                            {selectedApp.brandRejectionReason && (
                                <div className="bg-red-50 border border-red-100 p-3 rounded-lg">
                                    <p className="text-red-800 font-bold text-xs mb-0.5">Previously Rejected</p>
                                    <p className="text-red-600 text-xs">{selectedApp.brandRejectionReason}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions - Sticky & Safe Area */}
                        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 sticky bottom-0 z-20 pb-8">
                            {showRejectInput ? (
                                <div className="flex-1 flex gap-2 animate-in slide-in-from-bottom-2 duration-200">
                                    <input
                                        type="text"
                                        placeholder="Reject reason..."
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-gray-900"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => setShowRejectInput(false)}
                                        className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium whitespace-nowrap"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        disabled={!rejectReason.trim()}
                                        className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap"
                                    >
                                        Reject
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setSelectedApp(null)}
                                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors text-sm"
                                    >
                                        Close
                                    </button>

                                    {selectedApp.brandVerificationStatus === 'PENDING' && (
                                        <>
                                            <button
                                                onClick={() => setShowRejectInput(true)}
                                                className="px-4 py-2 text-red-600 font-bold hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 text-sm"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleApproveClick(selectedApp.id, selectedApp.brandName || selectedApp.email)}
                                                disabled={actionLoading === selectedApp.id}
                                                className="px-5 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all active:scale-[0.98] shadow-sm hover:shadow text-sm flex items-center gap-2"
                                            >
                                                {actionLoading === selectedApp.id ? '...' : (
                                                    <>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                        Approve
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    )}

                                    {selectedApp.brandVerificationStatus === 'VERIFIED_BRAND' && (
                                        <button
                                            onClick={() => handleRevokeClick(selectedApp.id, selectedApp.brandName || selectedApp.email)}
                                            className="px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm text-sm"
                                        >
                                            Revoke
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ActionConfirmModal
                isOpen={confirmAction.open}
                onClose={() => setConfirmAction({ ...confirmAction, open: false })}
                onConfirm={executeConfirmAction}
                title={confirmAction.title}
                message={confirmAction.message}
                confirmText={confirmAction.type === 'APPROVE' ? 'Approve' : 'Revoke'}
                confirmColor={confirmAction.type === 'APPROVE' ? 'green' : 'red'}
            />
        </div>
    );
}
