'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'react-hot-toast';
import { COUNTRIES } from '@/lib/countries';

interface StepProps {
    onNext: () => void;
    onBack?: () => void;
}

export default function StepPhone({ onNext, onBack }: StepProps) {
    const { user, updateProfile } = useAuthStore();
    const [countryCode, setCountryCode] = useState('+234'); // Default to Nigeria
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber?.replace(/^\+\d+/, '') || '');
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const selectedCountry = useMemo(() =>
        COUNTRIES.find(c => c.dial_code === countryCode) || COUNTRIES.find(c => c.code === 'NG') || COUNTRIES[0]
        , [countryCode]);

    const filteredCountries = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return COUNTRIES;
        return COUNTRIES.filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.dial_code.includes(query) ||
            c.code.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber) {
            toast.error('Please enter your phone number');
            return;
        }

        setLoading(true);

        // Combine country code with phone number
        const fullPhoneNumber = `${countryCode}${phoneNumber}`;
        updateProfile({ phoneNumber: fullPhoneNumber });

        // Simulate a brief loading state for better UX
        setTimeout(() => {
            setLoading(false);
            onNext();
        }, 500);
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Add Phone Number</h2>
                <p className="text-gray-500">Please provide a phone number where we can reach you.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <div className="flex gap-2">
                        {/* Country Code Dropdown */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDropdown(!showDropdown);
                                    if (!showDropdown) setSearchQuery('');
                                }}
                                className="flex items-center gap-2 px-4 py-4 rounded-xl border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 outline-none transition text-gray-900 font-medium h-full"
                            >
                                <span className="text-xl">{selectedCountry.flag}</span>
                                <span className="text-gray-700">{selectedCountry.dial_code}</span>
                                <svg className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showDropdown && (
                                <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-2 border-b border-gray-100 bg-gray-50">
                                        <div className="relative">
                                            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Search country or code..."
                                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto py-1">
                                        {filteredCountries.length > 0 ? (
                                            filteredCountries.map((country) => (
                                                <button
                                                    key={`${country.code}-${country.dial_code}`}
                                                    type="button"
                                                    onClick={() => {
                                                        setCountryCode(country.dial_code);
                                                        setShowDropdown(false);
                                                    }}
                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition text-left ${countryCode === country.dial_code && selectedCountry.code === country.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                                                >
                                                    <span className="text-xl">{country.flag}</span>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-medium text-sm truncate">{country.name}</span>
                                                        <span className="text-xs text-gray-500">{country.dial_code}</span>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-8 text-center">
                                                <p className="text-sm text-gray-500">No countries found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Phone Number Input */}
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                // Max international length is usually 15 digits total
                                const maxLocal = 15 - (countryCode.replace('+', '').length);
                                if (value.length <= Math.max(10, maxLocal)) {
                                    setPhoneNumber(value);
                                }
                            }}
                            className="flex-1 px-4 py-4 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 outline-none transition text-gray-900 font-medium text-lg tracking-wide h-full"
                            placeholder="800 123 4567"
                            required
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        <span className="text-blue-600 font-medium">Note:</span> Your phone number will be verified manually by our team.
                    </p>
                </div>
                <div className="flex gap-3">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
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
                        className={`${onBack ? 'flex-1' : 'w-full'} bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-3`}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                Continue
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </form >

            {/* Backdrop for closing dropdown */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setShowDropdown(false)}
                />
            )}
        </div >
    );
}
