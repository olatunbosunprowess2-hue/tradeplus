'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { sanitizeUrl } from '@/lib/utils';

interface Role {
    id: string;
    name: string;
    level: number;
    description: string;
    _count?: { users: number };
}

interface TeamMember {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    status: string;
    createdAt: string;
    profile?: {
        displayName?: string;
        avatarUrl?: string;
        lastLoginAt?: string;
    };
    userRole?: {
        id: string;
        name: string;
        level: number;
        description: string;
    };
}

interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profile?: {
        displayName?: string;
        avatarUrl?: string;
    };
}

const ROLE_COLORS: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-800 ring-purple-600/20',
    admin: 'bg-blue-100 text-blue-800 ring-blue-600/20',
    moderator: 'bg-green-100 text-green-800 ring-green-600/20',
    support: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
    analytics_viewer: 'bg-gray-100 text-gray-800 ring-gray-600/20',
};

const ROLE_ICONS: Record<string, string> = {
    super_admin: '👑',
    admin: '🛡️',
    moderator: '⚔️',
    support: '🎧',
    analytics_viewer: '📊',
};

export default function TeamManagementPage() {
    const { user, _hasHydrated } = useAuthStore();
    const router = useRouter();
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assigning, setAssigning] = useState(false);

    // Add member modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedNewMember, setSelectedNewMember] = useState<User | null>(null);
    const [newMemberRole, setNewMemberRole] = useState<string>('');
    const [searching, setSearching] = useState(false);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        // Allow admin roles: admin, moderator, super_admin
        const isAdminRole = user?.role === 'admin' || user?.userRole?.name === 'admin' ||
            user?.userRole?.name === 'moderator' || user?.userRole?.name === 'super_admin';
        if (_hasHydrated) {
            if (!user || !isAdminRole) {
                router.push('/login');
            }
        }
    }, [user, _hasHydrated, router]);

    useEffect(() => {
        const isAdminRole = user?.role === 'admin' || user?.userRole?.name === 'admin' ||
            user?.userRole?.name === 'moderator' || user?.userRole?.name === 'super_admin';
        if (isAdminRole) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const [membersRes, rolesRes] = await Promise.all([
                apiClient.get('/roles/team/members?includeRegularAdmins=true'),
                apiClient.get('/roles'),
            ]);
            setTeamMembers(membersRes.data);
            setRoles(rolesRes.data);
        } catch (error) {
            console.error('Failed to fetch team data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignRole = async () => {
        if (!selectedMember) return;

        setAssigning(true);
        try {
            await apiClient.post('/roles/assign', {
                userId: selectedMember.id,
                roleId: selectedRole || null,
            });
            await fetchData();
            setShowAssignModal(false);
            setSelectedMember(null);
            setSelectedRole('');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to assign role');
        } finally {
            setAssigning(false);
        }
    };

    // Debounced search - automatically searches after 300ms of no typing
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Don't search if query is empty or modal is closed
        if (!searchQuery.trim() || !showAddModal) {
            setSearchResults([]);
            return;
        }

        // Set new timeout for debounced search
        searchTimeoutRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const response = await apiClient.get(`/admin/users?search=${encodeURIComponent(searchQuery)}&limit=10`);
                // Filter out users who are already team members
                const teamMemberIds = new Set(teamMembers.map(m => m.id));
                const filteredUsers = (response.data.data || []).filter((u: User) => !teamMemberIds.has(u.id));
                setSearchResults(filteredUsers);
            } catch (error) {
                console.error('Failed to search users:', error);
            } finally {
                setSearching(false);
            }
        }, 300); // 300ms debounce delay

        // Cleanup timeout on unmount or query change
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, showAddModal, teamMembers]);

    const handleAddMember = async () => {
        if (!selectedNewMember || !newMemberRole) return;

        setAdding(true);
        try {
            await apiClient.post('/roles/assign', {
                userId: selectedNewMember.id,
                roleId: newMemberRole,
            });
            await fetchData();
            setShowAddModal(false);
            setSelectedNewMember(null);
            setNewMemberRole('');
            setSearchQuery('');
            setSearchResults([]);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to add team member');
        } finally {
            setAdding(false);
        }
    };

    const openAssignModal = (member: TeamMember) => {
        setSelectedMember(member);
        setSelectedRole(member.userRole?.id || '');
        setShowAssignModal(true);
    };

    const getUserCurrentRole = () => {
        return user?.userRole?.name || (user?.role === 'admin' ? 'super_admin' : 'user');
    };

    const canManageRole = (targetRoleLevel: number) => {
        const currentUserRoleLevel = user?.userRole?.level || (user?.role === 'admin' ? 100 : 0);
        // super_admin can manage anyone
        if (getUserCurrentRole() === 'super_admin' || user?.role === 'admin') return true;
        // Others can only manage lower levels
        return currentUserRoleLevel > targetRoleLevel;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Manage admin team members and their roles
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">
                            Your role: <span className="font-medium text-gray-900">{getUserCurrentRole()}</span>
                        </span>
                        {/* Add Team Member Button */}
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
                        >
                            <span>➕</span> Add Team Member
                        </button>
                    </div>
                </div>

                {/* Role Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    {roles.filter(r => r.name !== 'user').map((role) => (
                        <div
                            key={role.id}
                            className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">{ROLE_ICONS[role.name] || '👤'}</span>
                                <span className="font-medium text-gray-900 capitalize">
                                    {role.name.replace('_', ' ')}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{role._count?.users || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                        </div>
                    ))}
                </div>

                {/* Team Members Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900">Team Members</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                                <tr>
                                    <th className="px-6 py-4">Member</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Last Active</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {teamMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                                            No team members found. Click "Add Team Member" to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    teamMembers.map((member) => {
                                        const roleName = member.userRole?.name || member.role;
                                        const roleLevel = member.userRole?.level || (member.role === 'admin' ? 80 : 0);
                                        const canManage = canManageRole(roleLevel) && member.id !== user?.id;

                                        return (
                                            <tr key={member.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={sanitizeUrl(member.profile?.avatarUrl) || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.profile?.displayName || member.email)}&background=6366f1&color=fff`}
                                                            alt=""
                                                            className="w-10 h-10 rounded-full bg-gray-200"
                                                        />
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {member.profile?.displayName || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown'}
                                                            </p>
                                                            <p className="text-sm text-gray-500">{member.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${ROLE_COLORS[roleName] || 'bg-gray-100 text-gray-800'}`}>
                                                        <span>{ROLE_ICONS[roleName] || '👤'}</span>
                                                        {roleName.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {member.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {member.profile?.lastLoginAt
                                                        ? new Date(member.profile.lastLoginAt).toLocaleDateString()
                                                        : 'Never'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {canManage ? (
                                                        <button
                                                            onClick={() => openAssignModal(member)}
                                                            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        >
                                                            Change Role
                                                        </button>
                                                    ) : member.id === user?.id ? (
                                                        <span className="text-xs text-gray-400">You</span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">No access</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Change Role Modal */}
            {showAssignModal && selectedMember && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">Change Role</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Assign a new role to {selectedMember.profile?.displayName || selectedMember.email}
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Role
                                </label>
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value="">Remove Role (Regular User)</option>
                                    {roles
                                        .filter(r => r.name !== 'user' && canManageRole(r.level))
                                        .map((role) => (
                                            <option key={role.id} value={role.id}>
                                                {ROLE_ICONS[role.name]} {role.name.replace('_', ' ')} - {role.description}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-sm text-amber-800">
                                    ⚠️ Role changes take effect immediately. The user will gain/lose permissions based on their new role.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssignRole}
                                disabled={assigning}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
                            >
                                {assigning ? 'Saving...' : 'Confirm Change'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Team Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
                            <h3 className="text-lg font-bold text-white">Add Team Member</h3>
                            <p className="text-sm text-blue-100 mt-1">
                                Search for a user and assign them an admin role
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search User by Email or Name
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Start typing to search..."
                                        className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-lg text-gray-900 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                        {searching ? (
                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <span className="text-gray-400">🔍</span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Results appear as you type</p>
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                                    {searchResults.map((searchUser) => (
                                        <div
                                            key={searchUser.id}
                                            onClick={() => setSelectedNewMember(searchUser)}
                                            className={`p-3 cursor-pointer hover:bg-gray-50 flex items-center gap-3 ${selectedNewMember?.id === searchUser.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                                }`}
                                        >
                                            <img
                                                src={sanitizeUrl(searchUser.profile?.avatarUrl) || `https://ui-avatars.com/api/?name=${encodeURIComponent(searchUser.profile?.displayName || searchUser.email)}&background=6366f1&color=fff`}
                                                alt=""
                                                className="w-8 h-8 rounded-full"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {searchUser.profile?.displayName || `${searchUser.firstName || ''} ${searchUser.lastName || ''}`.trim() || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-gray-500">{searchUser.email}</p>
                                            </div>
                                            {selectedNewMember?.id === searchUser.id && (
                                                <span className="ml-auto text-blue-600">✓</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Selected User */}
                            {selectedNewMember && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800 font-medium">Selected User:</p>
                                    <p className="text-blue-900">{selectedNewMember.profile?.displayName || selectedNewMember.email}</p>
                                </div>
                            )}

                            {/* Role Selection */}
                            {selectedNewMember && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Assign Role
                                    </label>
                                    <select
                                        value={newMemberRole}
                                        onChange={(e) => setNewMemberRole(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        <option value="">Select a role...</option>
                                        {roles
                                            .filter(r => r.name !== 'user' && canManageRole(r.level))
                                            .map((role) => (
                                                <option key={role.id} value={role.id}>
                                                    {ROLE_ICONS[role.name]} {role.name.replace('_', ' ')} - {role.description}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setSelectedNewMember(null);
                                    setNewMemberRole('');
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddMember}
                                disabled={adding || !selectedNewMember || !newMemberRole}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
                            >
                                {adding ? 'Adding...' : 'Add to Team'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
