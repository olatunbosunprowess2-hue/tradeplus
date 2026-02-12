'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/admin-api';
import { useToastStore } from '@/lib/toast-store';

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'countered', label: 'Countered' },
    { value: 'cancelled', label: 'Cancelled' },
];

const DOWNPAYMENT_OPTIONS = [
    { value: '', label: 'All Downpayments' },
    { value: 'none', label: 'No Downpayment' },
    { value: 'awaiting_payment', label: 'Awaiting Payment' },
    { value: 'paid', label: 'Paid' },
    { value: 'confirmed', label: 'Confirmed' },
];

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        accepted: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        countered: 'bg-blue-100 text-blue-800',
        cancelled: 'bg-gray-100 text-gray-600',
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

function DownpaymentBadge({ status }: { status: string }) {
    const config: Record<string, { color: string; icon: string }> = {
        none: { color: 'bg-gray-100 text-gray-500', icon: '—' },
        awaiting_payment: { color: 'bg-orange-100 text-orange-700', icon: '⏳' },
        paid: { color: 'bg-blue-100 text-blue-700', icon: '💰' },
        confirmed: { color: 'bg-green-100 text-green-700', icon: '✅' },
    };

    const c = config[status] || config.none;
    const label = status === 'none' ? 'None' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${c.color}`}>
            {c.icon} {label}
        </span>
    );
}

export default function AdminTradesPage() {
    const [trades, setTrades] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [downpaymentStatus, setDownpaymentStatus] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const { addToast } = useToastStore();

    const fetchTrades = async () => {
        setIsLoading(true);
        try {
            const response = await adminApi.getTrades({
                page,
                limit: 20,
                status: status || undefined,
                downpaymentStatus: downpaymentStatus || undefined,
                search: search || undefined,
            });
            setTrades(response.data.data);
            setTotalPages(response.data.meta.totalPages || 1);
            setTotal(response.data.meta.total || 0);
        } catch (error) {
            console.error('Failed to fetch trades:', error);
            addToast('error', 'Failed to load trades');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchTrades();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [page, status, downpaymentStatus, search]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Trade Monitor</h1>
                <p className="text-sm text-gray-600 mt-1">
                    Monitor all barter offers and downpayment statuses · {total} total trades
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <select
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                >
                    {STATUS_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>

                <select
                    value={downpaymentStatus}
                    onChange={(e) => { setDownpaymentStatus(e.target.value); setPage(1); }}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                >
                    {DOWNPAYMENT_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>

                <div className="relative flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="Search by listing, buyer, or seller..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Listing</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Buyer</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Seller</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Cash Offered</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Status</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Downpayment</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                                            Loading trades...
                                        </div>
                                    </td>
                                </tr>
                            ) : trades.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <div className="text-4xl mb-2">📊</div>
                                        No trades found matching your filters
                                    </td>
                                </tr>
                            ) : (
                                trades.map((trade) => (
                                    <tr key={trade.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {trade.listing?.images?.[0]?.url ? (
                                                    <img
                                                        src={trade.listing.images[0].url}
                                                        alt=""
                                                        className="w-10 h-10 rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                                                        📦
                                                    </div>
                                                )}
                                                <span className="font-medium text-gray-900 text-sm truncate max-w-[160px]">
                                                    {trade.listing?.title || 'Deleted Listing'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900">
                                                    {trade.buyer?.profile?.displayName || 'Unknown'}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate max-w-[140px]">
                                                    {trade.buyer?.email || ''}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900">
                                                    {trade.seller?.profile?.displayName || 'Unknown'}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate max-w-[140px]">
                                                    {trade.seller?.email || ''}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {trade.offeredCashCents > 0
                                                ? `${trade.currencyCode} ${(trade.offeredCashCents / 100).toFixed(2)}`
                                                : <span className="text-gray-400">Barter only</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={trade.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <DownpaymentBadge status={trade.downpaymentStatus || 'none'} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(trade.createdAt).toLocaleDateString()}
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
        </div>
    );
}
