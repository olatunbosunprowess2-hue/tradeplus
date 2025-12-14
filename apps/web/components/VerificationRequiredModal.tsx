import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useEffect } from 'react';

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
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
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

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                    {!isPending ? (
                        <>
                            <button
                                onClick={() => router.push('/onboarding')}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Verify Identity Now
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full text-gray-500 text-sm hover:text-gray-700 font-medium py-2"
                            >
                                Maybe Later
                            </button>
                        </>
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
        </div>
    );
}
