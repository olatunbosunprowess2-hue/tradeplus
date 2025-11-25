'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useToastStore } from '@/lib/toast-store';

export default function SearchFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { error: toastError } = useToastStore();

    // State for filters
    const [type, setType] = useState(searchParams.get('type') || '');
    const [condition, setCondition] = useState(searchParams.get('condition') || '');
    const [tradeType, setTradeType] = useState(searchParams.get('paymentMode') || '');
    const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
    const [location, setLocation] = useState(searchParams.get('location') || '');

    // Update state when URL params change
    useEffect(() => {
        setType(searchParams.get('type') || '');
        setCondition(searchParams.get('condition') || '');
        setTradeType(searchParams.get('paymentMode') || '');
        setMinPrice(searchParams.get('minPrice') || '');
        setMaxPrice(searchParams.get('maxPrice') || '');
        setLocation(searchParams.get('location') || '');
    }, [searchParams]);

    const applyFilters = () => {
        // Validate Price Range
        if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
            toastError('Minimum price cannot be greater than maximum price');
            return;
        }

        const params = new URLSearchParams(searchParams.toString());

        if (type) params.set('type', type);
        else params.delete('type');

        if (condition) params.set('condition', condition);
        else params.delete('condition');

        if (tradeType) params.set('paymentMode', tradeType);
        else params.delete('paymentMode');

        if (minPrice) params.set('minPrice', minPrice);
        else params.delete('minPrice');

        if (maxPrice) params.set('maxPrice', maxPrice);
        else params.delete('maxPrice');

        if (location) params.set('location', location);
        else params.delete('location');

        // Reset to page 1 on filter change
        params.delete('page');

        router.push(`/listings?${params.toString()}`);
    };

    const clearFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('type');
        params.delete('condition');
        params.delete('paymentMode');
        params.delete('minPrice');
        params.delete('maxPrice');
        params.delete('location');
        params.delete('page');

        // Keep search query if exists
        const search = searchParams.get('search');
        if (search) params.set('search', search);

        router.push(`/listings?${params.toString()}`);
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700"
                >
                    Clear All
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
                <div>
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
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trade Option</label>
                <select
                    value={tradeType}
                    onChange={(e) => setTradeType(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="">Any</option>
                    <option value="cash">Cash Only</option>
                    <option value="barter">Barter Only</option>
                    <option value="cash_plus_barter">Cash + Barter</option>
                </select>
            </div>

            {/* Location Filter */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location (State)</label>
                <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="">All States</option>
                    <option value="Abia">Abia</option>
                    <option value="Adamawa">Adamawa</option>
                    <option value="Akwa Ibom">Akwa Ibom</option>
                    <option value="Anambra">Anambra</option>
                    <option value="Bauchi">Bauchi</option>
                    <option value="Bayelsa">Bayelsa</option>
                    <option value="Benue">Benue</option>
                    <option value="Borno">Borno</option>
                    <option value="Cross River">Cross River</option>
                    <option value="Delta">Delta</option>
                    <option value="Ebonyi">Ebonyi</option>
                    <option value="Edo">Edo</option>
                    <option value="Ekiti">Ekiti</option>
                    <option value="Enugu">Enugu</option>
                    <option value="FCT">FCT - Abuja</option>
                    <option value="Gombe">Gombe</option>
                    <option value="Imo">Imo</option>
                    <option value="Jigawa">Jigawa</option>
                    <option value="Kaduna">Kaduna</option>
                    <option value="Kano">Kano</option>
                    <option value="Katsina">Katsina</option>
                    <option value="Kebbi">Kebbi</option>
                    <option value="Kogi">Kogi</option>
                    <option value="Kwara">Kwara</option>
                    <option value="Lagos">Lagos</option>
                    <option value="Nasarawa">Nasarawa</option>
                    <option value="Niger">Niger</option>
                    <option value="Ogun">Ogun</option>
                    <option value="Ondo">Ondo</option>
                    <option value="Osun">Osun</option>
                    <option value="Oyo">Oyo</option>
                    <option value="Plateau">Plateau</option>
                    <option value="Rivers">Rivers</option>
                    <option value="Sokoto">Sokoto</option>
                    <option value="Taraba">Taraba</option>
                    <option value="Yobe">Yobe</option>
                    <option value="Zamfara">Zamfara</option>
                </select>
            </div>

            {/* Price Range */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            <button
                onClick={applyFilters}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
                Apply Filters
            </button>
        </div>
    );
}
