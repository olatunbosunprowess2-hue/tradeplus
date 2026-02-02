import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { useLocationStore } from '@/lib/location-store';
import SearchableSelect from './SearchableSelect';


interface Country {
    id: number;
    name: string;
    code: string;
}

interface Region {
    id: number;
    name: string;
    countryId: number;
}

interface BusinessAddressModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

export default function BusinessAddressModal({ isOpen, onClose, onComplete }: BusinessAddressModalProps) {
    const { user, updateProfile, refreshProfile } = useAuthStore();
    const { detectedCountryCode, detectLocation } = useLocationStore();

    const [loading, setLoading] = useState(false);
    const [countries, setCountries] = useState<Country[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [loadingRegions, setLoadingRegions] = useState(false);
    const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
    const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);

    // Detect location and fetch countries on mount
    useEffect(() => {
        if (isOpen) {
            detectLocation();

            apiClient.get<Country[]>('/countries')
                .then(res => {
                    const fetchedCountries = res.data;
                    setCountries(fetchedCountries);

                    // Auto-select country based on priority:
                    // 1. Logged in user profile
                    // 2. IP detection
                    // 3. Fallback to Nigeria (ID 1)
                    let targetCountryId: number | null = null;

                    if (user?.profile?.countryId) {
                        targetCountryId = user.profile.countryId;
                    } else if (detectedCountryCode) {
                        const matched = fetchedCountries.find(c => c.code === detectedCountryCode);
                        if (matched) targetCountryId = matched.id;
                    }

                    // Final fallback
                    if (!targetCountryId) targetCountryId = 1; // Nigeria

                    setSelectedCountryId(targetCountryId);
                })
                .catch(err => console.error('Failed to fetch countries:', err));
        }
    }, [isOpen, user, detectedCountryCode]);


    // Fetch regions when country changes
    useEffect(() => {
        if (selectedCountryId) {
            setLoadingRegions(true);
            apiClient.get<Region[]>(`/countries/${selectedCountryId}/regions`)
                .then(res => setRegions(res.data))
                .catch(err => {
                    console.error('Failed to fetch regions:', err);
                    setRegions([]);
                })
                .finally(() => setLoadingRegions(false));
            setSelectedRegionId(null);
        } else {
            setRegions([]);
            setLoadingRegions(false);
        }
    }, [selectedCountryId]);

    const handleSave = async () => {
        if (!selectedCountryId) {
            toast.error('Please select a country');
            return;
        }

        setLoading(true);
        try {
            await updateProfile({
                countryId: selectedCountryId,
                ...(selectedRegionId && { regionId: selectedRegionId }),
            } as any);
            await refreshProfile();
            toast.success('Business location saved!');
            onComplete();
        } catch (error) {
            console.error('Failed to save location:', error);
            toast.error('Failed to save location');
        } finally {
            setLoading(false);
        }
    };

    const countryOptions = useMemo(() =>
        countries.map(c => ({ id: c.id, name: c.name })),
        [countries]);

    const regionOptions = useMemo(() =>
        regions.map(r => ({ id: r.id, name: r.name })),
        [regions]);

    const activeCountry = useMemo(() =>
        countries.find(c => c.id === selectedCountryId),
        [countries, selectedCountryId]);


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all scale-100 animate-in zoom-in-95 duration-300 relative">
                {/* Close Button Pin */}
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Set Your Business Location</h2>
                    <p className="text-gray-500 mt-3 text-sm leading-relaxed px-4">
                        Your location helps buyers find your listings and enables accurate local discovery.
                    </p>
                </div>

                {/* Form */}
                <div className="space-y-6">
                    {/* Country Display (Locked) */}
                    {activeCountry && (
                        <div className="mb-4">
                            <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-2xl">
                                <span className="text-2xl">📍</span>
                                <div>
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Your Business Country</p>
                                    <p className="text-lg font-bold text-gray-900 leading-none">{activeCountry.name}</p>
                                </div>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-2 ml-1 italic font-medium">Automatic location detection enabled</p>
                        </div>
                    )}


                    {/* Region/State Selection */}
                    <div className={`transition-all duration-300 ${selectedCountryId ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                        <SearchableSelect
                            label="State/Region (Optional)"
                            options={regionOptions}
                            value={selectedRegionId || ''}
                            onChange={(val) => setSelectedRegionId(Number(val))}
                            placeholder={loadingRegions ? "Fetching available states..." : "Select a state/region"}
                            disabled={loadingRegions || regions.length === 0}
                            loading={loadingRegions}
                            emptyMessage="No specific states found for this country"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 mt-10">
                    <button
                        onClick={handleSave}
                        disabled={loading || !selectedCountryId}
                        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            'Save & Continue'
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3 px-6 rounded-2xl border border-gray-100 text-gray-400 font-medium hover:text-gray-600 hover:bg-gray-50 transition-all text-sm"
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        </div>
    );
}
