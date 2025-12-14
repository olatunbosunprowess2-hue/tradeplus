'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/admin-api';
import ListingStatusBadge from '@/components/admin/ListingStatusBadge';
import { useToastStore } from '@/lib/toast-store';
import Link from 'next/link';
import ConfirmationModal from '@/components/admin/ConfirmationModal';

export default function AdminListingsPage() {
    const [listings, setListings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { addToast } = useToastStore();

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ id: string, status: string } | null>(null);

    const fetchListings = async () => {
        setIsLoading(true);
        try {
            const response = await adminApi.getListings({
                page,
                limit: 10,
                search: search || undefined,
            });
            setListings(response.data.data);
            setTotalPages(response.data.meta.lastPage);
        } catch (error) {
            console.error('Failed to fetch listings:', error);
            addToast('error', 'Failed to load listings');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchListings();
        }, 500); // Debounce search

        return () => clearTimeout(timeoutId);
    }, [page, search]);

    const initiateStatusChange = (listingId: string, newStatus: string) => {
        setPendingAction({ id: listingId, status: newStatus });
        setModalOpen(true);
    };

    const confirmStatusChange = async () => {
        if (!pendingAction) return;

        const { id, status } = pendingAction;
        try {
            await adminApi.updateListingStatus(id, { status });
            addToast('success', `Listing status updated to ${status}`);
            fetchListings();
        } catch (error: any) {
            console.error(error);
            addToast('error', error.response?.data?.message || 'Failed to update listing status');
        } finally {
            setModalOpen(false);
            setPendingAction(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Listing Moderation</h1>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search listings..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                    />
                    <svg
                        className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Listing</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Seller</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Price</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Status</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Created</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Loading listings...
                                    </td>
                                </tr>
                            ) : listings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        No listings found
                                    </td>
                                </tr>
                            ) : (
                                listings.map((listing) => (
                                    <tr key={listing.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                                                    {listing.images?.[0] ? (
                                                        <img
                                                            src={listing.images[0].url}
                                                            alt={listing.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            📦
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <Link
                                                        href={`/listings/${listing.id}`}
                                                        className="font-medium text-gray-900 hover:text-blue-600 block truncate max-w-[200px]"
                                                        target="_blank"
                                                    >
                                                        {listing.title}
                                                    </Link>
                                                    <span className="text-xs text-gray-500">{listing.category?.name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm">
                                            {listing.seller?.profile?.displayName || listing.seller?.email}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {listing.priceCents ? `₦${(listing.priceCents / 100).toLocaleString()}` : 'Free'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <ListingStatusBadge status={listing.status} />
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm">
                                            {new Date(listing.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {listing.status === 'active' ? (
                                                    <button
                                                        onClick={() => initiateStatusChange(listing.id, 'suspended')}
                                                        className="text-red-600 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-3 py-1 rounded-md transition"
                                                    >
                                                        Suspend
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => initiateStatusChange(listing.id, 'active')}
                                                        className="text-green-600 hover:text-green-700 text-sm font-medium hover:bg-green-50 px-3 py-1 rounded-md transition"
                                                    >
                                                        Activate
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={modalOpen}
                title={pendingAction?.status === 'suspended' ? 'Suspend Listing' : 'Activate Listing'}
                message={pendingAction?.status === 'suspended'
                    ? 'Are you sure you want to suspend this listing? It will no longer be visible to users.'
                    : 'Are you sure you want to reactivate this listing? It will be visible on the marketplace again.'}
                isDestructive={pendingAction?.status === 'suspended'}
                confirmLabel={pendingAction?.status === 'suspended' ? 'Suspend' : 'Activate'}
                onConfirm={confirmStatusChange}
                onCancel={() => {
                    setModalOpen(false);
                    setPendingAction(null);
                }}
            />
        </div>
    );
}
