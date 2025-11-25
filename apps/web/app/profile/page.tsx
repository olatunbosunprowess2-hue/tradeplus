'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import EditProfileModal from '@/components/EditProfileModal';
import ReviewList from '@/components/ReviewList';

export default function ProfilePage() {
    const { user, isAuthenticated, logout } = useAuthStore();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'listings' | 'reviews' | 'settings'>('listings');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted && !isAuthenticated) {
            router.push('/login');
        }
    }, [isMounted, isAuthenticated, router]);

    if (!isMounted || !user) return null;

    // Mock data for listings - In a real app, fetch this from API
    const listings = [
        { id: '1', title: 'iPhone 13 Pro', price: 'NGN 450,000', status: 'Active', image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=400&h=400&fit=crop' },
        { id: '2', title: 'MacBook Air M1', price: 'NGN 600,000', status: 'Sold', image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400&h=400&fit=crop' },
    ];

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Cover */}
            <div className="h-48 relative" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)' }}>
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>

            <div className="container mx-auto px-4 max-w-5xl -mt-16 relative z-10">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
                                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold">
                                    {user.profile?.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                                </div>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-green-500 w-5 h-5 rounded-full border-2 border-white" title="Online"></div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 pt-2">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                        {user.profile?.displayName || 'User'}
                                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </h1>
                                    <p className="text-gray-500 flex items-center gap-1 mt-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {user.profile?.region?.city || 'Lagos'}, {user.profile?.region?.name || 'Nigeria'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition shadow-sm"
                                >
                                    Edit Profile
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-6 py-4 border-t border-gray-100">
                                <div>
                                    <span className="block text-2xl font-bold text-gray-900">{user.profile?.responseRate || 100}%</span>
                                    <span className="text-sm text-gray-500">Response Rate</span>
                                </div>
                                <div>
                                    <span className="block text-2xl font-bold text-gray-900">{user.profile?.rating || 5.0}</span>
                                    <span className="text-sm text-gray-500">Rating ({user.profile?.reviewCount || 0} reviews)</span>
                                </div>
                                <div>
                                    <span className="block text-2xl font-bold text-gray-900">2024</span>
                                    <span className="text-sm text-gray-500">Member Since</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-t border-gray-200 px-6">
                        <button
                            onClick={() => setActiveTab('listings')}
                            className={`px-6 py-4 font-medium text-sm border-b-2 transition ${activeTab === 'listings'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            My Listings
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`px-6 py-4 font-medium text-sm border-b-2 transition ${activeTab === 'reviews'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Reviews
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`px-6 py-4 font-medium text-sm border-b-2 transition ${activeTab === 'settings'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Settings
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {activeTab === 'listings' && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {listings.map((listing) => (
                                <div key={listing.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
                                    <div className="aspect-video bg-gray-100 relative">
                                        <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
                                        <div className="absolute top-2 right-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${listing.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {listing.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-900 mb-1">{listing.title}</h3>
                                        <p className="text-blue-600 font-bold text-sm mb-4">{listing.price}</p>
                                        <div className="flex gap-2">
                                            <button className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition">
                                                Edit
                                            </button>
                                            <button className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Add New Card */}
                            <Link href="/listings/create" className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-8 hover:border-blue-600 hover:bg-blue-50 transition group">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <span className="font-bold text-gray-900">Create New Listing</span>
                            </Link>
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Reviews Received</h2>
                            <ReviewList userId={user.id} />
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Settings Sidebar */}
                            <div className="md:col-span-1 space-y-1">
                                <button className="w-full text-left px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg">
                                    General
                                </button>
                                <button className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 font-medium rounded-lg transition">
                                    Notifications
                                </button>
                                <button className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 font-medium rounded-lg transition">
                                    Privacy & Security
                                </button>
                                <button className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 font-medium rounded-lg transition">
                                    Payments
                                </button>
                            </div>

                            {/* Settings Content */}
                            <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">General Settings</h2>

                                <div className="space-y-8">
                                    {/* Contact Info */}
                                    <section className="space-y-4">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">Contact Information</h3>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                            <div className="flex gap-3">
                                                <input
                                                    type="email"
                                                    value={user.email}
                                                    disabled
                                                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                                                />
                                                <span className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-center">
                                                    Verified
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Contact support to change your email.</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                            <div className="flex gap-3">
                                                <input
                                                    type="tel"
                                                    placeholder="+234..."
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600"
                                                />
                                                <button className="px-4 py-2 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition">
                                                    Update
                                                </button>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Preferences */}
                                    <section className="space-y-4">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">Preferences</h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                                                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600">
                                                    <option value="NGN">Nigerian Naira (NGN)</option>
                                                    <option value="USD">US Dollar (USD)</option>
                                                    <option value="GBP">British Pound (GBP)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                                                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600">
                                                    <option value="en">English</option>
                                                    <option value="fr">French</option>
                                                </select>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Notifications */}
                                    <section className="space-y-4">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">Notifications</h3>

                                        <div className="space-y-3">
                                            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                                                <div>
                                                    <span className="block font-medium text-gray-900">Email Notifications</span>
                                                    <span className="text-xs text-gray-500">Receive updates about your listings and offers</span>
                                                </div>
                                                <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                                            </label>

                                            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                                                <div>
                                                    <span className="block font-medium text-gray-900">New Message Alerts</span>
                                                    <span className="text-xs text-gray-500">Get notified when someone messages you</span>
                                                </div>
                                                <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                                            </label>

                                            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                                                <div>
                                                    <span className="block font-medium text-gray-900">Marketing & Promos</span>
                                                    <span className="text-xs text-gray-500">Receive special offers and updates</span>
                                                </div>
                                                <input type="checkbox" className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                                            </label>
                                        </div>
                                    </section>

                                    {/* Account Actions */}
                                    <section className="pt-4 border-t border-gray-200 space-y-3">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition group"
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Modern Logout/Power Icon */}
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-200 transition">
                                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                </div>
                                                <div className="text-left">
                                                    <span className="block font-semibold text-gray-900">Logout</span>
                                                    <span className="text-xs text-gray-500">Sign out of your account</span>
                                                </div>
                                            </div>
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>

                                        <button
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                                                    alert('Account deletion would be processed here');
                                                }
                                            }}
                                            className="text-red-600 font-medium hover:text-red-700 text-sm flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Delete Account
                                        </button>
                                    </section>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
            />
        </div>
    );
}
