'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import StepProfile from '@/components/onboarding/StepProfile';
import StepLocation from '@/components/onboarding/StepLocation';
import StepPhone from '@/components/onboarding/StepPhone';
import StepIdentity from '@/components/onboarding/StepIdentity';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api-client';

export default function OnboardingPage() {
    const router = useRouter();
    const { user, updateProfile } = useAuthStore();
    const [step, setStep] = useState(0); // 0: Intro, 1: Profile, 2: Location, 3: Phone, 4: Identity
    const [showSuccess, setShowSuccess] = useState(false);
    const [showRejectionBanner, setShowRejectionBanner] = useState(true);

    // Auto-dismiss rejection banner after 60 seconds
    useEffect(() => {
        if (user?.verificationStatus === 'REJECTED' && showRejectionBanner) {
            const timer = setTimeout(() => {
                setShowRejectionBanner(false);
            }, 60000); // 60 seconds
            return () => clearTimeout(timer);
        }
    }, [user?.verificationStatus, showRejectionBanner]);

    useEffect(() => {
        if (!user) {
            router.push('/login');
        } else if (user.isVerified) {
            router.push('/listings');
        } else if (user.verificationStatus === 'PENDING') {
            setShowSuccess(true);
        }
    }, [user, router]);

    const handleNext = () => {
        setStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setStep((prev) => Math.max(0, prev - 1));
    };

    const handleComplete = async () => {
        try {
            // Files and verification status were already submitted in StepIdentity
            // Just update local state to show PENDING and show success screen
            updateProfile({
                onboardingCompleted: true,
                verificationStatus: 'PENDING',
            });

            setShowSuccess(true);
        } catch (error) {
            console.error('Verification completion error:', error);
            toast.error('Failed to complete verification. Please try again.');
        }
    };

    const handleFinish = () => {
        router.push('/listings');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            {showSuccess ? (
                // Success Screen
                <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-10 text-center animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Verification Submitted!</h2>
                    <p className="text-gray-600 text-lg leading-relaxed mb-6">
                        Thank you for submitting your verification documents. Our team will review your information and approve your account within <strong>24-48 hours</strong>.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8 text-left">
                        <p className="text-sm font-semibold text-blue-900 mb-2">What happens next?</p>
                        <ul className="text-sm text-blue-800 space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">📧</span>
                                <span>You'll receive an email once your verification is approved</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">🔓</span>
                                <span>Once approved, you can list items and participate in barter trades</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">🛡️</span>
                                <span>Your information is securely encrypted and protected</span>
                            </li>
                        </ul>
                    </div>
                    <button
                        onClick={handleFinish}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Continue to BarterWave
                    </button>
                </div>
            ) : (
                // Onboarding Steps
                <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Progress Bar */}
                    <div className="h-2 bg-gray-100 w-full">
                        <div
                            className="h-full bg-blue-600 transition-all duration-500 ease-out"
                            style={{ width: `${(step / 4) * 100}%` }}
                        />
                    </div>

                    <div className="p-8">
                        {step === 0 && (
                            <div className="text-center space-y-6">
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-4xl">🛡️</span>
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900">Let's Get You Verified</h1>
                                <p className="text-lg text-gray-600 max-w-md mx-auto">
                                    To ensure a safe trading environment, we require all sellers and barter traders to verify their identity.
                                </p>
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left text-sm text-blue-800">
                                    <p className="font-semibold mb-2">Why is this required?</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Prevents fraud and scams</li>
                                        <li>Builds trust within the community</li>
                                        <li>Unlocks selling and barter features</li>
                                    </ul>
                                </div>
                                <button
                                    onClick={handleNext}
                                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    Start Verification
                                </button>
                                {user.verificationStatus === 'REJECTED' && showRejectionBanner && (
                                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-left relative">
                                        <button
                                            onClick={() => setShowRejectionBanner(false)}
                                            className="absolute top-2 right-2 text-red-400 hover:text-red-600 transition"
                                            title="Dismiss"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                        <p className="font-bold text-red-800 mb-1">⚠️ Verification Rejected</p>
                                        <p className="text-sm text-red-700">
                                            {user.rejectionReason || 'Your verification documents were rejected. Please try again with clearer photos.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 1 && <StepProfile onNext={handleNext} onBack={handleBack} />}
                        {step === 2 && <StepLocation onNext={handleNext} onBack={handleBack} />}
                        {step === 3 && <StepPhone onNext={handleNext} onBack={handleBack} />}
                        {step === 4 && <StepIdentity onComplete={handleComplete} onBack={handleBack} />}
                    </div>
                </div>
            )}

            {!showSuccess && (
                <p className="mt-6 text-gray-400 text-sm">
                    Step {step} of 4
                </p>
            )}
        </div>
    );
}
