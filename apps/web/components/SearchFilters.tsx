'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useToastStore } from '@/lib/toast-store';

export default function SearchFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { error: toastError } = useToastStore();

    // State for filters
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [type, setType] = useState(searchParams.get('type') || '');
    const [condition, setCondition] = useState(searchParams.get('condition') || '');
    const [tradeType, setTradeType] = useState(searchParams.get('paymentMode') || '');
    const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
    const [location, setLocation] = useState(searchParams.get('location') || '');
    const [isDistressSale, setIsDistressSale] = useState(searchParams.get('isDistressSale') === 'true');

    // Update state when URL params change
    useEffect(() => {
        setSearchQuery(searchParams.get('search') || '');
        setType(searchParams.get('type') || '');
        setCondition(searchParams.get('condition') || '');
        setTradeType(searchParams.get('paymentMode') || '');
        setMinPrice(searchParams.get('minPrice') || '');
        setMaxPrice(searchParams.get('maxPrice') || '');
        setLocation(searchParams.get('location') || '');
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
        if (location) params.set('location', location);
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
        setLocation('');
        setIsDistressSale(false);

        router.push('/listings');
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

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
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="type"
                                value=""
                                checked={type === ''}
                                onChange={(e) => setType(e.target.value)}
                                className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600">All</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="type"
                                value="PHYSICAL"
                                checked={type === 'PHYSICAL'}
                                onChange={(e) => setType(e.target.value)}
                                className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600">Product</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="type"
                                value="SERVICE"
                                checked={type === 'SERVICE'}
                                onChange={(e) => setType(e.target.value)}
                                className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600">Service</span>
                        </label>
                    </div>
                </div>

                {/* Condition - Only show if type is NOT Service */}
                {type !== 'SERVICE' && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="condition"
                                    value=""
                                    checked={condition === ''}
                                    onChange={(e) => setCondition(e.target.value)}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">Any</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="condition"
                                    value="new"
                                    checked={condition === 'new'}
                                    onChange={(e) => setCondition(e.target.value)}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">New</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="condition"
                                    value="used"
                                    checked={condition === 'used'}
                                    onChange={(e) => setCondition(e.target.value)}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">Used</span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Trade Option */}
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trade Option</label>
                    <select
                        value={tradeType}
                        onChange={(e) => setTradeType(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Any</option>
                        <option value="cash">Cash Only</option>
                        <option value="barter">Barter Only</option>
                        <option value="cash_plus_barter">Cash + Barter</option>
                    </select>
                </div>

                {/* Location Filter */}
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">All Countries</option>
                        <option value="Nigeria">Nigeria</option>
                        <option value="Ghana">Ghana</option>
                        <option value="Kenya">Kenya</option>
                        <option value="South Africa">South Africa</option>
                        <option value="Egypt">Egypt</option>
                        <option value="Tanzania">Tanzania</option>
                        <option value="Ethiopia">Ethiopia</option>
                        <option value="Rwanda">Rwanda</option>
                        <option value="Uganda">Uganda</option>
                        <option value="Cameroon">Cameroon</option>
                        <option value="Ivory Coast">Ivory Coast</option>
                        <option value="Senegal">Senegal</option>
                        <option value="Morocco">Morocco</option>
                        <option value="Algeria">Algeria</option>
                        <option value="Tunisia">Tunisia</option>
                        <option value="Botswana">Botswana</option>
                        <option value="Zambia">Zambia</option>
                        <option value="Zimbabwe">Zimbabwe</option>
                    </select>
                </div>

                {/* Price Range */}
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            placeholder="Min"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                            type="number"
                            placeholder="Max"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={applyFilters}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
                Apply Filters
            </button>
        </div>
    );
}
