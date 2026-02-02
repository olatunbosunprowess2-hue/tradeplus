'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { disputesApi } from '@/lib/disputes-api';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface Order {
    id: string;
    status: string;
    totalPriceCents: number;
    currencyCode: string;
    createdAt: string;
    items: Array<{
        listing: {
            id: string;
            title: string;
            images?: Array<{ url: string }>;
        };
    }>;
}

const DISPUTE_REASONS = [
    { value: 'item_not_as_described', label: 'Item Not As Described', icon: '📦' },
    { value: 'seller_no_show', label: 'Seller Did Not Show Up', icon: '👤' },
    { value: 'buyer_no_show', label: 'Buyer Did Not Show Up', icon: '👥' },
    { value: 'fraud', label: 'Suspected Fraud', icon: '⚠️' },
    { value: 'other', label: 'Other Issue', icon: '❓' },
];

export default function NewDisputePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedOrderId = searchParams.get('orderId');

    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        orderId: preselectedOrderId || '',
        reason: '',
        description: '',
        evidenceImages: [] as string[],
    });

    // Fetch user's orders
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await apiClient.get('/orders/my');
                const eligibleOrders = response.data.filter((o: Order) =>
                    ['paid', 'fulfilled'].includes(o.status)
                );
                setOrders(eligibleOrders);
            } catch (err) {
                console.error('Failed to fetch orders:', err);
            } finally {
                setIsLoadingOrders(false);
            }
        };
        fetchOrders();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.orderId) {
            setError('Please select an order');
            return;
        }
        if (!formData.reason) {
            setError('Please select a reason');
            return;
        }
        if (formData.description.length < 20) {
            setError('Please provide more details (at least 20 characters)');
            return;
        }

        setIsSubmitting(true);
        try {
            await disputesApi.create({
                orderId: formData.orderId,
                reason: formData.reason,
                description: formData.description,
                evidenceImages: formData.evidenceImages,
            });
            router.push('/disputes?success=1');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to file dispute');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedOrder = orders.find(o => o.id === formData.orderId);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto max-w-2xl px-4">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/disputes" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 mb-4">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Disputes
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">File a Dispute</h1>
                    <p className="text-gray-600">Report an issue with a trade or transaction</p>
                </div>

                {/* Safety Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-yellow-800">
                        🛡️ <strong>Before filing:</strong> Have you tried contacting the other party through BarterWave chat?
                        Many issues can be resolved directly. Disputes are reviewed by our team and may take 2-3 business days.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
                    {/* Order Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Select Order *</label>
                        {isLoadingOrders ? (
                            <div className="animate-pulse h-12 bg-gray-100 rounded-lg"></div>
                        ) : orders.length === 0 ? (
                            <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-600">
                                No eligible orders found. Only paid or fulfilled orders can be disputed.
                            </div>
                        ) : (
                            <select
                                value={formData.orderId}
                                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            >
                                <option value="">Choose an order...</option>
                                {orders.map((order) => (
                                    <option key={order.id} value={order.id}>
                                        {order.items[0]?.listing?.title || 'Order'} - {new Date(order.createdAt).toLocaleDateString()}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Reason Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Reason for Dispute *</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {DISPUTE_REASONS.map((reason) => (
                                <button
                                    key={reason.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, reason: reason.value })}
                                    className={`p-4 border-2 rounded-xl text-left transition ${formData.reason === reason.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="text-xl mr-2">{reason.icon}</span>
                                    <span className="font-medium text-gray-900">{reason.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Describe the Issue *
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Please provide detailed information about what happened..."
                            rows={5}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {formData.description.length}/2000 characters (min 20)
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex gap-4">
                        <Link
                            href="/disputes"
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition text-center"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting || orders.length === 0}
                            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
