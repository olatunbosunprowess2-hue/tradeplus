'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyPayment } from '@/lib/payments-api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function PaymentCallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const [message, setMessage] = useState<string>('');
    const reference = searchParams.get('reference');

    useEffect(() => {
        if (!reference) {
            setStatus('failed');
            return;
        }

        const verify = async () => {
            try {
                const result = await verifyPayment(reference);
                setStatus(result.success ? 'success' : 'failed');
                if (result.message) {
                    setMessage(result.message);
                }
            } catch (error) {
                console.error('Payment verification failed:', error);
                setStatus('failed');
            }
        };

        verify();
    }, [reference]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <LoadingSpinner size="lg" />
                        <h1 className="text-xl font-bold text-gray-900 mt-4">Verifying Payment...</h1>
                        <p className="text-gray-500 mt-2">Please wait while we confirm your transaction.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-green-700 mb-2">Payment Successful!</h1>
                        <p className="text-gray-600 mb-6">
                            {message || 'Your purchase has been activated. Thank you for your support!'}
                        </p>
                        <button
                            onClick={() => router.push('/listings')}
                            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                        >
                            Continue Shopping
                        </button>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-red-700 mb-2">Payment Failed</h1>
                        <p className="text-gray-600 mb-6">
                            Something went wrong with your payment. Please try again or contact support.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => router.back()}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => router.push('/listings')}
                                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                            >
                                Back to Listings
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
