'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin-api';
import UserStatusBadge from '@/components/admin/UserStatusBadge';
import UserDetailModal from '@/components/admin/UserDetailModal';
import ActionConfirmModal from '@/components/admin/ActionConfirmModal';
import { useToastStore } from '@/lib/toast-store';

// Debounce helper for instant typing without lag
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  // Search and filter state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const { addToast } = useToastStore();

  // Reset page when search or filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, role, verificationStatus]);

  // High-performance React Query with instant background cache
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-users', { page, search: debouncedSearch, status, role, verificationStatus }],
    queryFn: async () => {
      const response = await adminApi.getUsers({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        status: status || undefined,
        role: role || undefined,
        verificationStatus: verificationStatus || undefined,
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30000, // 30s fresh cache
  });

  const users = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-sidebar-counts'] });
  };

  const [statusAction, setStatusAction] = useState<{
    open: boolean;
    userId: string | null;
    userName: string;
    newStatus: string;
  }>({ open: false, userId: null, userName: '', newStatus: '' });

  const openStatusModal = (userId: string, userName: string, newStatus: string) => {
    setStatusAction({ open: true, userId, userName, newStatus });
  };

  const handleConfirmStatusChange = async (reason?: string) => {
    if (!statusAction.userId) return;

    try {
      await adminApi.updateUserStatus(statusAction.userId, {
        status: statusAction.newStatus,
        adminMessage: reason,
      });
      addToast('success', `User status updated to ${statusAction.newStatus}`);
      invalidateUsers();
    } catch (error: any) {
      addToast('error', error.response?.data?.message || 'Failed to update user status');
    }
  };

  const [verifyAction, setVerifyAction] = useState<{
    open: boolean;
    userId: string | null;
    userName: string;
    isVerifying: boolean;
  }>({ open: false, userId: null, userName: '', isVerifying: true });

  const openVerifyModal = (userId: string, userName: string, isVerifying: boolean) => {
    setVerifyAction({ open: true, userId, userName, isVerifying });
  };

  const handleConfirmVerification = async () => {
    if (!verifyAction.userId) return;

    try {
      await adminApi.toggleUserVerification(verifyAction.userId, verifyAction.isVerifying);
      addToast(
        'success',
        verifyAction.isVerifying ? 'User verified successfully' : 'User verification removed'
      );
      invalidateUsers();
    } catch (e: any) {
      addToast(
        'error',
        e.response?.data?.message ||
          `Failed to ${verifyAction.isVerifying ? 'verify' : 'unverify'} user`
      );
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-bold">
            ✓ Verified ID
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-bold">
            ⏳ Pending
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs font-bold">
            ✗ Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded text-xs font-bold">
            None
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
            {isFetching && !isLoading && (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded animate-pulse">
                Updating...
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">Search by email, name, phone, or location</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-xs font-medium shadow-2xs"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>

          <select
            value={verificationStatus}
            onChange={(e) => setVerificationStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-xs font-medium shadow-2xs"
          >
            <option value="">All Verification</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
            <option value="NONE">None</option>
          </select>

          <div className="relative flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-xs font-medium shadow-2xs"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
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
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 font-bold text-slate-700 text-xs uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3.5 font-bold text-slate-700 text-xs uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3.5 font-bold text-slate-700 text-xs uppercase tracking-wider">
                  Verification
                </th>
                <th className="px-6 py-3.5 font-bold text-slate-700 text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 font-bold text-slate-700 text-xs uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3.5 font-bold text-slate-700 text-xs uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="text-xs font-medium">Loading user records...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <p className="text-sm font-bold text-slate-700">No users found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting your filters or search query.</p>
                  </td>
                </tr>
              ) : (
                users.map((user: any) => {
                  const userName =
                    user.profile?.displayName || user.firstName
                      ? `${user.firstName} ${user.lastName}`
                      : user.email;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0 shadow-2xs">
                            {(user.profile?.displayName || user.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs truncate">
                                {user.profile?.displayName || 'No Name'}
                              </span>
                            </div>
                            {user.firstName && user.lastName && (
                              <span className="text-[11px] text-slate-500 truncate block">
                                {user.firstName} {user.lastName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">{user.email}</td>
                      <td className="px-6 py-4">
                        {getVerificationBadge(user.verificationStatus)}
                      </td>
                      <td className="px-6 py-4">
                        <UserStatusBadge status={user.status} />
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            Details
                          </button>
                          {user.verificationStatus === 'VERIFIED' ? (
                            <button
                              onClick={() => openVerifyModal(user.id, userName, false)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                            >
                              Unverify
                            </button>
                          ) : (
                            <button
                              onClick={() => openVerifyModal(user.id, userName, true)}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            >
                              Verify
                            </button>
                          )}
                          {user.status === 'active' ? (
                            <button
                              onClick={() => openStatusModal(user.id, userName, 'suspended')}
                              className="px-2.5 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => openStatusModal(user.id, userName, 'active')}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-center gap-3 bg-slate-50">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
            >
              Previous
            </button>
            <span className="text-xs text-slate-600 font-bold px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
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
          onStatusUpdate={invalidateUsers}
        />
      )}

      <ActionConfirmModal
        isOpen={statusAction.open}
        onClose={() => setStatusAction({ ...statusAction, open: false })}
        onConfirm={handleConfirmStatusChange}
        title={statusAction.newStatus === 'suspended' ? 'Suspend User' : 'Activate User'}
        message={
          statusAction.newStatus === 'suspended'
            ? `Are you sure you want to suspend ${statusAction.userName}? They will not be able to log in.`
            : `Are you sure you want to reactivate the account for ${statusAction.userName}?`
        }
        confirmText={statusAction.newStatus === 'suspended' ? 'Suspend' : 'Activate'}
        confirmColor={statusAction.newStatus === 'suspended' ? 'yellow' : 'green'}
        showInput={statusAction.newStatus === 'suspended'}
        inputLabel="Suspension Reason"
        inputPlaceholder="Please explain why the account is being suspended..."
      />

      <ActionConfirmModal
        isOpen={verifyAction.open}
        onClose={() => setVerifyAction({ ...verifyAction, open: false })}
        onConfirm={handleConfirmVerification}
        title={verifyAction.isVerifying ? 'Verify User' : 'Unverify User'}
        message={
          verifyAction.isVerifying
            ? `Are you sure you want to grant a verified badge to ${verifyAction.userName}?`
            : `Are you sure you want to remove the verification from ${verifyAction.userName}?`
        }
        confirmText={verifyAction.isVerifying ? 'Verify' : 'Unverify'}
        confirmColor={verifyAction.isVerifying ? 'blue' : 'red'}
      />
    </div>
  );
}
