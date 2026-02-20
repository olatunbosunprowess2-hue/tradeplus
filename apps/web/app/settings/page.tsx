'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TradePreferences from '@/components/TradePreferences';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

export default function SettingsPage() {
    const { isAuthenticated, user } = useAuthStore();
    const router = useRouter();

    // Change password state
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    if (!isAuthenticated) {
        router.push('/login');
        return null;
    }

    const brandStatus = user?.brandVerificationStatus || 'NONE';

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (newPassword.length < 8) {
            setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        if (currentPassword === newPassword) {
            setPasswordMessage({ type: 'error', text: 'New password must be different from current password.' });
            return;
        }

        setPasswordLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await res.json();

            if (!res.ok || data.statusCode === 400) {
                throw new Error(data.message || 'Failed to change password');
            }

            setPasswordMessage({ type: 'success', text: data.message || 'Password changed successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setShowPasswordForm(false);
        } catch (err: any) {
            setPasswordMessage({ type: 'error', text: err.message || 'Something went wrong.' });
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="container mx-auto px-4 py-6 max-w-2xl">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 font-medium transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-600">Manage your app preferences</p>
                </div>

                {/* Settings Sections */}
                <div className="space-y-4">
                    {/* Account Section */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="font-bold text-gray-900">Account</h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            <Link href="/profile" className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
                                <div>
                                    <p className="font-medium text-gray-900">Edit Profile</p>
                                    <p className="text-sm text-gray-500">Update your display name and bio</p>
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="font-bold text-gray-900">Security</h2>
                        </div>
                        <div className="px-6 py-4">
                            {/* Password Message */}
                            {passwordMessage && (
                                <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${passwordMessage.type === 'success'
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}>
                                    {passwordMessage.type === 'success' ? '✅' : '❌'} {passwordMessage.text}
                                </div>
                            )}

                            {!showPasswordForm ? (
                                <button
                                    onClick={() => { setShowPasswordForm(true); setPasswordMessage(null); }}
                                    className="flex items-center justify-between w-full py-2 hover:opacity-80 transition"
                                >
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900">Change Password</p>
                                        <p className="text-sm text-gray-500">Update your account password</p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            ) : (
                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900"
                                            placeholder="Enter current password"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            minLength={8}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900"
                                            placeholder="Min 8 characters"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            minLength={8}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900"
                                            placeholder="Retype new password"
                                        />
                                        {confirmPassword && newPassword !== confirmPassword && (
                                            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={passwordLoading}
                                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition"
                                        >
                                            {passwordLoading ? 'Changing...' : 'Change Password'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowPasswordForm(false);
                                                setCurrentPassword('');
                                                setNewPassword('');
                                                setConfirmPassword('');
                                                setPasswordMessage(null);
                                            }}
                                            className="px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Brand Verification Section */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-bold text-gray-900">Brand Verification</h2>
                            {brandStatus === 'VERIFIED_BRAND' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-white text-xs font-bold shadow-sm">
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z" /></svg>
                                    Official Brand
                                </span>
                            )}
                            {brandStatus === 'PENDING' && (
                                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">Under Review</span>
                            )}
                        </div>
                        <div className="px-6 py-4">
                            {brandStatus === 'NONE' && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-3">Get the exclusive Gold Badge on your listings by verifying your brand identity.</p>
                                    <Link
                                        href="/brand-apply"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-white font-semibold rounded-xl shadow hover:shadow-lg transition-all text-sm"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z" /></svg>
                                        Request Brand Verification
                                    </Link>
                                </div>
                            )}
                            {brandStatus === 'PENDING' && (
                                <div className="bg-amber-50 rounded-xl p-4">
                                    <p className="text-sm text-amber-800 font-medium mb-1">⏱️ Application Under Review</p>
                                    <p className="text-xs text-amber-700">Our team is reviewing your brand verification request. This usually takes 24-48 hours.</p>
                                </div>
                            )}
                            {brandStatus === 'VERIFIED_BRAND' && (
                                <div className="bg-green-50 rounded-xl p-4">
                                    <p className="text-sm text-green-800 font-medium mb-1">✅ Your brand is officially verified!</p>
                                    <p className="text-xs text-green-700">The Gold Badge is displayed on all your listings. Buyers can see you are a trusted, verified brand.</p>
                                </div>
                            )}
                            {brandStatus === 'REJECTED' && (
                                <div>
                                    <div className="bg-red-50 rounded-xl p-4 mb-3">
                                        <p className="text-sm text-red-800 font-medium mb-1">❌ Application Declined</p>
                                        {user?.rejectionReason && (
                                            <p className="text-xs text-red-700">Reason: {user.rejectionReason}</p>
                                        )}
                                    </div>
                                    <Link
                                        href="/brand-apply"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-white font-semibold rounded-xl shadow hover:shadow-lg transition-all text-sm"
                                    >
                                        Reapply for Verification →
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Trade Preferences — Brand Only */}
                    {brandStatus === 'VERIFIED_BRAND' && (
                        <TradePreferences />
                    )}

                    {/* Support Section */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="font-bold text-gray-900">Support</h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            <Link href="/help" className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
                                <div>
                                    <p className="font-medium text-gray-900">Help Center</p>
                                    <p className="text-sm text-gray-500">FAQs and guides</p>
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                            <Link href="/appeals" className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
                                <div>
                                    <p className="font-medium text-gray-900">Submit Appeal</p>
                                    <p className="text-sm text-gray-500">Report issues or disputes</p>
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>

                    {/* App Info */}
                    <div className="text-center py-6 text-gray-500 text-sm">
                        <p className="font-semibold text-gray-700">BarterWave</p>
                        <p>Version 1.0.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
