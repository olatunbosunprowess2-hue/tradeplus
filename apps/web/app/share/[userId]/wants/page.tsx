'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { wantsApi } from '@/lib/wants-api';
import { WantItem } from '@/lib/wants-store';
import PublicWantCard from '@/components/PublicWantCard';
import Link from 'next/link';

export default function PublicWantsPage() {
    const params = useParams();
    const userId = params.userId as string;
    const [wants, setWants] = useState<WantItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWants = async () => {
            try {
                const data = await wantsApi.getAllByUser(userId);
                setWants(data);
            } catch (err) {
                setError('Failed to load wants list. It might be private or deleted.');
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchWants();
        }
    }, [userId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link href="/" className="text-blue-600 hover:underline">
                        Go to Home
                    </Link>
                </div>
            </div>
        );
    }

    const activeWants = wants.filter((i) => !i.isFulfilled);
    const fulfilledWants = wants.filter((i) => i.isFulfilled);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white shadow-sm border-b border-gray-200 mb-8">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-7xl">
                    <Link href="/" className="text-2xl font-extrabold text-blue-600 tracking-tight">
                        TradePlus
                    </Link>
                    <Link href="/register" className="btn-primary text-sm px-4 py-2">
                        Join TradePlus
                    </Link>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-7xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">User's Wishlist</h1>
                    <p className="text-gray-600">
                        Check out what this user is looking for. Have something? Make an offer!
                    </p>
                </div>

                {wants.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">This list is empty.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {activeWants.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {activeWants.map((item) => (
                                    <PublicWantCard key={item.id} item={item} />
                                ))}
                            </div>
                        )}

                        {fulfilledWants.length > 0 && (
                            <div className="pt-8 border-t border-gray-200">
                                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 justify-center">
                                    <span>✅</span> Fulfilled Items
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-75">
                                    {fulfilledWants.map((item) => (
                                        <PublicWantCard key={item.id} item={item} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
