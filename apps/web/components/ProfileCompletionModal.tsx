'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { User, X, CheckCircle2, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { sanitizeUrl } from '@/lib/utils';

export default function ProfileCompletionModal() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // 1. Check if user is logged in
        if (!isAuthenticated || !user) return;

        // 2. Check exclusion conditions
        if (user.status === 'suspended' || user.status === 'banned') return;

        // 3. Check if profile is incomplete
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative">

                {/* Close Button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors z-10"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="p-6">
                    {/* Compact Header */}
                    <div className="flex items-center gap-4 mb-5">
                        <div className="relative w-14 h-14 shrink-0">
                            {user?.profile?.avatarUrl ? (
                                <Image
                                    src={sanitizeUrl(user.profile.avatarUrl)}
                                    alt="Profile"
                                    fill
                                    className="rounded-full object-cover border-2 border-gray-100"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center">
                                    <User className="w-6 h-6 text-blue-500" />
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                !
                            </div>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">Complete Profile</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Unlock all features</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-xs font-medium text-gray-600 mb-1.5">
                            <span>Profile Strength</span>
                            <span className="text-blue-600 font-bold">{progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all duration-1000 ease-out rounded-full"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Compact Checklist */}
                    <div className="space-y-2.5 mb-6">
                        <CheckItem isCompleted={!!user?.profile?.avatarUrl} label="Upload profile photo" />
                        <CheckItem isCompleted={!!user?.profile?.bio} label="Add a short bio" />
                        <CheckItem isCompleted={!!user?.locationAddress} label="Set your location" />
                        <CheckItem isCompleted={!!user?.phoneNumber} label="Verify phone number" />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2.5">
                        <button
                            onClick={handleCompleteNow}
                            className="w-full py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            Complete Now <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="text-xs text-gray-400 hover:text-gray-600 font-medium py-1 transition-colors"
                        >
                            Skip for now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CheckItem({ isCompleted, label }: { isCompleted: boolean; label: string }) {
    return (
        <div className={`flex items-center gap-3 text-sm p-2 rounded-lg transition-colors ${isCompleted ? 'bg-green-50/50' : 'bg-gray-50'}`}>
            {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
            )}
            <span className={`flex-1 ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>
                {label}
            </span>
        </div>
    );
}
