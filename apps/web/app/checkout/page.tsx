'use client';

import { useState, useEffect } from 'react';
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

    // Redirect empty cart
    useEffect(() => {
        if (items.length === 0 && step !== 'confirmation') {
            // Optional: router.push('/cart');
        }
    }, [items, step, router]);


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
        window.scrollTo(0, 0);
    };

    const handlePaymentSubmit = async () => {
        setIsProcessing(true);
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        clearCart();
        setIsProcessing(false);
        setStep('confirmation');
        window.scrollTo(0, 0);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Checkout</h1>
                    <p className="text-gray-500">Complete your purchase securely</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Progress Steps */}
                        <div className="flex items-center justify-between mb-8 px-4 bg-white py-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className={`flex flex-col items-center relative z-10 transition-colors duration-300 ${step === 'shipping' ? 'text-blue-600' : 'text-gray-500'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 font-bold text-lg shadow-sm transition-all duration-300 ${step === 'shipping' || step === 'payment' || step === 'confirmation' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-200' : 'bg-gray-100'}`}>
                                    {step === 'payment' || step === 'confirmation' ? (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                        '1'
                                    )}
                                </div>
                                <span className="text-sm font-semibold">Shipping</span>
                            </div>
                            <div className="h-1 flex-1 mx-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 ease-out ${step === 'payment' || step === 'confirmation' ? 'w-full' : 'w-0'}`} />
                            </div>
                            <div className={`flex flex-col items-center relative z-10 transition-colors duration-300 ${step === 'payment' ? 'text-blue-600' : 'text-gray-500'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 font-bold text-lg shadow-sm transition-all duration-300 ${step === 'payment' || step === 'confirmation' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-200' : 'bg-gray-100'}`}>
                                    {step === 'confirmation' ? (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                        '2'
                                    )}
                                </div>
                                <span className="text-sm font-semibold">Payment</span>
                            </div>
                            <div className="h-1 flex-1 mx-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 ease-out ${step === 'confirmation' ? 'w-full' : 'w-0'}`} />
                            </div>
                            <div className={`flex flex-col items-center relative z-10 transition-colors duration-300 ${step === 'confirmation' ? 'text-blue-600' : 'text-gray-500'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 font-bold text-lg shadow-sm transition-all duration-300 ${step === 'confirmation' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-200' : 'bg-gray-100'}`}>3</div>
                                <span className="text-sm font-semibold">Done</span>
                            </div>
                        </div>

                        {step === 'shipping' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Information</h2>
                                <form onSubmit={handleShippingSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={shippingInfo.fullName}
                                            onChange={(e) => setShippingInfo({ ...shippingInfo, fullName: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                                        <input
                                            type="text"
                                            required
                                            value={shippingInfo.address}
                                            onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                                            placeholder="123 Main St, Apt 4B"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                                            <input
                                                type="text"
                                                required
                                                value={shippingInfo.city}
                                                onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                                                placeholder="Lagos"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                                            <input
                                                type="text"
                                                required
                                                value={shippingInfo.state}
                                                onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                                                placeholder="Lagos State"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            required
                                            value={shippingInfo.phone}
                                            onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                                            placeholder="+234 80 0000 0000"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition transform hover:-translate-y-0.5"
                                    >
                                        Continue to Payment
                                    </button>
                                </form>
                            </div>
                        )}

                        {step === 'payment' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>

                                <div className="space-y-4 mb-8">
                                    <div className="p-4 border-2 border-blue-500 bg-blue-50/50 rounded-xl flex items-center justify-between cursor-pointer transition">
                                        <div className="flex items-center gap-4">
                                            <div className="w-6 h-6 rounded-full border-[6px] border-blue-600 bg-white" />
                                            <span className="font-bold text-gray-900">Credit / Debit Card</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="w-10 h-6 bg-gray-200 rounded" />
                                            <div className="w-10 h-6 bg-gray-200 rounded" />
                                        </div>
                                    </div>

                                    <div className="p-4 border border-gray-200 rounded-xl flex items-center gap-4 opacity-50 cursor-not-allowed bg-gray-50">
                                        <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                                        <span className="font-medium text-gray-900">Bank Transfer</span>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Card Number</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="0000 0000 0000 0000"
                                                className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                                            />
                                            <svg className="w-6 h-6 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date</label>
                                            <input
                                                type="text"
                                                placeholder="MM/YY"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">CVC</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="123"
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                                                />
                                                <svg className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-8">
                                    <button
                                        onClick={() => setStep('shipping')}
                                        className="flex-1 py-4 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handlePaymentSubmit}
                                        disabled={isProcessing}
                                        className="flex-[2] py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing...
                                            </>
                                        ) : (
                                            `Pay ₦${(total / 100).toLocaleString()}`
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'confirmation' && (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center transform transition-all animate-fade-in-up">
                                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                                    <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-4xl font-extrabold text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-teal-600">Order Confirmed!</h2>
                                <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                                    Thank you for your purchase. Your order has been received and is being processed. You will receive an email confirmation shortly.
                                </p>
                                <Link
                                    href="/listings"
                                    className="inline-block px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold text-lg hover:shadow-lg hover:scale-105 transition duration-200"
                                >
                                    Continue Shopping
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    {step !== 'confirmation' && (
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>
                                <div className="space-y-4 mb-6">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex gap-4 p-2 hover:bg-gray-50 rounded-lg transition">
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                                {item.image && (
                                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                                                <p className="text-sm font-bold text-gray-900 mt-1">₦{((item.price * item.quantity) / 100).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-gray-100 pt-4 space-y-3">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span className="font-medium">₦{(total / 100).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Shipping</span>
                                        <span className="text-green-600 font-medium">Free</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-4 border-t border-gray-100 mt-2">
                                        <span>Total</span>
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                            ₦{(total / 100).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 text-xs">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span>Encrypted & Secure</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
