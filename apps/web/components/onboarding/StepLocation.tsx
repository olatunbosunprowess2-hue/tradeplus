
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';
import { State, IState } from 'country-state-city';

interface StepProps {
    onNext: () => void;
    onBack?: () => void;
}

interface Country {
    id: number;
    name: string;
    code: string;
}

export default function StepLocation({ onNext, onBack }: StepProps) {
    const { updateProfile } = useAuthStore();
    const [loading, setLoading] = useState(false);

    // Form State
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [address, setAddress] = useState('');
    const [country, setCountry] = useState<Country | null>(null);
    const [countries, setCountries] = useState<Country[]>([]);
    const [availableStates, setAvailableStates] = useState<IState[]>([]);

    // Coordinates (hidden but useful for distance calculations later)
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        // Fetch supported countries
        apiClient.get<Country[]>('/countries')
            .then(res => setCountries(res.data))
            .catch(err => console.error('Failed to fetch countries:', err));

        // Attempt to auto-detect country via IP/Browser locale or just default
        // For now, we'll try to guess based on timezone or just let user pick if not detected?
        // Actually request asked to "automatically picking up the users country".
        // We can try a lightweight IP check or just default to generic if we can't.
        // Let's rely on the user's browser location API *silently* if possible, or just default to Nigeria/User's region if we know it.
        // Or we can use a free IP-API.

        if (countries.length > 0) {
            detectCountry();
        }
    }, [countries]);

    const detectCountry = async () => {
        try {
            // Check localStorage cache first to avoid rate limits
            const cached = localStorage.getItem('barterwave_location_cache');
            let data;

            if (cached) {
                const { timestamp, locationData } = JSON.parse(cached);
                // Cache valid for 24 hours
                if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                    data = locationData;
                }
            }

            // If no valid cache, fetch from API
            if (!data) {
                const response = await fetch('https://ipapi.co/json/');
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                data = await response.json();

                // Cache the result
                if (data && data.country_code) {
                    localStorage.setItem('barterwave_location_cache', JSON.stringify({
                        timestamp: Date.now(),
                        locationData: data
                    }));
                }
            }

            if (data && data.country_code) {
                const detected = countries.find(c => c.code === data.country_code);
                if (detected) {
                    setCountry(detected);
                    if (!city && data.city) setCity(data.city);
                    if (!state && data.region) setState(data.region);
                }
            }
        } catch (e) {
            console.warn('Auto-detect country failed, using default:', e);
            // Fallback to Nigeria if available
            const ng = countries.find(c => c.code === 'NG');
            if (ng && !country) setCountry(ng);
        }
    };

    // If we have countries loaded, let's try to match a default?
    useEffect(() => {
        if (countries.length > 0 && !country) {
            // Default to Nigeria for now as per project context if available, or just waiting for selection
            const ng = countries.find(c => c.code === 'NG');
            if (ng) setCountry(ng);
        }
    }, [countries, country]);

    // When country changes, load states
    useEffect(() => {
        if (country) {
            const states = State.getStatesOfCountry(country.code);
            setAvailableStates(states);
        } else {
            setAvailableStates([]);
        }
    }, [country]);


    const handleUseGPS = () => {
        setLoading(true);
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setCoords({ lat: latitude, lng: longitude });

                try {
                    // Reverse geocoding
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
                    const data = await response.json();
                    const addr = data.address || {};

                    // Auto-fill fields
                    if (addr.city || addr.town || addr.village) setCity(addr.city || addr.town || addr.village);
                    if (addr.state || addr.region) setState(addr.state || addr.region);

                    // Address string construction
                    const houseNumber = addr.house_number || '';
                    const road = addr.road || '';
                    const constructedAddr = `${houseNumber} ${road}`.trim();
                    if (constructedAddr) setAddress(constructedAddr); // Or use display_name

                    // Match country
                    const countryCode = addr.country_code?.toUpperCase();
                    if (countryCode) {
                        const matched = countries.find(c => c.code === countryCode);
                        if (matched) setCountry(matched);
                    }

                    toast.success('Location details auto-filled!');
                } catch (error) {
                    console.error('Geocoding error:', error);
                    toast.error('Could not auto-fill address, please enter manually.');
                } finally {
                    setLoading(false);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                toast.error('Unable to retrieve location.');
                setLoading(false);
            }
        );
    };

    const handleSubmit = async () => {
        if (!city || !state || !address || !country) {
            toast.error('Please fill in all location fields');
            return;
        }

        setLoading(true);
        try {
            await updateProfile({
                city,
                state,
                locationAddress: address,
                countryId: country.id,
                // If we have coords from GPS use them, otherwise maybe 0,0 or null?
                // Backend expects numbers if provided.
                ...(coords ? { locationLat: coords.lat, locationLng: coords.lng } : {})
            });
            onNext();
        } catch (error) {
            console.error('Update failed:', error);
            toast.error('Failed to save location details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Where are you based?</h2>
                <p className="text-gray-500">This helps us show you relevant listings.</p>
            </div>

            <div className="space-y-4">
                {/* Country (Auto-detected / Select) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <select
                        value={country?.id || ''}
                        onChange={(e) => {
                            const c = countries.find(x => x.id === Number(e.target.value));
                            if (c) setCountry(c);
                        }}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                    // Enabled now so user can change country and see different states
                    >
                        {countries.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    {!country && countries.length > 0 && (
                        <p className="text-xs text-orange-500 mt-1">Detecting country...</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="e.g. Lagos"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        {availableStates.length > 0 ? (
                            <select
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                            >
                                <option value="">Select State</option>
                                {availableStates.map((s) => (
                                    <option key={s.isoCode} value={s.name}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                placeholder="e.g. Lagos State"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address (Home or Business)</label>
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. 123 Admiralty Way, Lekki"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                </div>

                <div className="relative flex items-center gap-2 py-2">
                    <div className="h-px bg-gray-200 flex-1"></div>
                    <span className="text-xs text-gray-400 font-medium uppercase">Or auto-fill</span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                </div>

                <button
                    onClick={handleUseGPS}
                    type="button"
                    className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition flex items-center justify-center gap-2 text-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Use GPS to Auto-fill
                </button>
            </div>

            <div className="flex gap-3 mt-8">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition"
                    >
                        Back
                    </button>
                )}
                <button
                    onClick={handleSubmit}
                    disabled={!city || !state || !address || !country || loading}
                    className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all shadow-md ${(!city || !state || !address || !country || loading)
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl'
                        }`}
                >
                    {loading ? 'Saving...' : 'Continue'}
                </button>
            </div>
        </div>
    );
}
