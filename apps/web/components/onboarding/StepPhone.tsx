'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'react-hot-toast';

interface StepProps {
    onNext: () => void;
}

export default function StepPhone({ onNext }: StepProps) {
    const { user, updateProfile } = useAuthStore();
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber) {
            toast.error('Please enter your phone number');
            return;
        }

        setLoading(true);

        // Just save the phone number and proceed, no verification needed yet as per requirements
        updateProfile({ phoneNumber });

        // Simulate a brief loading state for better UX
        setTimeout(() => {
            setLoading(false);
            onNext();
        }, 500);
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Add Phone Number</h2>
                <p className="text-gray-500">Please provide a phone number where we can reach you.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-lg">
                            +
                        </div>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                if (value.length <= 13) {
                                    setPhoneNumber(value);
                                }
                            }}
                            className="w-full pl-10 pr-4 py-4 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 outline-none transition text-gray-900 font-medium text-lg tracking-wide"
                            placeholder="234 800 123 4567"
                            required
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        <span className="text-blue-600 font-medium">Note:</span> Your phone number will be verified manually by our team.
                    </p>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-3"
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            Continue
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </>
                    )}
                </button>
            </form >
        </div >
    );
}
