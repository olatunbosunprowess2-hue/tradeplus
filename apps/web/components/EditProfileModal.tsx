'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { getRegions } from '@/lib/api-client';
import SearchableSelect from './SearchableSelect';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
    const { user, updateProfile } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [displayName, setDisplayName] = useState(user?.profile?.displayName || '');
    const [bio, setBio] = useState(user?.profile?.bio || '');
    const [city, setCity] = useState('');
    const [selectedRegionId, setSelectedRegionId] = useState<number | undefined>(user?.profile?.regionId);

    // State dropdown data
    const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
    const [loadingRegions, setLoadingRegions] = useState(false);
    const [manualState, setManualState] = useState('');
    const [isManualState, setIsManualState] = useState(false);

    // Avatar state
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.profile?.avatarUrl || null);

    // Extract city from user object or locationAddress on mount
    useEffect(() => {
        if (user?.city) {
            setCity(user.city);
        } else if (user?.locationAddress) {
            const parts = user.locationAddress.split(',').map(p => p.trim());
            setCity(parts[0] || '');
            // If the user already has a state that isn't in regions (or before they load), set it as manual
            if (parts[1]) setManualState(parts[1]);
        }
    }, [user?.city, user?.locationAddress]);

    // Fetch regions for the user's country
    useEffect(() => {
        // Fallback to root countryId if missing from profile
        const countryId = user?.profile?.countryId || user?.countryId;

        if (countryId && isOpen) {
            setLoadingRegions(true);
            getRegions(Number(countryId))
                .then(res => {
                    const fetchedRegions = res.data || [];
                    setRegions(fetchedRegions);

                    // If no regions found, or current regionId is missing, allow manual
                    if (fetchedRegions.length === 0) {
                        setIsManualState(true);
                    } else {
                        // Check if current region is in fetched regions
                        const hasCurrentRegion = fetchedRegions.some(r => r.id === selectedRegionId);
                        if (!hasCurrentRegion && selectedRegionId) {
                            setIsManualState(true);
                        }
                    }
                })
                .catch(err => {
                    console.error('Failed to fetch regions:', err);
                    setRegions([]);
                    setIsManualState(true);
                })
                .finally(() => setLoadingRegions(false));
        } else if (isOpen) {
            setRegions([]);
        }
    }, [user?.profile?.countryId, user?.countryId, isOpen]);

    if (!isOpen || !user) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const selectedRegion = regions.find(r => r.id === selectedRegionId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Build location address as "City, State"
            const stateName = isManualState ? manualState : (selectedRegion?.name || '');
            const locationAddress = city + (stateName ? `, ${stateName}` : '');

            if (avatarFile) {
                // Use FormData for file upload
                const formData = new FormData();
                formData.append('avatar', avatarFile);
                formData.append('displayName', displayName);
                formData.append('bio', bio);
                formData.append('locationAddress', locationAddress);
                if (!isManualState && selectedRegionId) {
                    formData.append('regionId', selectedRegionId.toString());
                }

                await updateProfile(formData);
            } else {
                // Flatten payload to match backend DTO
                await updateProfile({
                    displayName,
                    bio,
                    locationAddress,
                    regionId: isManualState ? null : selectedRegionId,
                } as any);
            }
            onClose();
        } catch (error) {
            console.error('Failed to update profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10005] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md transition-all duration-300">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 text-left flex flex-col max-h-[92vh] sm:max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition rounded-full hover:bg-gray-100">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="p-6 space-y-6 overflow-y-auto flex-1 overscroll-contain">
                        {/* Profile Picture Section */}
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-md shrink-0">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                                        {displayName[0]?.toUpperCase() || user.email[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-gray-900 mb-1">
                                    Profile Picture
                                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded-full">Recommended</span>
                                </label>
                                <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                                    Adding a professional logo or photo significantly increases trust and engagement.
                                </p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition"
                                />
                            </div>
                        </div>

                        {/* Read-Only Security Fields */}
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <label className="block text-[10px] text-blue-800 font-bold uppercase tracking-wider">Email Address</label>
                                    <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{user.email}</div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <label className="block text-[10px] text-blue-800 font-bold uppercase tracking-wider">Account Status</label>
                                    <div className="flex items-center gap-1.5 justify-end">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <div className="text-sm font-semibold text-green-600">Active</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Editable Fields */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1.5">Business / Profile Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-gray-900 placeholder:text-gray-300"
                                placeholder="e.g. Acme Trading Co. or John Doe"
                            />
                            <p className="mt-2 text-[11px] text-gray-500 flex items-start gap-1.5 leading-tight">
                                <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Using your business name or a professional name helps build trust with buyers.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1.5">Bio / About Business</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none text-gray-900 placeholder:text-gray-300"
                                placeholder="Tell others about your services or what you trade..."
                            />
                        </div>

                        {/* Location Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">City / Area</label>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-300"
                                    placeholder="e.g. Ona Ara"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-sm font-bold text-gray-900">State / Region</label>
                                    {regions.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setIsManualState(!isManualState)}
                                            className="text-[10px] text-blue-600 font-bold hover:underline py-1 px-2 rounded-lg hover:bg-blue-50 transition"
                                        >
                                            {isManualState ? 'Use Select' : 'Enter Manually'}
                                        </button>
                                    )}
                                </div>
                                {isManualState ? (
                                    <input
                                        type="text"
                                        value={manualState}
                                        onChange={(e) => setManualState(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-300"
                                        placeholder="Enter state"
                                    />
                                ) : (
                                    <SearchableSelect
                                        options={regions}
                                        value={selectedRegionId}
                                        onChange={(val) => setSelectedRegionId(Number(val))}
                                        placeholder="Select state"
                                        loading={loadingRegions}
                                        emptyMessage="No states available"
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0 bg-white/80 backdrop-blur-md pb-[max(1rem,env(safe-area-inset-bottom))]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 active:scale-95"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
