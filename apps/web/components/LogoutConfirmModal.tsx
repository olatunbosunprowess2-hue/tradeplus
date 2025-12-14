'use client';

import { useRouter } from 'next/navigation';

interface LogoutConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }: LogoutConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Log Out?</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">
                        Are you sure you want to log out? You'll need to sign in again to access your listings and messages.
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        className="w-full px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-200"
                    >
                        Yes, Log Out
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition border border-gray-200"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
