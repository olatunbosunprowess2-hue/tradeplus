'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { appealsApi, CreateAppealData } from '@/lib/appeals-api';
import { useToastStore } from '@/lib/toast-store';
import ImageUpload from '@/components/ImageUpload';

interface Appeal {
    id: string;
    reason: string;
    message: string;
    status: string;
    createdAt: string;
    reviewedAt?: string;
    adminMessage?: string;
}

export default function AppealsPage() {
    const router = useRouter();
    const { user, _hasHydrated } = useAuthStore();
    const { addToast } = useToastStore();

    const [appeals, setAppeals] = useState<Appeal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [reason, setReason] = useState('');
    const [message, setMessage] = useState('');
    const [evidenceImages, setEvidenceImages] = useState<string[]>([]);

    useEffect(() => {
        if (_hasHydrated && !user) {
            router.push('/login');
        }
    }, [user, _hasHydrated, router]);

    useEffect(() => {
        if (user) {
            fetchAppeals();
        }
    }, [user]);

    const fetchAppeals = async () => {
        try {
            const response = await appealsApi.getAppeals();
            setAppeals(response.data || []);
        } catch (error) {
            console.error('Failed to fetch appeals:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reason.trim() || !message.trim()) {
            addToast('error', 'Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const data: CreateAppealData = {
                reason: reason.trim(),
                message: message.trim(),
                evidenceImages,
            };

            await appealsApi.submitAppeal(data);
            addToast('success', 'Your appeal has been submitted. We will review it shortly.');
            setReason('');
            setMessage('');
            setEvidenceImages([]);
            setShowForm(false);
            fetchAppeals();
        } catch (error: any) {
            addToast('error', error.response?.data?.message || 'Failed to submit appeal');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">⏳ Pending Review</span>;
            case 'approved':
                return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">✅ Approved</span>;
            case 'rejected':
                return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">❌ Rejected</span>;
            default:
                return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{status}</span>;
        }
    };

    const hasPendingAppeal = appeals.some(a => a.status === 'pending');

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white">
                <div className="container mx-auto px-4 max-w-2xl py-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <span className="text-2xl">⚖️</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Appeals</h1>
                            <p className="text-amber-100">
                                {user?.status === 'suspended'
                                    ? 'Your account is currently suspended. Submit an appeal below.'
                                    : 'View and manage your appeal history'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-2xl">
                {/* Suspension Notice */}
                {user?.status === 'suspended' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                        <div className="flex gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <h3 className="font-semibold text-red-800">Account Suspended</h3>
                                <p className="text-sm text-red-700 mt-1">
                                    Your account has been suspended. While suspended, you cannot create listings,
                                    send messages, or make offers. If you believe this was a mistake, please submit an appeal.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Appeal Button/Form */}
                {!showForm && !hasPendingAppeal && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition mb-6 shadow-lg shadow-blue-600/20"
                    >
                        📝 Submit New Appeal
                    </button>
                )}

                {hasPendingAppeal && !showForm && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                        <div className="flex gap-3">
                            <span className="text-2xl">⏳</span>
                            <div>
                                <h3 className="font-semibold text-yellow-800">Appeal Pending</h3>
                                <p className="text-sm text-yellow-700 mt-1">
                                    You already have a pending appeal. Please wait for our team to review it.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Appeal Form */}
                {showForm && (
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit an Appeal</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Reason for Appeal *
                                </label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select a reason...</option>
                                    <option value="mistaken_identity">Mistaken Identity</option>
                                    <option value="false_report">False Report Against Me</option>
                                    <option value="misunderstanding">Misunderstanding</option>
                                    <option value="account_compromised">Account Was Compromised</option>
                                    <option value="policy_unclear">Policy Was Unclear</option>
                                    <option value="first_offense">First Offense - Seeking Leniency</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Explain Your Situation *
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={5}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    placeholder="Please provide a detailed explanation of why you believe the suspension should be lifted. Include any relevant context or evidence."
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Be respectful and honest. False information may result in permanent account ban.
                                </p>
                            </div>

                            {/* Evidence Upload Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Evidence (Optional)
                                </label>

                                {evidenceImages.length > 0 && (
                                    <div className="grid grid-cols-3 gap-3 mb-3">
                                        {evidenceImages.map((url, index) => (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={url}
                                                    alt={`Evidence ${index + 1}`}
                                                    className="w-full h-20 object-cover rounded-lg border border-gray-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setEvidenceImages(prev => prev.filter((_, i) => i !== index))}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    <ImageUpload
                                        onUploadComplete={(url) => setEvidenceImages(prev => [...prev, url])}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Upload screenshots or documents to support your case. Max 5MB per file.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Appeal'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* Appeals History */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Appeal History</h3>
                    </div>

                    {appeals.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <div className="text-4xl mb-2">📋</div>
                            <p>No appeals submitted yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {appeals.map((appeal) => (
                                <div key={appeal.id} className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {getStatusBadge(appeal.status)}
                                                <span className="text-xs text-gray-400">
                                                    {new Date(appeal.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 font-medium">
                                                Reason: {appeal.reason.replace(/_/g, ' ')}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                {appeal.message}
                                            </p>
                                            {appeal.adminMessage && (
                                                <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                                                    <p className="text-xs text-gray-500 font-medium">Admin Response:</p>
                                                    <p className="text-sm text-gray-700">{appeal.adminMessage}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
