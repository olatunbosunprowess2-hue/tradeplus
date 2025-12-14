'use client';

import { useCartStore } from '@/lib/cart-store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
    const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
    const router = useRouter();

    const subtotal = getTotal();
    const serviceFee = subtotal * 0.02; // 2% service fee
    const total = subtotal + serviceFee;

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-20 px-4">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
                <p className="text-gray-600 mb-8 text-lg text-center max-w-md">Looks like you haven't found anything yet. Explore our marketplace to find great deals!</p>
                <Link
                    href="/listings"
                    className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold text-lg hover:shadow-lg hover:scale-105 transition transform duration-200"
                >
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900">Shopping Cart <span className="text-gray-400 font-medium text-xl ml-2">({items.length} items)</span></h1>
                    <button
                        onClick={clearCart}
                        className="text-red-500 hover:text-red-700 font-medium transition flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Clear Cart
                    </button>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map((item) => (
                            <div key={item.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 hover:shadow-md transition duration-200">
                                <Link href={`/listings/${item.id}`} className="w-full sm:w-32 h-32 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden group">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                    />
                                </Link>

                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start gap-4">
                                            <h3 className="font-bold text-lg text-gray-900 leading-tight">
                                                <Link href={`/listings/${item.id}`} className="hover:text-blue-600 transition">
                                                    {item.title}
                                                </Link>
                                            </h3>
                                            <p className="font-bold text-xl text-gray-900 whitespace-nowrap">
                                                {item.currency} {(item.price * item.quantity).toLocaleString()}
                                            </p>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                            Sold by <span className="font-medium text-gray-700">{item.sellerName}</span>
                                        </p>
                                    </div>

                                    <div className="flex justify-between items-end mt-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-1">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-sm rounded-md transition disabled:opacity-50"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    -
                                                </button>
                                                <span className="w-10 text-center font-bold text-gray-900 text-sm">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-sm rounded-md transition disabled:opacity-50"
                                                    disabled={item.quantity >= item.maxQuantity}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <span className="text-xs text-gray-400 font-medium">
                                                {item.maxQuantity} available
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="text-gray-400 hover:text-red-500 transition p-2 hover:bg-red-50 rounded-full"
                                            title="Remove item"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span className="font-medium text-gray-900">NGN {subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span className="flex items-center gap-1">
                                        Service Fee
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </span>
                                    <span className="font-medium text-gray-900">NGN {serviceFee.toLocaleString()}</span>
                                </div>
                                <div className="border-t border-gray-100 pt-4 flex justify-between items-end">
                                    <span className="font-bold text-lg text-gray-900">Total</span>
                                    <span className="font-bol text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                        NGN {total.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <Link
                                    href="/checkout"
                                    className="w-full block text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] transition duration-200"
                                >
                                    Proceed to Checkout
                                </Link>

                                <div className="grid grid-cols-2 gap-3 pt-4">
                                    <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg text-center">
                                        <svg className="w-6 h-6 text-green-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-xs font-medium text-gray-600">Secure Payment</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg text-center">
                                        <svg className="w-6 h-6 text-blue-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        <span className="text-xs font-medium text-gray-600">Buyer Protection</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
