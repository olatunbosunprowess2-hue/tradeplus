'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface GuestActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    action?: string; // e.g. "make an offer", "message a seller", "bookmark items"
}

export default function GuestActionModal({ isOpen, onClose, action = 'interact with listings' }: GuestActionModalProps) {
    const pathname = usePathname();
    // Encode current page as callback so user returns here after signup
    const callbackUrl = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : pathname);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-blue-600 px-6 py-8 text-center relative overflow-hidden">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Join BarterWave</h3>
                    <p className="text-blue-100 text-sm">Sign up to {action}</p>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* Benefits */}
                    <div className="space-y-2.5">
                        {[
                            { icon: '🤝', text: 'Trade items you have for items you need' },
                            { icon: '💬', text: 'Chat directly with verified sellers' },
                            { icon: '🔒', text: 'Secure trades with real, verified people' },
                        ].map((benefit) => (
                            <div key={benefit.text} className="flex items-center gap-3 text-sm text-gray-600">
                                <span className="text-base">{benefit.icon}</span>
                                <span>{benefit.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="space-y-2.5 pt-2">
                        <Link
                            href={`/register?callbackUrl=${callbackUrl}`}
                            className="block w-full py-3.5 bg-blue-600 text-white text-center rounded-xl font-bold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-500/25 active:scale-[0.98]"
                        >
                            Create Free Account
                        </Link>
                        <Link
                            href={`/login?callbackUrl=${callbackUrl}`}
                            className="block w-full py-3.5 bg-gray-100 text-gray-700 text-center rounded-xl font-bold text-sm hover:bg-gray-200 transition"
                        >
                            I Already Have an Account
                        </Link>
                    </div>

                    {/* Dismiss */}
                    <button
                        onClick={onClose}
                        className="w-full text-gray-400 text-xs font-medium py-2 hover:text-gray-600 transition"
                    >
                        Just Browsing
                    </button>
                </div>
            </div>
        </div>
    );
}
