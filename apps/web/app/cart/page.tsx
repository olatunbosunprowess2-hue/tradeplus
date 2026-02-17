'use client';

import { useCartStore } from '@/lib/cart-store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
    const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
    const router = useRouter();

    const subtotal = getTotal();
    const total = subtotal; // Platform fee removed

    if (items.length === 0) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-white">
                <div className="relative w-48 h-48 mb-8">
                    <div className="absolute inset-0 bg-blue-50 rounded-full animate-ping opacity-20 scale-150" />
                    <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full w-full h-full flex items-center justify-center shadow-inner border border-blue-100/50">
                        <svg className="w-24 h-24 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                </div>
                <h2 className="text-4xl font-extrabold text-gray-900 mb-4 text-center tracking-tight">Your cart is empty</h2>
                <p className="text-gray-500 mb-10 text-lg text-center max-w-sm leading-relaxed">
                    Looks like you haven't added anything yet. Start exploring our marketplace for unique finds and great deals!
                </p>
                <Link
                    href="/listings"
                    className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-black hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-3"
                >
                    Explore Marketplace
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafbfc] py-12 md:py-20">
            <div className="max-w-[1200px] mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">
                            <span className="w-6 h-px bg-blue-600"></span>
                            Shopping Bag
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                            Checkout <span className="text-gray-300 font-light ml-2">{items.length}</span>
                        </h1>
                    </div>
                    <button
                        onClick={clearCart}
                        className="text-gray-400 hover:text-red-500 font-bold transition-all flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-xl text-sm self-start md:self-auto group"
                    >
                        <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        EMPTY BAG
                    </button>
                </div>

                <div className="grid lg:grid-cols-12 gap-12">
                    {/* Cart Items List */}
                    <div className="lg:col-span-8 space-y-6">
                        {items.map((item) => (
                            <div key={item.id} className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100 flex flex-col sm:flex-row gap-8 hover:shadow-[0_20px_40px_rgb(0,0,0,0.05)] transition-all duration-500 group relative">
                                <Link
                                    href={`/listings/${item.id}`}
                                    className="w-full sm:w-44 h-44 flex-shrink-0 bg-gray-50 rounded-2xl overflow-hidden relative"
                                >
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                                    />
                                    {item.quantity >= item.maxQuantity && (
                                        <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] py-1 px-2 rounded-lg text-center font-bold">
                                            MAX REACHED
                                        </div>
                                    )}
                                </Link>

                                <div className="flex-1 min-w-0 flex flex-col py-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="space-y-1 pr-6">
                                            <h3 className="font-bold text-xl text-gray-900 leading-tight group-hover:text-blue-600 transition truncate">
                                                <Link href={`/listings/${item.id}`}>
                                                    {item.title}
                                                </Link>
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-500 rounded-lg">Seller</span>
                                                <span className="text-sm font-bold text-gray-900 underline decoration-gray-200 underline-offset-4">{item.sellerName}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-xl"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="mt-auto flex flex-wrap items-end justify-between gap-4">
                                        <div className="space-y-4">
                                            <div className="text-2xl font-black text-gray-900">
                                                {item.currency} {(item.price * item.quantity).toLocaleString()}
                                            </div>
                                            <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-1 w-fit border border-gray-100">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white hover:shadow-sm rounded-xl transition disabled:opacity-20"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
                                                </button>
                                                <span className="w-8 text-center font-black text-gray-900 text-base">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white hover:shadow-sm rounded-xl transition disabled:opacity-20"
                                                    disabled={item.quantity >= item.maxQuantity}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Premium Order Summary */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgb(0,0,0,0.04)] border border-gray-100 sticky top-24 overflow-hidden group/summary">
                            {/* Decorative element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover/summary:scale-110 transition-transform duration-700 opacity-50"></div>

                            <h2 className="text-2xl font-black text-gray-900 mb-8 relative">Summary</h2>

                            <div className="space-y-5 mb-8 relative">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 font-bold text-sm uppercase tracking-wider">Subtotal</span>
                                    <span className="font-bold text-gray-900">NGN {subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center group/fee">
                                    <span className="text-gray-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                                        Platform Fee
                                    </span>
                                    <span className="text-emerald-600 font-bold text-xs uppercase tracking-widest">FREE</span>
                                </div>

                                <div className="pt-6 border-t border-gray-100 space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="font-black text-xs text-gray-400 uppercase tracking-[0.2em]">Total</span>
                                        <div className="text-right">
                                            <div className="text-3xl font-black text-gray-900 tracking-tighter">
                                                NGN {total.toLocaleString()}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Transaction Secured</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 relative">
                                <Link
                                    href="/checkout"
                                    className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1 transition-all duration-300 text-center flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-blue-500/10"
                                >
                                    Proceed to Checkout
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </Link>

                                <div className="flex flex-col gap-3 pt-6">
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl shrink-0">🛡️</div>
                                        <div>
                                            <p className="text-xs font-black text-gray-900 uppercase">Buyer Protection</p>
                                            <p className="text-[10px] text-gray-500 font-bold">Safe & secure transactions</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl shrink-0">🚚</div>
                                        <div>
                                            <p className="text-xs font-black text-gray-900 uppercase">Verified Delivery</p>
                                            <p className="text-[10px] text-gray-500 font-bold">Trackable shipping labels</p>
                                        </div>
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
