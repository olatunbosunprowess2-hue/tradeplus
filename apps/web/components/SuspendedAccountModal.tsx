'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

interface SuspendedAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    actionAttempted?: string;
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Red Header Banner */}
                <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 px-6 py-5 text-white">
                    <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 bg-white/30 rounded-full animate-ping" />
                            <div className="relative bg-white/20 rounded-full p-3">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold tracking-wide">Account Suspended</h3>
                            <p className="text-red-200 text-sm mt-0.5">Action not permitted</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Message */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                        <div className="flex gap-3">
                            <span className="text-xl shrink-0">⚠️</span>
                            <p className="text-sm text-amber-900">
                                <strong>You attempted to {actionAttempted}</strong>, but this action is restricted while your account is suspended.
                            </p>
                        </div>
                    </div>

                    {/* Suspension Reason */}
                    {user?.rejectionReason && (
                        <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4 mb-5">
                            <p className="text-xs font-bold text-red-900 uppercase tracking-wider mb-1">Suspension Reason</p>
                            <p className="text-sm text-red-800">{user.rejectionReason}</p>
                        </div>
                    )}

                    {/* What You Can Still Do */}
                    <div className="mb-5">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">What you can still do</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 bg-green-50 text-green-800 text-xs font-medium px-3 py-2 rounded-lg">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Browse listings
                            </div>
                            <div className="flex items-center gap-2 bg-green-50 text-green-800 text-xs font-medium px-3 py-2 rounded-lg">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                View profiles
                            </div>
                            <div className="flex items-center gap-2 bg-green-50 text-green-800 text-xs font-medium px-3 py-2 rounded-lg">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Notifications
                            </div>
                            <div className="flex items-center gap-2 bg-blue-50 text-blue-800 text-xs font-medium px-3 py-2 rounded-lg">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Submit appeal
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleGoToAppeals}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-800 to-red-700 text-white text-center py-4 rounded-xl font-bold text-base hover:from-red-900 hover:to-red-800 transition shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Submit Appeal to Restore Access
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full text-gray-500 text-sm hover:text-gray-700 font-medium py-3 hover:bg-gray-50 rounded-xl transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
