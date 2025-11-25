'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cart-store';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, clearCart, getTotal } = useCartStore();
    const { user } = useAuthStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<'shipping' | 'payment' | 'confirmation'>('shipping');

    const [shippingInfo, setShippingInfo] = useState({
        fullName: user?.profile?.displayName || '',
        address: '',
        city: user?.profile?.region?.city || '',
        state: user?.profile?.region?.name || '',
        phone: '',
    });

    const total = getTotal();

    if (items.length === 0 && step !== 'confirmation') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
                    <Link href="/listings" className="text-blue-600 hover:underline">
                        Browse Listings
                    </Link>
                </div>
            </div>
        );
    }

    const handleShippingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('payment');
    };

    const handlePaymentSubmit = async () => {
        setIsProcessing(true);
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        clearCart();
        setIsProcessing(false);
        setStep('confirmation');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Progress Steps */}
                        <div className="flex items-center justify-between mb-8 px-4">
                            <div className={`flex flex-col items-center ${step === 'shipping' ? 'text-blue-600' : 'text-gray-500'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${step === 'shipping' || step === 'payment' || step === 'confirmation' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</div>
                                <span className="text-sm font-medium">Shipping</span>
                            </div>
                            <div className="h-1 flex-1 mx-4 bg-gray-200">
                                <div className={`h-full bg-blue-600 transition-all ${step === 'payment' || step === 'confirmation' ? 'w-full' : 'w-0'}`} />
                            </div>
                            <div className={`flex flex-col items-center ${step === 'payment' ? 'text-blue-600' : 'text-gray-500'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${step === 'payment' || step === 'confirmation' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</div>
                                <span className="text-sm font-medium">Payment</span>
                            </div>
                            <div className="h-1 flex-1 mx-4 bg-gray-200">
                                <div className={`h-full bg-blue-600 transition-all ${step === 'confirmation' ? 'w-full' : 'w-0'}`} />
                            </div>
                            <div className={`flex flex-col items-center ${step === 'confirmation' ? 'text-blue-600' : 'text-gray-500'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${step === 'confirmation' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>3</div>
                                <span className="text-sm font-medium">Confirmation</span>
                            </div>
                        </div>

                        {step === 'shipping' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Shipping Information</h2>
                                <form onSubmit={handleShippingSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={shippingInfo.fullName}
                                            onChange={(e) => setShippingInfo({ ...shippingInfo, fullName: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                        <input
                                            type="text"
                                            required
                                            value={shippingInfo.address}
                                            onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                            <input
                                                type="text"
                                                required
                                                value={shippingInfo.city}
                                                onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                            <input
                                                type="text"
                                                required
                                                value={shippingInfo.state}
                                                onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            required
                                            value={shippingInfo.phone}
                                            onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition mt-4"
                                    >
                                        Continue to Payment
                                    </button>
                                </form>
                            </div>
                        )}

                        {step === 'payment' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="p-4 border border-blue-600 bg-blue-50 rounded-lg flex items-center justify-between cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center">
                                                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                                            </div>
                                            <span className="font-medium text-gray-900">Credit / Debit Card</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="w-8 h-5 bg-gray-200 rounded" />
                                            <div className="w-8 h-5 bg-gray-200 rounded" />
                                        </div>
                                    </div>

                                    <div className="p-4 border border-gray-200 rounded-lg flex items-center gap-3 opacity-50 cursor-not-allowed">
                                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                        <span className="font-medium text-gray-900">Bank Transfer</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                                        <input
                                            type="text"
                                            placeholder="0000 0000 0000 0000"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                            <input
                                                type="text"
                                                placeholder="MM/YY"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                                            <input
                                                type="text"
                                                placeholder="123"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-8">
                                    <button
                                        onClick={() => setStep('shipping')}
                                        className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handlePaymentSubmit}
                                        disabled={isProcessing}
                                        className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
                                    >
                                        {isProcessing ? 'Processing...' : `Pay ₦${(total / 100).toLocaleString()}`}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'confirmation' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h2>
                                <p className="text-gray-600 mb-8">
                                    Thank you for your purchase. Your order has been received and is being processed.
                                </p>
                                <Link
                                    href="/listings"
                                    className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                                >
                                    Continue Shopping
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    {step !== 'confirmation' && (
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
                                <div className="space-y-4 mb-6">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex gap-3">
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                {item.image && (
                                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                <p className="text-sm font-bold text-gray-900">₦{((item.price * item.quantity) / 100).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-gray-200 pt-4 space-y-2">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>₦{(total / 100).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Shipping</span>
                                        <span>Free</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100 mt-2">
                                        <span>Total</span>
                                        <span>₦{(total / 100).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
