'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { disputesApi, Dispute } from '@/lib/disputes-api';
import Link from 'next/link';

export default function DisputesPage() {
    const router = useRouter();
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDisputes = async () => {
            try {
                const data = await disputesApi.getMyDisputes();
                setDisputes(data);
            } catch (error) {
                console.error('Failed to fetch disputes:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDisputes();
    }, []);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            open: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            under_review: 'bg-blue-100 text-blue-800 border-blue-200',
            resolved: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200',
        };
        return styles[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            open: 'Open',
            under_review: 'Under Review',
            resolved: 'Resolved',
            rejected: 'Rejected',
        };
        return labels[status] || status;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto max-w-4xl px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Disputes</h1>
                        <p className="text-gray-600">Track and manage your dispute cases</p>
                    </div>
                    <Link
                        href="/disputes/new"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        File New Dispute
                    </Link>
                </div>

                {/* Disputes List */}
                {disputes.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">✅</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Disputes</h3>
                        <p className="text-gray-600 mb-6">You haven't filed any disputes yet. That's great!</p>
                        <Link
                            href="/offers"
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            View Your Orders →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {disputes.map((dispute) => (
                            <div
                                key={dispute.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition cursor-pointer"
                                onClick={() => router.push(`/disputes/${dispute.id}`)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(dispute.status)}`}>
                                                {getStatusLabel(dispute.status)}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {new Date(dispute.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-1">
                                            {dispute.reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </h3>
                                        <p className="text-gray-600 text-sm line-clamp-2">{dispute.description}</p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                                {dispute.resolution && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Resolution:</span> {dispute.resolution.replace(/_/g, ' ')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
