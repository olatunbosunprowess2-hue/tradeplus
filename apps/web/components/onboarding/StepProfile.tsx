'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';

interface StepProps {
    onNext: () => void;
}

export default function StepProfile({ onNext }: StepProps) {
    const { user, updateProfile } = useAuthStore();
    const [displayName, setDisplayName] = useState(user?.profile?.displayName || user?.name || '');
    const [bio, setBio] = useState(user?.profile?.bio || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfile({
            profile: {
                ...user?.profile,
                displayName,
                bio,
            }
        });
        onNext();
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Complete Your Profile</h2>
                <p className="text-gray-500">Tell the community a bit about yourself.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 outline-none transition"
                        placeholder="e.g. Alex Trader"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 outline-none transition h-32 resize-none"
                        placeholder="What do you like to trade? e.g. Tech enthusiast looking for vintage audio gear."
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg mt-4"
                >
                    Continue
                </button>
            </form>
        </div>
    );
}
