'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface RevenueStats {
    totalGrossRevenueNGN: number;
    totalGrossRevenueUSD: number;
    todayRevenueNGN: number;
    todayRevenueUSD: number;
    activeSubscribers: number;
    totalTransactions: number;
}

interface Transaction {
    id: string;
    date: string;
    userEmail: string;
    userName: string;
    type: string;
    typeLabel: string;
    amountCents: number;
    amount: number;
    currency: 'NGN' | 'USD';
    paystackRef: string;
    listingId?: string;
    listingTitle?: string;
}

interface SpotlightItem {
    id: string;
    title: string;
    image?: string;
    sellerEmail: string;
    sellerName: string;
    isFeatured: boolean;
    spotlightExpiry?: string;
    isDistressSale: boolean;
    isCrossListed: boolean;
    priceCents?: number;
}

const TRANSACTION_TYPES = [
    { value: '', label: 'All Types' },
    { value: 'chat_pass', label: 'Chat Pass' },
    { value: 'cross_list', label: 'Cross-List' },
    { value: 'aggressive_boost', label: 'Aggressive Boost' },
    { value: 'spotlight_3', label: 'Spotlight (3-Day)' },
    { value: 'spotlight_7', label: 'Spotlight (7-Day)' },
    { value: 'premium', label: 'Empire Status' },
];

export default function AdminMonetizationPage() {
    const [stats, setStats] = useState<RevenueStats | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [transactionsMeta, setTransactionsMeta] = useState({ total: 0, page: 1, totalPages: 1 });
    const [spotlights, setSpotlights] = useState<SpotlightItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState('');
    const [removingId, setRemovingId] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [statsRes, transactionsRes, spotlightsRes] = await Promise.all([
                apiClient.get('/admin/monetization/revenue'),
                apiClient.get('/admin/monetization/transactions', { params: { type: typeFilter || undefined } }),
                apiClient.get('/admin/monetization/spotlights'),
            ]);
            setStats(statsRes.data);
            setTransactions(transactionsRes.data.data);
            setTransactionsMeta(transactionsRes.data.meta);
            setSpotlights(spotlightsRes.data);
        } catch (error) {
            console.error('Failed to fetch monetization data:', error);
            toast.error('Failed to load monetization data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [typeFilter]);

    const handleRemoveSpotlight = async (listingId: string) => {
        setRemovingId(listingId);
        try {
            await apiClient.patch(`/admin/monetization/spotlights/${listingId}/remove`);
            toast.success('Spotlight removed');
            setSpotlights(prev => prev.filter(s => s.id !== listingId));
        } catch (error) {
            console.error('Failed to remove spotlight:', error);
            toast.error('Failed to remove spotlight');
        } finally {
            setRemovingId(null);
        }
    };

    const formatCurrencyValue = (amount: number, currency: 'NGN' | 'USD' = 'NGN') => {
        return new Intl.NumberFormat(currency === 'NGN' ? 'en-NG' : 'en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // CSV Download Functions
    const downloadTransactionsCSV = () => {
        if (transactions.length === 0) {
            toast.error('No transactions to download');
            return;
        }

        const headers = ['Date', 'User Name', 'User Email', 'Transaction Type', 'Amount', 'Currency', 'Paystack Reference', 'Listing ID', 'Listing Title'];
        const rows = transactions.map(tx => [
            new Date(tx.date).toISOString(),
            tx.userName,
            tx.userEmail,
            tx.typeLabel,
            tx.amount.toString(),
            tx.currency,
            tx.paystackRef || '',
            tx.listingId || '',
            tx.listingTitle || '',
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Transactions downloaded');
    };

    const downloadSummaryReport = () => {
        if (!stats) {
            toast.error('No data to download');
            return;
        }

        const reportDate = new Date().toLocaleString('en-NG');
        const summaryCSV = [
            ['BarterWave Monetization Report'],
            [`Generated: ${reportDate}`],
            [''],
            ['REVENUE SUMMARY'],
            ['Metric', 'Value'],
            ['Total NGN Revenue', stats.totalGrossRevenueNGN.toString()],
            ['Total USD Revenue', stats.totalGrossRevenueUSD.toString()],
            ['Today\'s NGN Revenue', stats.todayRevenueNGN.toString()],
            ['Today\'s USD Revenue', stats.todayRevenueUSD.toString()],
            ['Total Transactions', stats.totalTransactions.toString()],
            ['Active Subscribers', stats.activeSubscribers.toString()],
            ['Active Spotlights', spotlights.length.toString()],
            [''],
            ['ACTIVE SPOTLIGHTS'],
            ['Listing ID', 'Title', 'Seller Email', 'Seller Name', 'Featured', 'Expiry', 'Distress', 'Cross-Listed'],
            ...spotlights.map(s => [
                s.id,
                s.title,
                s.sellerEmail,
                s.sellerName,
                s.isFeatured ? 'Yes' : 'No',
                s.spotlightExpiry ? new Date(s.spotlightExpiry).toISOString() : 'N/A',
                s.isDistressSale ? 'Yes' : 'No',
                s.isCrossListed ? 'Yes' : 'No',
            ]),
        ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

        const blob = new Blob([summaryCSV], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `monetization_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Report downloaded');
    };

    if (isLoading && !stats) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Monetization Dashboard</h1>
                    <p className="text-gray-600">Track revenue, transactions, and active promotions</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={downloadSummaryReport}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Report
                    </button>
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">💰</span>
                        <span className="font-medium opacity-90">Total Revenue</span>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrencyValue(stats?.totalGrossRevenueNGN || 0, 'NGN')}</p>
                    <p className="text-xl font-bold opacity-90">{formatCurrencyValue(stats?.totalGrossRevenueUSD || 0, 'USD')}</p>
                    <p className="text-sm opacity-75 mt-1">{stats?.totalTransactions || 0} transactions</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">📈</span>
                        <span className="font-medium opacity-90">Today's Revenue</span>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrencyValue(stats?.todayRevenueNGN || 0, 'NGN')}</p>
                    <p className="text-xl font-bold opacity-90">{formatCurrencyValue(stats?.todayRevenueUSD || 0, 'USD')}</p>
                    <p className="text-sm opacity-75 mt-1">Updated live</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-6 rounded-2xl text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">👑</span>
                        <span className="font-medium opacity-90">Active Subscribers</span>
                    </div>
                    <p className="text-3xl font-bold">{stats?.activeSubscribers || 0}</p>
                    <p className="text-sm opacity-75 mt-1">Empire Status users</p>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-2xl text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">⭐</span>
                        <span className="font-medium opacity-90">Active Spotlights</span>
                    </div>
                    <p className="text-3xl font-bold">{spotlights.length}</p>
                    <p className="text-sm opacity-75 mt-1">In carousel</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-4">
                    <h2 className="text-lg font-bold text-gray-900">Transaction Log</h2>
                    <div className="flex items-center gap-3">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            {TRANSACTION_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                        <button
                            onClick={downloadTransactionsCSV}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export CSV
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reference</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        No transactions found
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(tx.date)}</td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-gray-900">{tx.userName}</div>
                                            <div className="text-xs text-gray-500">{tx.userEmail}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                {tx.typeLabel}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-green-600">
                                            {formatCurrencyValue(tx.amount, tx.currency)}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-mono text-gray-500">
                                            {tx.paystackRef || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {transactionsMeta.totalPages > 1 && (
                    <div className="p-4 border-t border-gray-200 text-sm text-gray-600 text-center">
                        Page {transactionsMeta.page} of {transactionsMeta.totalPages} ({transactionsMeta.total} total)
                    </div>
                )}
            </div>

            {/* Active Spotlights Manager */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">Active Spotlights Manager</h2>
                    <p className="text-sm text-gray-600">Manage items currently in the spotlight carousel</p>
                </div>

                {spotlights.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <span className="text-4xl mb-2 block">⭐</span>
                        No active spotlights at the moment
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {spotlights.map((item) => (
                            <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                                {/* Image */}
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                    {item.image ? (
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            width={64}
                                            height={64}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                                    <p className="text-sm text-gray-600">{item.sellerName} ({item.sellerEmail})</p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        {item.isDistressSale && (
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                                🔥 Distress
                                            </span>
                                        )}
                                        {item.isCrossListed && (
                                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                                📌 Cross-Listed
                                            </span>
                                        )}
                                        {item.isFeatured && (
                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                                ⭐ Featured
                                            </span>
                                        )}
                                        {item.spotlightExpiry && (
                                            <span className="text-xs text-gray-500">
                                                Expires: {formatDate(item.spotlightExpiry)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <button
                                    onClick={() => handleRemoveSpotlight(item.id)}
                                    disabled={removingId === item.id}
                                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold text-sm hover:bg-red-200 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {removingId === item.id ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                                            Removing...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Remove
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
