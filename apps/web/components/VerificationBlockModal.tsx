'use client';

import { useRouter } from 'next/navigation';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function VerificationBlockModal({ isOpen, onClose }: ModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    const handleStartVerification = () => {
        onClose();
        router.push('/onboarding');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl">🛡️</span>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Verification Required</h3>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left mb-6">
                        <p className="text-blue-800 text-sm leading-relaxed">
                            "To ensure a safe trading environment, we require all sellers and barter traders to verify their identity. This helps prevent fraud and builds trust in our community."
                        </p>
                    </div>

                    <p className="text-gray-500 text-sm mb-8">
                        It only takes a few minutes to get verified and unlock full access to listing and bartering.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={handleStartVerification}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg"
                        >
                            Start Verification
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
