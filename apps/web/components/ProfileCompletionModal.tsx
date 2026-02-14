'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { User, X, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export default function ProfileCompletionModal() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // 1. Check if user is logged in
        if (!isAuthenticated || !user) return;

        // 2. Check exclusion conditions
        // Don't show if suspended or banned
        if (user.status === 'suspended' || user.status === 'banned') return;

        // 3. Check if profile is incomplete
        // We consider it incomplete if: no avatar, no bio, no phone, or no address
        const isProfileIncomplete =
            !user.profile?.avatarUrl ||
            !user.profile?.bio ||
            !user.phoneNumber ||
            !user.locationAddress;

        if (!isProfileIncomplete) return;

        // 4. Check frequency cap (LocalStorage)
        const lastDismissed = localStorage.getItem('profile_prompt_dismissed_at');
        if (lastDismissed) {
            const daysSinceDismissal = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
            // Show again after 3 days
            if (daysSinceDismissal < 3) return;
        }

        // 5. Show modal immediately
        setIsOpen(true);
    }, [isAuthenticated, user]);

    const handleDismiss = () => {
        setIsOpen(false);
        localStorage.setItem('profile_prompt_dismissed_at', Date.now().toString());
    };

    const handleCompleteNow = () => {
        setIsOpen(false);
        router.push('/settings');
    };

    if (!isOpen) return null;

    // Calculate completion percentage for UI
    const totalSteps = 4;
    let completedSteps = 0;
    if (user?.profile?.avatarUrl) completedSteps++;
    if (user?.profile?.bio) completedSteps++;
    if (user?.phoneNumber) completedSteps++;
    if (user?.locationAddress) completedSteps++;
    const progress = Math.round((completedSteps / totalSteps) * 100);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">

                {/* Header Image / Pattern */}
                <div className="h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                        </svg>
                    </div>

                    {/* Floating Avatar Preview */}
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                        <div className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 bg-gray-200 flex items-center justify-center shadow-md relative">
                            {user?.profile?.avatarUrl ? (
                                <Image
                                    src={user.profile.avatarUrl}
                                    alt="Profile"
                                    fill
                                    className="rounded-full object-cover"
                                />
                            ) : (
                                <User className="w-8 h-8 text-gray-400" />
                            )}
                            <div className="absolute bottom-0 right-0 w-6 h-6 bg-amber-400 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px] font-bold text-white">
                                !
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="pt-12 pb-8 px-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Complete Your Profile</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                        You&apos;re almost there! Complete your profile to build trust, attract more buyers, and unlock all features of BarterWave.
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
                            <span>Profile Strength</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Checklist */}
                    <div className="space-y-3 mb-8 text-left">
                        <div className="flex items-center gap-3 text-sm">
                            {user?.profile?.avatarUrl ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />}
                            <span className={user?.profile?.avatarUrl ? 'text-gray-900 dark:text-gray-100 line-through opacity-50' : 'text-gray-700 dark:text-gray-300'}>Upload profile photo</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            {user?.profile?.bio ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />}
                            <span className={user?.profile?.bio ? 'text-gray-900 dark:text-gray-100 line-through opacity-50' : 'text-gray-700 dark:text-gray-300'}>Add a bio</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            {user?.locationAddress ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />}
                            <span className={user?.locationAddress ? 'text-gray-900 dark:text-gray-100 line-through opacity-50' : 'text-gray-700 dark:text-gray-300'}>Set your location</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleCompleteNow}
                            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                        >
                            Complete Profile Now
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                            Skip for later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
