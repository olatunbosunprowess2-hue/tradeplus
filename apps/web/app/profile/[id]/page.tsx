'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import type { User, Listing } from '@/lib/types';
import ReviewList from '@/components/ReviewList';
import { ListingsGridSkeleton, SkeletonStyles } from '@/components/ui/Skeleton';
import { Star, ShieldCheck, MapPin, Calendar, ShoppingBag, MessageSquare } from 'lucide-react';

export default function PublicProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    const [user, setUser] = useState<User | null>(null);
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [userRes, listingsRes] = await Promise.all([
                    apiClient.get(`/users/${userId}`),
                    apiClient.get(`/listings?sellerId=${userId}&limit=20`)
                ]);
                setUser(userRes.data);
                setListings(listingsRes.data.data);
            } catch (error) {
                console.error('Failed to fetch profile data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchData();
    }, [userId]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <SkeletonStyles />
                <div className="h-48 bg-gray-200 rounded-2xl animate-pulse mb-8" />
                <ListingsGridSkeleton count={6} />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
                <p className="text-gray-500 mb-6">The profile you are looking for doesn't exist or is unavailable.</p>
                <Link href="/listings" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                    Back to Marketplace
                </Link>
            </div>
        );
    }

    const avatarUrl = user.profile?.avatarUrl
        ? (user.profile.avatarUrl.startsWith('http')
            ? user.profile.avatarUrl
            : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api').replace(/\/api$/, '')}${user.profile.avatarUrl}`)
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Cover */}
            <div className="h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
                <div className="absolute inset-0 bg-black/10"></div>
            </div>

            <div className="container mx-auto px-4 max-w-5xl -mt-16 relative z-10">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                    <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
                        {/* Avatar */}
                        <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden shrink-0">
                            <img src={avatarUrl} alt={user.profile?.displayName || 'User'} className="w-full h-full object-cover" />
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                        {user.profile?.displayName || 'User'}
                                        {user.verificationStatus === 'VERIFIED' && <ShieldCheck className="w-5 h-5 text-blue-600" />}
                                    </h1>
                                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {user.locationAddress || 'Address not listed'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            Member since {new Date(user.createdAt).getFullYear()}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push(`/messages?recipientId=${user.id}`)}
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Send Message
                                </button>
                            </div>

                            {user.profile?.bio && (
                                <p className="text-gray-600 text-sm italic mb-4">"{user.profile.bio}"</p>
                            )}

                            <div className="flex flex-wrap gap-6 py-4 border-t border-gray-100">
                                <div className="flex flex-col">
                                    <span className="text-xl font-bold text-gray-900">{user.profile?.rating || 5.0}</span>
                                    <span className="text-xs text-gray-500 flex items-center gap-0.5 uppercase tracking-wider font-semibold">
                                        Rating ({user.profile?.reviewCount || 0})
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-bold text-gray-900">{listings.length}</span>
                                    <span className="text-xs text-gray-500 flex items-center gap-0.5 uppercase tracking-wider font-semibold">
                                        Active Listings
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-bold text-gray-900">{user.profile?.responseRate || 100}%</span>
                                    <span className="text-xs text-gray-500 flex items-center gap-0.5 uppercase tracking-wider font-semibold">
                                        Response Rate
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 sticky top-0 bg-gray-50 py-2 z-10">
                    <button
                        onClick={() => setActiveTab('listings')}
                        className={`px-6 py-2.5 rounded-full text-sm font-semibold transition flex items-center gap-2 ${activeTab === 'listings' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Listings ({listings.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('reviews')}
                        className={`px-6 py-2.5 rounded-full text-sm font-semibold transition flex items-center gap-2 ${activeTab === 'reviews' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        <Star className="w-4 h-4" />
                        Reviews
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'listings' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {listings.length === 0 ? (
                            <div className="col-span-full bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-900">No active listings</h3>
                                <p className="text-gray-500">This user hasn't posted any items yet.</p>
                            </div>
                        ) : (
                            listings.map((l) => (
                                <Link key={l.id} href={`/listing/${l.id}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group">
                                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                        {l.images?.[0] ? (
                                            <img src={l.images[0].url} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                                        )}
                                        {l.isDistressSale && (
                                            <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                                DISTRESS
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h3 className="text-sm font-bold text-gray-900 truncate mb-1">{l.title}</h3>
                                        <p className="text-blue-600 font-bold text-sm">
                                            {l.priceCents ? `₦${(l.priceCents / 100).toLocaleString()}` : 'Free'}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <ReviewList userId={userId} />
                    </div>
                )}
            </div>
        </div>
    );
}
