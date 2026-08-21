'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'react-hot-toast';
import { COUNTRIES } from '@/lib/countries';
import { ChevronDown, Search, Loader2 } from 'lucide-react';

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

export default function StepPhone({ onNext, onBack }: StepProps) {
  const { user, updateProfile } = useAuthStore();
  const [countryCode, setCountryCode] = useState('+234'); // Default to Nigeria
  const [phoneNumber, setPhoneNumber] = useState(
    user?.phoneNumber?.replace(/^\+\d+/, '') || ''
  );
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCountry = useMemo(
    () =>
      COUNTRIES.find((c) => c.dial_code === countryCode) ||
      COUNTRIES.find((c) => c.code === 'NG') ||
      COUNTRIES[0],
    [countryCode]
  );

  const filteredCountries = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
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
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    updateProfile({ phoneNumber: fullPhoneNumber });

    setTimeout(() => {
      setLoading(false);
      onNext();
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Phone Number</h2>
        <p className="text-xs text-slate-500 mt-1">
          Used to verify trade notifications and SMS alerts.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Mobile Number
          </label>
          <div className="flex gap-2">
            {/* Country Code Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowDropdown(!showDropdown);
                  if (!showDropdown) setSearchQuery('');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-slate-300 bg-slate-50 hover:bg-slate-100 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition text-slate-900 font-medium text-sm h-full shadow-2xs"
              >
                <span className="text-base">{selectedCountry.flag}</span>
                <span className="text-xs font-bold text-slate-700">{selectedCountry.dial_code}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    showDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showDropdown && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-slate-200 rounded-md shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in duration-150">
                  <div className="p-2 border-b border-slate-100 bg-slate-50">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search country or code..."
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((country) => (
                        <button
                          key={`${country.code}-${country.dial_code}`}
                          type="button"
                          onClick={() => {
                            setCountryCode(country.dial_code);
                            setShowDropdown(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 transition text-left text-xs ${
                            countryCode === country.dial_code &&
                            selectedCountry.code === country.code
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'text-slate-700'
                          }`}
                        >
                          <span className="text-base">{country.flag}</span>
                          <span className="flex-1 truncate">{country.name}</span>
                          <span className="text-slate-400 font-mono">{country.dial_code}</span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-4 text-xs text-center text-slate-400">No countries found</p>
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
                if (value.length <= 11) {
                  setPhoneNumber(value);
                }
              }}
              className="flex-1 px-3.5 py-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition text-slate-900 bg-white placeholder:text-slate-400 text-sm font-medium"
              placeholder="801 234 5678"
              required
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-md font-bold text-xs transition-colors"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`${
              onBack ? 'flex-1' : 'w-full'
            } bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2.5 rounded-md font-bold text-xs transition-colors shadow-xs flex justify-center items-center gap-2`}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Continue</span>
            )}
          </button>
        </div>
      </form>

      {showDropdown && (
        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowDropdown(false)} />
      )}
    </div>
  );
}
