'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SettingsPage() {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        offers: true,
        messages: true,
    });

    if (!isAuthenticated) {
        router.push('/login');
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="container mx-auto px-4 py-6 max-w-2xl">
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
                            <Link href="/verification" className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
                                <div>
                                    <p className="font-medium text-gray-900">Verification</p>
                                    <p className="text-sm text-gray-500">Verify your identity</p>
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>

                    {/* Notifications Section */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="font-bold text-gray-900">Notifications</h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {[
                                { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                                { key: 'push', label: 'Push Notifications', desc: 'Get alerts on your device' },
                                { key: 'offers', label: 'Offer Alerts', desc: 'When you receive new offers' },
                                { key: 'messages', label: 'Message Alerts', desc: 'When you receive new messages' },
                            ].map((item) => (
                                <div key={item.key} className="flex items-center justify-between px-6 py-4">
                                    <div>
                                        <p className="font-medium text-gray-900">{item.label}</p>
                                        <p className="text-sm text-gray-500">{item.desc}</p>
                                    </div>
                                    <button
                                        onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                                        className={`w-12 h-7 rounded-full transition-colors relative ${notifications[item.key as keyof typeof notifications] ? 'bg-blue-600' : 'bg-gray-300'
                                            }`}
                                    >
                                        <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications[item.key as keyof typeof notifications] ? 'right-1' : 'left-1'
                                            }`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

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
