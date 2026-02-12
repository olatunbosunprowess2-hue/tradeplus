import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useEffect } from 'react';

interface VerificationBlockModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function VerificationBlockModal({ isOpen, onClose }: VerificationBlockModalProps) {
    const { user, refreshProfile } = useAuthStore();

    // Force immediate refresh when modal opens and poll more frequently
    useEffect(() => {
        if (!isOpen) return;

        // Immediate refresh on mount
        refreshProfile();

        // Then poll every 5 seconds for faster verification updates
        const interval = setInterval(() => {
            refreshProfile();
        }, 5000); // Check every 5 seconds (faster than before)

        return () => clearInterval(interval);
    }, [isOpen, refreshProfile]);


    // Auto-close modal if user becomes verified
    useEffect(() => {
        if (isOpen && user?.isVerified) {
            onClose();
        }
    }, [user?.isVerified, isOpen, onClose]);

    if (!isOpen) return null;

    const isPending = user?.verificationStatus === 'PENDING';
    const isRejected = user?.verificationStatus === 'REJECTED';

    const getTitle = () => {
        if (isPending) return 'Verification Under Review';
        if (isRejected) return 'Verification Rejected';
        return 'Identity Verification Required';
    };

    const getDescription = () => {
        if (isPending) return 'Your verification documents are currently being reviewed by our team. You\'ll be able to list items and participate in barter trades once your account is approved.';
        if (isRejected) return 'Your previous verification attempt was rejected. Please review the reason below and try again.';
        return 'To ensure a safe marketplace for everyone, we require all users to verify their identity before listing items or participating in barter trades.';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                {/* Icon */}
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isRejected ? 'bg-red-50' : 'bg-blue-50'}`}>
                    {isRejected ? (
                        <span className="text-4xl">⚠️</span>
                    ) : (
                        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    )}
                </div>

                {/* Title */}
                <h3 className={`text-2xl font-bold text-center mb-3 ${isRejected ? 'text-red-600' : 'text-gray-900'}`}>
                    {getTitle()}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-center leading-relaxed mb-6">
                    {getDescription()}
                </p>

                {/* Rejection Reason */}
                {isRejected && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center">
                        <p className="text-sm font-semibold text-red-900 mb-1">Reason for Rejection</p>
                        <p className="text-sm text-red-800">{user?.rejectionReason || 'Documents were unclear or invalid.'}</p>
                    </div>
                )}

                {/* Why Section (Only for initial) */}
                {!isPending && !isRejected && (
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

                {/* Action Button */}
                {!isPending ? (
                    <Link
                        href="/onboarding"
                        className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isRejected ? 'Try Again' : 'Verify Identity Now'}
                    </Link>
                ) : (
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-100 text-gray-700 text-center py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition"
                    >
                        I Understand
                    </button>
                )}

                {/* Cancel Button */}
                <button
                    onClick={onClose}
                    className="w-full mt-3 text-gray-500 text-sm hover:text-gray-700 font-medium py-2"
                >
                    {isPending ? 'Close' : 'Maybe Later'}
                </button>

                {/* Brand Verification CTA */}
                {user?.isVerified && user?.brandVerificationStatus !== 'VERIFIED_BRAND' && user?.brandVerificationStatus !== 'PENDING' && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <Link
                            href="/brand-apply"
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-amber-700 font-semibold text-sm hover:from-amber-100 hover:to-yellow-100 transition-all"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z" /></svg>
                            Are you a brand? Get the Gold Badge →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
