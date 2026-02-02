import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import { useToastStore } from '@/lib/toast-store';
import { useAuthStore } from '@/lib/auth-store';
import { useLocationStore } from '@/lib/location-store';
import { apiClient } from '@/lib/api-client';
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

export default function SearchFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { error: toastError } = useToastStore();
    const { user } = useAuthStore();
    const { detectedCountryCode, detectLocation, setDetectedCountry } = useLocationStore();

    // Flag to prevent re-applying country filter after initial load
    const hasAutoAppliedCountry = useRef(false);

    // State for filters
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [type, setType] = useState(searchParams.get('type') || '');
    const [condition, setCondition] = useState(searchParams.get('condition') || '');
    const [tradeType, setTradeType] = useState(searchParams.get('paymentMode') || '');
    const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
    const [countryId, setCountryId] = useState<string>(searchParams.get('countryId') || '');
    const [regionId, setRegionId] = useState<string>(searchParams.get('regionId') || '');
    const [isDistressSale, setIsDistressSale] = useState(searchParams.get('isDistressSale') === 'true');
    const [countries, setCountries] = useState<Country[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [loadingRegions, setLoadingRegions] = useState(false);

    // Initial detection and country fetch
    useEffect(() => {
        // Detect IP location if not logged in
        if (!user) {
            detectLocation();
        }

        apiClient.get<Country[]>('/countries')
            .then(res => {
                const fetchedCountries = res.data;
                setCountries(fetchedCountries);

                // If countryId is already in URL, skip auto-apply
                const urlCountryId = searchParams.get('countryId');
                if (urlCountryId) {
                    hasAutoAppliedCountry.current = true;
                    return;
                }

                // Determine default country and auto-apply
                let detectedId: string | null = null;

                if (user?.profile?.countryId) {
                    detectedId = user.profile.countryId.toString();
                } else if (detectedCountryCode) {
                    const matched = fetchedCountries.find(c => c.code === detectedCountryCode);
                    if (matched) {
                        detectedId = matched.id.toString();
                        setDetectedCountry(matched.code, matched.id);
                    }
                }

                // Auto-apply country filter to URL (only once)
                if (detectedId && !hasAutoAppliedCountry.current) {
                    hasAutoAppliedCountry.current = true;
                    setCountryId(detectedId);

                    // Push to URL to filter listings automatically - preserve current path
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('countryId', detectedId);
                    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                } else if (!detectedId && !hasAutoAppliedCountry.current) {
                    // Fallback to Nigeria (Primary Market) if detection fails
                    const nigeriaId = '1';
                    hasAutoAppliedCountry.current = true;
                    setCountryId(nigeriaId);
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('countryId', nigeriaId);
                    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                }

            })
            .catch(err => console.error('Failed to fetch countries:', err));
    }, [user, detectedCountryCode]); // re-run when detection finishes

    // Fetch regions when country changes
    useEffect(() => {
        if (countryId) {
            setLoadingRegions(true);
            apiClient.get<Region[]>(`/countries/${countryId}/regions`)
                .then(res => setRegions(res.data))
                .catch(err => {
                    console.error('Failed to fetch regions:', err);
                    setRegions([]);
                })
                .finally(() => setLoadingRegions(false));
        } else {
            setRegions([]);
            setRegionId('');
            setLoadingRegions(false);
        }
    }, [countryId]);

    // Update state when URL params change
    useEffect(() => {
        setSearchQuery(searchParams.get('search') || '');
        setType(searchParams.get('type') || '');
        setCondition(searchParams.get('condition') || '');
        setTradeType(searchParams.get('paymentMode') || '');
        setMinPrice(searchParams.get('minPrice') || '');
        setMaxPrice(searchParams.get('maxPrice') || '');
        setCountryId(searchParams.get('countryId') || '');
        setRegionId(searchParams.get('regionId') || '');
        setIsDistressSale(searchParams.get('isDistressSale') === 'true');
    }, [searchParams]);

    const applyFilters = () => {
        // Validate Price Range
        if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
            toastError('Minimum price cannot be greater than maximum price');
            return;
        }

        const params = new URLSearchParams();

        if (searchQuery) params.set('search', searchQuery);
        if (type) params.set('type', type);
        if (condition) params.set('condition', condition);
        if (tradeType) params.set('paymentMode', tradeType);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);
        if (countryId) params.set('countryId', countryId);
        if (regionId) params.set('regionId', regionId);
        if (isDistressSale) params.set('isDistressSale', 'true');

        router.push(`/listings?${params.toString()}`);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setType('');
        setCondition('');
        setTradeType('');
        setMinPrice('');
        setMaxPrice('');
        // Keep countryId, but reset regionId
        setRegionId('');
        setIsDistressSale(false);

        // Redirect but keep the countryId lock
        router.push(`/listings?countryId=${countryId}`);
    };


    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const regionOptions = useMemo(() => [
        { id: '', name: 'All States' },
        ...regions.map(r => ({ id: r.id, name: r.name }))
    ], [regions]);

    const activeCountry = useMemo(() => {
        return countries.find(c => c.id.toString() === countryId);
    }, [countries, countryId]);


    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Filters</h3>
                    <button
                        onClick={clearFilters}
                        className="text-sm text-blue-600 hover:text-blue-700"
                    >
                        Clear All
                    </button>
                </div>

                {/* Distress Sale / Urgent Deals Filter */}
                <div className="mb-5">
                    <button
                        onClick={() => setIsDistressSale(!isDistressSale)}
                        className={`w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${isDistressSale
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 border-orange-400 text-white shadow-lg'
                            : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
                            }`}
                    >
                        <span className="text-xl">🔥</span>
                        <div className="flex-1 text-left">
                            <div className="font-bold text-sm">Urgent Deals Only</div>
                            <div className={`text-xs ${isDistressSale ? 'text-orange-100' : 'text-orange-500'}`}>
                                Discounted items, quick sales
                            </div>
                        </div>
                        <div className={`w-11 h-6 rounded-full transition-all relative ${isDistressSale ? 'bg-white/30' : 'bg-orange-200'
                            }`}>
                            <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${isDistressSale ? 'right-1 bg-white' : 'left-1 bg-orange-400'
                                }`} />
                        </div>
                    </button>
                </div>

                {/* Listing Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="radio"
                                name="type"
                                value=""
                                checked={type === ''}
                                onChange={(e) => setType(e.target.value)}
                                className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">All</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="radio"
                                name="type"
                                value="PHYSICAL"
                                checked={type === 'PHYSICAL'}
                                onChange={(e) => setType(e.target.value)}
                                className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">Product</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="radio"
                                name="type"
                                value="SERVICE"
                                checked={type === 'SERVICE'}
                                onChange={(e) => setType(e.target.value)}
                                className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">Service</span>
                        </label>
                    </div>
                </div>

                {/* Condition - Only show if type is NOT Service */}
                {type !== 'SERVICE' && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="condition"
                                    value=""
                                    checked={condition === ''}
                                    onChange={(e) => setCondition(e.target.value)}
                                    className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                                />
                                <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">Any</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="condition"
                                    value="new"
                                    checked={condition === 'new'}
                                    onChange={(e) => setCondition(e.target.value)}
                                    className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                                />
                                <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">New</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="condition"
                                    value="used"
                                    checked={condition === 'used'}
                                    onChange={(e) => setCondition(e.target.value)}
                                    className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                                />
                                <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">Used</span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Trade Option */}
                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trade Option</label>
                    <select
                        value={tradeType}
                        onChange={(e) => setTradeType(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                    >
                        <option value="">Any</option>
                        <option value="cash">Cash Only</option>
                        <option value="barter">Barter Only</option>
                        <option value="cash_plus_barter">Cash + Barter</option>
                    </select>
                </div>

                {/* Country Display (Locked) */}
                {activeCountry && (
                    <div className="mt-4 mb-2">
                        <div className="flex items-center gap-3 px-3 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-sm">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Browsing in</p>
                                <p className="text-sm font-bold text-gray-900">{activeCountry.name}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* State/Region Filter */}
                <div className="mt-6">
                    <SearchableSelect
                        label="State/Region"
                        options={regionOptions}
                        value={regionId}
                        onChange={(val) => setRegionId(val.toString())}
                        placeholder={!countryId ? "Select a country first" : "All States"}
                        disabled={!countryId}
                        loading={loadingRegions}
                    />
                    {!countryId && (
                        <p className="text-[11px] text-gray-400 mt-1.5 ml-1 italic font-medium">Select a country to explore its regions</p>
                    )}
                </div>

                {/* Price Range */}
                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="number"
                                placeholder="Min"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                className="w-full p-2.5 pl-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder:text-gray-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                            />
                        </div>
                        <div className="relative flex-1">
                            <input
                                type="number"
                                placeholder="Max"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                className="w-full p-2.5 pl-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder:text-gray-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={applyFilters}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]"
            >
                Apply Filters
            </button>
        </div>
    );
}
