'use client';

import { useState } from 'react';
import { useCartStore, CartItem } from '@/lib/cart-store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MakeOfferModal from '@/components/MakeOfferModal';
import { listingsApi } from '@/lib/listings-api';
import { toast } from 'react-hot-toast';

interface SellerGroup {
    sellerName: string;
    sellerAvatar?: string;
    items: CartItem[];
    subtotal: number;
}

export default function CartPage() {
    const { items, removeItem, updateQuantity, clearCart, clearSellerItems } = useCartStore();
    const router = useRouter();

    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const [selectedBundle, setSelectedBundle] = useState<CartItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleMakeOffer = async (offerData: any) => {
        if (!selectedBundle || selectedBundle.length === 0) return;
        setIsSubmitting(true);

        try {
            // Send the user's message as-is without concatenating bundle strings
            // The backend and UI naturally group bundle items without needing to bloat the message
            const finalMessage = offerData.message || 'I would like to trade for these items.';

            const response = await listingsApi.createOffer({
                targetListingId: selectedBundle[0].id, // primary item
                offerType: offerData.offerType,
                cashAmount: offerData.cashAmount,
                currency: offerData.currency,
                offeredItems: offerData.offeredItems,
                message: finalMessage,
            });

            toast.success('Bundle offer sent successfully!');
            clearSellerItems(selectedBundle[0].sellerId || 'unknown');
            setIsOfferModalOpen(false);

            if (response.data && response.data.id) {
                router.push(`/offers`);
            }
        } catch (error: any) {
            console.error('Failed to send bundle offer:', error);
            toast.error(error.response?.data?.message || 'Failed to send offer. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                <h2 className="text-4xl font-extrabold text-gray-900 mb-4 text-center tracking-tight">Your bag is empty</h2>
                <p className="text-gray-500 mb-10 text-lg text-center max-w-sm leading-relaxed">
                    Explore our marketplace to find one-of-a-kind items and start trading with the community!
                </p>
                <Link
                    href="/listings"
                    className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 active:scale-95"
                >
                    Explore Marketplace
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
            </div>
        );
    }

    // Group items by seller
    const groups = items.reduce((acc, item) => {
        const sId = item.sellerId || 'unknown';
        if (!acc[sId]) {
            acc[sId] = {
                sellerName: item.sellerName || 'Unknown Seller',
                sellerAvatar: item.sellerAvatar,
                items: [],
                subtotal: 0
            };
        }
        acc[sId].items.push(item);
        acc[sId].subtotal += (item.price || 0) * (item.quantity || 1);
        return acc;
    }, {} as Record<string, SellerGroup>);

    return (
        <div className="min-h-screen bg-[#fafbfc] py-12 md:py-16">
            <div className="max-w-[1100px] mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">
                            <span className="w-6 h-px bg-blue-600"></span>
                            Shopping Bag
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                            Your Cart <span className="text-gray-300 font-light ml-2">{items.length}</span>
                        </h1>
                    </div>
                    <button
                        onClick={clearCart}
                        className="text-blue-400 hover:text-red-500 font-bold transition-all flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-xl text-sm self-start md:self-auto group"
                    >
                        <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        CLEAR ALL
                    </button>
                </div>

                <div className="space-y-16">
                    {Object.entries(groups).map(([sellerId, group]) => (
                        <div key={sellerId} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Seller Header */}
                            <div className="flex items-center justify-between mb-6 group/seller">
                                <Link
                                    href={`/profile/${sellerId}`}
                                    className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                                >
                                    {group.sellerAvatar ? (
                                        <img
                                            src={group.sellerAvatar}
                                            alt=""
                                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-sm uppercase">
                                            {group.sellerName[0] || '?'}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900 tracking-tight">{group.sellerName}</h3>
                                        <p className="text-blue-600 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                            View Shop
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                        </p>
                                    </div>
                                </Link>
                                <button
                                    onClick={() => clearSellerItems(sellerId)}
                                    className="text-gray-400 hover:text-red-500 p-2 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    Clear
                                </button>
                            </div>

                            <div className="grid lg:grid-cols-12 gap-8">
                                {/* Items for this seller */}
                                <div className="lg:col-span-8 space-y-4">
                                    {group.items.map((item) => (
                                        <div key={item.id} className="bg-white rounded-[1.5rem] p-4 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 flex gap-6 hover:shadow-[0_15px_30px_rgb(0,0,0,0.04)] transition-all duration-300 group/item relative">
                                            <Link
                                                href={`/listings/${item.id}`}
                                                className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden relative"
                                            >
                                                <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover/item:scale-105 transition duration-500"
                                                />
                                            </Link>

                                            <div className="flex-1 min-w-0 flex flex-col py-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-gray-900 group-hover/item:text-blue-600 transition truncate pr-8">
                                                        <Link href={`/listings/${item.id}`}>
                                                            {item.title}
                                                        </Link>
                                                    </h4>
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                <div className="mt-auto flex items-end justify-between">
                                                    <div className="space-y-3">
                                                        <div className="text-xl font-black text-gray-900">
                                                            {item.currency} {(item.price * item.quantity).toLocaleString()}
                                                        </div>
                                                        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-0.5 w-fit border border-gray-100">
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white hover:shadow-sm rounded-lg transition disabled:opacity-20"
                                                                disabled={item.quantity <= 1}
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
                                                            </button>
                                                            <span className="w-6 text-center font-black text-gray-900 text-sm">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white hover:shadow-sm rounded-lg transition disabled:opacity-20"
                                                                disabled={item.quantity >= item.maxQuantity}
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Seller Subtotal & Checkout */}
                                <div className="lg:col-span-4">
                                    <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_15px_40px_rgb(0,0,0,0.03)] h-fit">
                                        <div className="space-y-4 mb-8">
                                            <div className="flex justify-between items-center text-gray-400 font-bold text-xs uppercase tracking-widest">
                                                <span>Subtotal</span>
                                                <span className="text-gray-900">NGN {group.subtotal.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-gray-400 font-bold text-xs uppercase tracking-widest">
                                                <span>Fee</span>
                                                <span className="text-emerald-600">FREE</span>
                                            </div>
                                            <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                                                <span className="text-xs font-black text-blue-900 uppercase">Total with {(group.sellerName || '').split(' ')[0]}</span>
                                                <span className="text-2xl font-black text-blue-600 tracking-tight">NGN {group.subtotal.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setSelectedBundle(group.items);
                                                setIsOfferModalOpen(true);
                                            }}
                                            disabled={isSubmitting}
                                            className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all text-center flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                        >
                                            {isSubmitting && selectedBundle.length > 0 && selectedBundle[0].sellerId === sellerId ? (
                                                'Sending...'
                                            ) : (
                                                <>
                                                    Make Offer for this Bundle
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                </>
                                            )}
                                        </button>

                                        <p className="mt-4 text-[10px] text-gray-400 font-bold text-center uppercase tracking-widest flex items-center justify-center gap-1">
                                            <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                            Buyer Protection Active
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Info Bar */}
                <div className="mt-20 py-8 border-t border-gray-100 grid md:grid-cols-3 gap-8 opacity-60">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">🤝</div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-relaxed">Direct Seller Deals<br />No Middleman Pricing</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">⚡</div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-relaxed">Instant Trade Offers<br />Negotiate with Sellers</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">🛡️</div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-relaxed">Secured Trust Circle<br />Verified BarterWave Users</p>
                    </div>
                </div>
            </div>

            {/* Make Offer Modal for Bundles */}
            {selectedBundle.length > 0 && (
                <MakeOfferModal
                    isOpen={isOfferModalOpen}
                    onClose={() => {
                        setIsOfferModalOpen(false);
                        setSelectedBundle([]);
                    }}
                    listing={{
                        id: selectedBundle[0].id,
                        title: `Bundle: ${selectedBundle[0].title} +${selectedBundle.length - 1} more`,
                        image: selectedBundle[0].image || '',
                        sellerName: selectedBundle[0].sellerName || 'Unknown Seller',
                        sellerLocation: 'See inside',
                        allowCash: true,
                        allowBarter: true,
                        allowCashPlusBarter: true,
                        currencyCode: selectedBundle[0].currency || 'NGN',
                    }}
                    onSubmit={handleMakeOffer}
                />
            )}
        </div>
    );
}
