'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'react-hot-toast';
import { sanitizeUrl } from '@/lib/utils';

interface StepProps {
    onNext: () => void;
    onBack?: () => void;
}

export default function StepProfile({ onNext, onBack }: StepProps) {
    const { user, updateProfile } = useAuthStore();
    const [avatar, setAvatar] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(sanitizeUrl(user?.profile?.avatarUrl) || null);
    const [firstName, setFirstName] = useState(() => {
        const name = user?.firstName || '';
        return (name.toLowerCase() === 'john' || name.toLowerCase() === 'doe') ? '' : name;
    });
    const [lastName, setLastName] = useState(() => {
        const name = user?.lastName || '';
        return (name.toLowerCase() === 'john' || name.toLowerCase() === 'doe') ? '' : name;
    });
    const [bio, setBio] = useState(''); // Always start empty, use placeholder instead
    const [loading, setLoading] = useState(false);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatar(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('firstName', firstName);
            formData.append('lastName', lastName);
            formData.append('bio', bio);

            if (avatar) {
                formData.append('avatar', avatar);
            }

            await updateProfile(formData);
            toast.success('Profile updated successfully!');
            onNext();
        } catch (error) {
            console.error('Profile update failed:', error);
            toast.error('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Complete Your Profile</h2>
                <p className="text-gray-500">Tell the community a bit about yourself.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 group">
                        {avatarPreview ? (
                            <img src={avatarPreview.startsWith('blob:') ? avatarPreview : sanitizeUrl(avatarPreview)} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        )}
                    </div>
                    <label className="cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition border border-blue-200">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                        </span>
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 outline-none transition text-gray-900 font-medium"
                            placeholder="e.g. Alex"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 outline-none transition text-gray-900 font-medium"
                            placeholder="e.g. Trader"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <div className="relative">
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            maxLength={120}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 outline-none transition h-32 resize-none text-gray-900 font-medium"
                            placeholder="What do you like to trade? e.g. Tech enthusiast looking for vintage audio gear."
                            required
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white/80 px-1 rounded">
                            {bio.length}/120
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-4">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`${onBack ? 'flex-1' : 'w-full'} bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            'Continue'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
