'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'react-hot-toast';

interface StepProps {
    onNext: () => void;
}

export default function StepPhone({ onNext }: StepProps) {
    const { updateProfile } = useAuthStore();
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'INPUT' | 'VERIFY'>('INPUT');
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3333/api/auth/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: phone }),
            });

            if (!res.ok) throw new Error('Failed to send OTP');

            setStep('VERIFY');
            toast.success('OTP sent! Check your phone (or console for demo)');
        } catch (error) {
            console.error(error);
            toast.error('Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3333/api/auth/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: phone, code: otp }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Invalid OTP');
            }

            updateProfile({ phoneNumber: phone });
            toast.success('Phone verified successfully!');
            onNext();
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Verify Phone Number</h2>
                <p className="text-gray-500">We'll send you a code to verify it's really you.</p>
            </div>

            {step === 'INPUT' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 outline-none transition"
                            placeholder="+234 800 000 0000"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg flex justify-center"
                    >
                        {loading ? 'Sending...' : 'Send Code'}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP Code</label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 outline-none transition text-center text-2xl tracking-widest"
                            placeholder="000000"
                            maxLength={6}
                            required
                        />
                        <p className="text-xs text-center mt-2 text-gray-500">Check server console for code if no Twilio keys</p>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-lg flex justify-center"
                    >
                        {loading ? 'Verifying...' : 'Verify & Continue'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setStep('INPUT')}
                        className="w-full text-gray-500 text-sm hover:text-gray-700"
                    >
                        Change Phone Number
                    </button>
                </form>
            )}
        </div>
    );
}
