'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminApi } from '@/lib/admin-api';
import UserStatusBadge from '@/components/admin/UserStatusBadge';
import UserDetailModal from '@/components/admin/UserDetailModal';
import ActionConfirmModal from '@/components/admin/ActionConfirmModal';
import { useToastStore } from '@/lib/toast-store';

export default function AdminUsersPage() {
    const searchParams = useSearchParams();
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // Initialize search from URL params
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const { addToast } = useToastStore();

    // Update search when URL params change
    useEffect(() => {
        const urlSearch = searchParams.get('search') || '';
        if (urlSearch !== search) {
            setSearch(urlSearch);
            setPage(1); // Reset to page 1 when search changes from URL
        }
    }, [searchParams]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await adminApi.getUsers({
                page,
                limit: 10,
                search: search || undefined,
            });
            setUsers(response.data.data);
            setTotalPages(response.data.meta.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            addToast('error', 'Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchUsers();
        }, 300); // Debounce search

        return () => clearTimeout(timeoutId);
    }, [page, search]);

    const [statusAction, setStatusAction] = useState<{
        open: boolean;
        userId: string | null;
        newStatus: string;
    }>({ open: false, userId: null, newStatus: '' });

    const openStatusModal = (userId: string, newStatus: string) => {
        setStatusAction({ open: true, userId, newStatus });
    };

    const handleConfirmStatusChange = async (reason?: string) => {
        if (!statusAction.userId) return;

        try {
            await adminApi.updateUserStatus(statusAction.userId, {
                status: statusAction.newStatus,
                adminMessage: reason
            });
            addToast('success', `User status updated to ${statusAction.newStatus}`);
            fetchUsers();
        } catch (error: any) {
            addToast('error', error.response?.data?.message || 'Failed to update user status');
        }
    };

    const getVerificationBadge = (status: string) => {
        switch (status) {
            case 'VERIFIED':
                return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">✓ Verified</span>;
            case 'PENDING':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-bold">⏳ Pending</span>;
            case 'REJECTED':
                return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">✗ Rejected</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold">None</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-sm text-gray-600 mt-1">Search by email, name, phone, or location</p>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-72"
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
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">User</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Email</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Verification</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Status</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Joined</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                    {(user.profile?.displayName || user.email).charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-900 block">
                                                        {user.profile?.displayName || 'No Name'}
                                                    </span>
                                                    {user.firstName && user.lastName && (
                                                        <span className="text-xs text-gray-500">
                                                            {user.firstName} {user.lastName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm">{user.email}</td>
                                        <td className="px-6 py-4">
                                            {getVerificationBadge(user.verificationStatus)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <UserStatusBadge status={user.status} />
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                >
                                                    View Details
                                                </button>
                                                {user.status === 'active' ? (
                                                    <button
                                                        onClick={() => openStatusModal(user.id, 'suspended')}
                                                        className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
                                                    >
                                                        Suspend
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => openStatusModal(user.id, 'active')}
                                                        className="text-green-600 hover:text-green-700 text-sm font-medium"
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

            {/* User Detail Modal */}
            {selectedUser && (
                <UserDetailModal
                    user={selectedUser}
                    isOpen={!!selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onStatusUpdate={fetchUsers}
                />
            )}

            <ActionConfirmModal
                isOpen={statusAction.open}
                onClose={() => setStatusAction({ ...statusAction, open: false })}
                onConfirm={handleConfirmStatusChange}
                title={statusAction.newStatus === 'suspended' ? 'Suspend User' : 'Activate User'}
                message={statusAction.newStatus === 'suspended'
                    ? 'Are you sure you want to suspend this user? They will not be able to log in.'
                    : 'Are you sure you want to reactivate this user account?'}
                confirmText={statusAction.newStatus === 'suspended' ? 'Suspend' : 'Activate'}
                confirmColor={statusAction.newStatus === 'suspended' ? 'yellow' : 'green'}
                showInput={statusAction.newStatus === 'suspended'}
                inputLabel="Suspension Reason"
                inputPlaceholder="Please explain why the account is being suspended..."
            />
        </div>
    );
}
