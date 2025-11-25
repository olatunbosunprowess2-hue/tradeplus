'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import StepProfile from '@/components/onboarding/StepProfile';
import StepLocation from '@/components/onboarding/StepLocation';
import StepPhone from '@/components/onboarding/StepPhone';
import StepIdentity from '@/components/onboarding/StepIdentity';
import { toast } from 'react-hot-toast';

export default function OnboardingPage() {
    const router = useRouter();
    const { user, updateProfile } = useAuthStore();
    const [step, setStep] = useState(0); // 0: Intro, 1: Profile, 2: Location, 3: Phone, 4: Identity

    useEffect(() => {
        if (!user) {
            router.push('/login');
        } else if (user.isVerified) {
            router.push('/listings');
        }
    }, [user, router]);

    const handleNext = () => {
        setStep((prev) => prev + 1);
    };

    const handleComplete = async () => {
        try {
            // In a real app, we would submit all data to the backend here
            // For now, we just update the local store to simulate "Pending" status
            updateProfile({
                onboardingCompleted: true,
                verificationStatus: 'PENDING',
            });
            toast.success('Verification submitted! An admin will review your details.');
            router.push('/listings');
        } catch (error) {
            toast.error('Failed to submit verification.');
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
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
                        </div>
                    )}

                    {step === 1 && <StepProfile onNext={handleNext} />}
                    {step === 2 && <StepLocation onNext={handleNext} />}
                    {step === 3 && <StepPhone onNext={handleNext} />}
                    {step === 4 && <StepIdentity onComplete={handleComplete} />}
                </div>
            </div>

            <p className="mt-6 text-gray-400 text-sm">
                Step {step} of 4
            </p>
        </div>
    );
}
