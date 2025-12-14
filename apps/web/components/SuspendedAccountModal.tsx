'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

interface SuspendedAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    actionAttempted?: string; // What action the user tried to do
}

export default function SuspendedAccountModal({
    isOpen,
    onClose,
    actionAttempted = 'perform this action',
}: SuspendedAccountModalProps) {
    const router = useRouter();
    const { user } = useAuthStore();

    if (!isOpen) return null;

    const handleGoToAppeals = () => {
        onClose();
        router.push('/appeals');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
                {/* Icon */}
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">⚠️</span>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
                    Account Suspended
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-center leading-relaxed mb-4">
                    Your account has been suspended and you cannot {actionAttempted} at this time.
                </p>

                {/* Suspension Reason */}
                {user?.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                        <p className="text-sm font-semibold text-red-900 mb-1">Reason:</p>
                        <p className="text-sm text-red-800">{user.rejectionReason}</p>
                    </div>
                )}

                {/* What You Can Do Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                    <p className="text-sm font-semibold text-gray-900 mb-2">What you can do:</p>
                    <ul className="text-sm text-gray-700 space-y-1.5">
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">✓</span>
                            <span>Browse listings and view profiles</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">✓</span>
                            <span>View your notifications</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">✓</span>
                            <span>Submit an appeal to restore your account</span>
                        </li>
                    </ul>
                </div>

                {/* What's Restricted */}
                <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 mb-6">
                    <p className="text-sm font-semibold text-red-900 mb-2">Restricted while suspended:</p>
                    <ul className="text-sm text-red-700 space-y-1.5">
                        <li className="flex items-start gap-2">
                            <span className="text-red-600 mt-0.5">✗</span>
                            <span>Creating new listings</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-600 mt-0.5">✗</span>
                            <span>Sending messages</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-600 mt-0.5">✗</span>
                            <span>Making or accepting offers</span>
                        </li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleGoToAppeals}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    >
                        📝 Submit an Appeal
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full text-gray-500 text-sm hover:text-gray-700 font-medium py-2"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
}
