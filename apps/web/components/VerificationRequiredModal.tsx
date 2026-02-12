import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useEffect } from 'react';
import Link from 'next/link';
import BrandBadge from './BrandBadge';

interface VerificationRequiredModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
}

export default function VerificationRequiredModal({
    isOpen,
    onClose,
}: VerificationRequiredModalProps) {
    const router = useRouter();
    const { user, refreshProfile } = useAuthStore();

    // Auto-refresh profile every 10 seconds to check for verification updates
    useEffect(() => {
        if (!isOpen) return;

        const interval = setInterval(() => {
            refreshProfile();
        }, 10000); // Check every 10 seconds

        return () => clearInterval(interval);
    }, [isOpen, refreshProfile]);

    if (!isOpen) return null;

    const isPending = user?.verificationStatus === 'PENDING';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                {/* Icon */}
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
                    {isPending ? 'Verification Under Review' : 'Identity Verification Required'}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-center leading-relaxed mb-6">
                    {isPending
                        ? 'Your verification documents are currently being reviewed by our team. You\'ll be able to list items and participate in barter trades once your account is approved.'
                        : 'To ensure a safe marketplace for everyone, we require all users to verify their identity before listing items or participating in barter trades.'}
                </p>

                {/* Why Section */}
                {!isPending && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Why is this mandatory?</p>
                        <ul className="text-sm text-blue-800 space-y-1.5">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>Prevents scams and fraud</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>Ensures real locations are displayed</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>Builds trust in the community</span>
                            </li>
                        </ul>
                    </div>
                )}

                {/* Timeline for pending */}
                {isPending && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-center">
                        <p className="text-sm font-semibold text-green-900 mb-1">⏱️ Expected Review Time</p>
                        <p className="text-sm text-green-800">Your account will be reviewed within <strong>24-48 hours</strong></p>
                    </div>
                )}

                {/* Verification Options */}
                {!isPending ? (
                    <div className="space-y-4">
                        <button
                            onClick={() => router.push('/onboarding')}
                            className="w-full bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-xl flex items-center justify-between hover:bg-blue-100 transition group text-left"
                        >
                            <div>
                                <div className="font-bold text-lg">Verify Identity</div>
                                <div className="text-blue-700 text-sm">For individuals & small businesses</div>
                            </div>
                            <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-2 text-sm text-gray-500">OR</span>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push('/brand-apply')}
                            className="w-full bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl flex items-center justify-between hover:bg-amber-100 transition group text-left"
                        >
                            <div>
                                <div className="font-bold text-lg flex items-center gap-2">
                                    Verify Brand/Business
                                    <BrandBadge size="sm" />
                                </div>
                                <div className="text-amber-700 text-sm">For established brands & verified sellers</div>
                                <div className="text-amber-600/80 text-xs mt-1">Note: Requires official documentation</div>
                            </div>
                            <svg className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full text-gray-400 text-sm hover:text-gray-600 font-medium py-2"
                        >
                            Maybe Later
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-100 text-gray-700 text-center py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition"
                    >
                        I Understand & Cancel
                    </button>
                )}
            </div>
        </div>
    );
}
