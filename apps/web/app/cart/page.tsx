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
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-20">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                <p className="text-gray-600 mb-8">Looks like you haven't added anything yet.</p>
                <Link
                    href="/listings"
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-sm"
                >
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map((item) => (
                            <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex gap-4">
                                <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-gray-900 truncate pr-4">
                                                <Link href={`/listings/${item.id}`} className="hover:text-blue-600 transition">
                                                    {item.title}
                                                </Link>
                                            </h3>
                                            <p className="font-bold text-gray-900">
                                                {item.currency} {(item.price * item.quantity).toLocaleString()}
                                            </p>
                                        </div>
                                        <p className="text-sm text-gray-500">Sold by {item.sellerName}</p>
                                    </div>

                                    <div className="flex justify-between items-center mt-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center border border-gray-300 rounded-lg">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="px-3 py-1 text-gray-600 hover:bg-gray-50 transition rounded-l-lg disabled:opacity-50"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    -
                                                </button>
                                                <span className="px-2 font-medium text-gray-900 w-8 text-center">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="px-3 py-1 text-gray-600 hover:bg-gray-50 transition rounded-r-lg disabled:opacity-50"
                                                    disabled={item.quantity >= item.maxQuantity}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {item.maxQuantity} available
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="text-red-500 hover:text-red-700 text-sm font-medium transition"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={clearCart}
                            className="text-gray-500 hover:text-gray-700 text-sm font-medium mt-4"
                        >
                            Clear Cart
                        </button>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 sticky top-24">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>NGN {subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Service Fee (2%)</span>
                                    <span>NGN {serviceFee.toLocaleString()}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-lg text-gray-900">
                                    <span>Total</span>
                                    <span>NGN {total.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="mt-8">
                                <Link
                                    href="/checkout"
                                    className="w-full block text-center bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg shadow-primary-light/50"
                                >
                                    Proceed to Checkout
                                </Link>
                            </div>

                            <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 text-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span>Secure Checkout</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
