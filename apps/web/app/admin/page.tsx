'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import VerificationReviewModal from '@/components/admin/VerificationReviewModal';
import type { User } from '@/lib/types';

// Mock data for pending users (since we don't have a real backend endpoint for this yet)
const MOCK_PENDING_USERS: User[] = [
    {
        id: 'user_123',
        email: 'alex.trader@example.com',
        role: 'user',
        createdAt: new Date().toISOString(),
        onboardingCompleted: true,
        isVerified: false,
        verificationStatus: 'PENDING',
        phoneNumber: '+234 800 123 4567',
        profile: {
            displayName: 'Alex Trader',
            bio: 'Vintage electronics collector.',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        },
        locationAddress: 'Lagos, Nigeria',
        idDocumentFrontUrl: 'https://placehold.co/600x400/png?text=ID+Front',
        idDocumentBackUrl: 'https://placehold.co/600x400/png?text=ID+Back',
        faceVerificationUrl: 'https://placehold.co/400x400/png?text=Selfie',
    },
    {
        id: 'user_456',
        email: 'sarah.baker@example.com',
        role: 'user',
        createdAt: new Date().toISOString(),
        onboardingCompleted: true,
        isVerified: false,
        verificationStatus: 'PENDING',
        phoneNumber: '+234 900 987 6543',
        profile: {
            displayName: 'Sarah Baker',
            bio: 'Professional baker and barter enthusiast.',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        },
        locationAddress: 'Abuja, Nigeria',
        idDocumentFrontUrl: 'https://placehold.co/600x400/png?text=ID+Front',
        idDocumentBackUrl: 'https://placehold.co/600x400/png?text=ID+Back',
        faceVerificationUrl: 'https://placehold.co/400x400/png?text=Selfie',
    }
];

export default function AdminDashboard() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [pendingUsers, setPendingUsers] = useState<User[]>(MOCK_PENDING_USERS);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // In a real app, we would check if user.role === 'admin'
    // For demo purposes, we'll allow access or redirect if not logged in
    useEffect(() => {
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);

    const handleReview = (user: User) => {
        setSelectedUser(user);
    };

    const handleCloseModal = () => {
        setSelectedUser(null);
    };

    const handleDecision = (userId: string, decision: 'APPROVE' | 'REJECT') => {
        // Remove user from list to simulate processing
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
        setSelectedUser(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-500">Manage user verifications and platform safety.</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                        <span className="text-sm text-gray-500">Pending Reviews:</span>
                        <span className="ml-2 font-bold text-blue-600 text-lg">{pendingUsers.length}</span>
                    </div>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800">Pending Verifications</h2>
                    </div>

                    {pendingUsers.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <p className="text-xl">🎉 All caught up!</p>
                            <p>No pending verifications at the moment.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Location</th>
                                        <th className="px-6 py-4">Submitted</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {pendingUsers.map((pendingUser) => (
                                        <tr key={pendingUser.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={pendingUser.profile?.avatarUrl}
                                                        alt={pendingUser.profile?.displayName}
                                                        className="w-10 h-10 rounded-full bg-gray-200"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-gray-900">{pendingUser.profile?.displayName}</p>
                                                        <p className="text-sm text-gray-500">{pendingUser.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {pendingUser.locationAddress || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">
                                                {new Date(pendingUser.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                                    Pending Review
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleReview(pendingUser)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
                                                >
                                                    Review
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {selectedUser && (
                <VerificationReviewModal
                    user={selectedUser}
                    onClose={handleCloseModal}
                    onDecision={handleDecision}
                />
            )}
        </div>
    );
}
