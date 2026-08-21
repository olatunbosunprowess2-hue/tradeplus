'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useToastStore } from '@/lib/toast-store';
import { useAuthStore } from '@/lib/auth-store';
import { useLocationStore } from '@/lib/location-store';
import { apiClient } from '@/lib/api-client';
import SearchableSelect from './SearchableSelect';
import { Flame, MapPin, Filter } from 'lucide-react';

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

export default function SearchFilters({ onApply }: { onApply?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { error: toastError } = useToastStore();
  const { user } = useAuthStore();
  const { detectedCountryCode, detectLocation, setDetectedCountry } = useLocationStore();

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

  useEffect(() => {
    if (!user) {
      detectLocation();
    }

    apiClient
      .get<Country[]>('/countries')
      .then((res) => {
        const fetchedCountries = res.data;
        setCountries(fetchedCountries);

        const urlCountryId = searchParams.get('countryId');
        if (urlCountryId) {
          hasAutoAppliedCountry.current = true;
          return;
        }

        let detectedId: string | null = null;
        if (user?.profile?.countryId) {
          detectedId = user.profile.countryId.toString();
        } else if (detectedCountryCode) {
          const matched = fetchedCountries.find((c) => c.code === detectedCountryCode);
          if (matched) {
            detectedId = matched.id.toString();
            setDetectedCountry(matched.code, matched.id);
          }
        }

        if (detectedId && !hasAutoAppliedCountry.current) {
          hasAutoAppliedCountry.current = true;
          setCountryId(detectedId);
          const params = new URLSearchParams(searchParams.toString());
          params.set('countryId', detectedId);
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        } else if (!detectedId && !hasAutoAppliedCountry.current) {
          const defaultCountryId = '1';
          hasAutoAppliedCountry.current = true;
          setCountryId(defaultCountryId);
          const params = new URLSearchParams(searchParams.toString());
          params.set('countryId', defaultCountryId);
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
      })
      .catch((err) => console.error('Failed to fetch countries:', err));
  }, [user, detectedCountryCode]);

  useEffect(() => {
    if (countryId) {
      setLoadingRegions(true);
      apiClient
        .get<Region[]>(`/countries/${countryId}/regions`)
        .then((res) => setRegions(res.data))
        .catch((err) => {
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

    const targetPath = pathname === '/' ? '/listings' : pathname;
    router.push(`${targetPath}?${params.toString()}`);

    if (onApply) {
      onApply();
    }
  };

  const regionOptions = useMemo(
    () => [{ id: '', name: 'All States' }, ...regions.map((r) => ({ id: r.id, name: r.name }))],
    [regions]
  );

  const activeCountry = useMemo(() => {
    return countries.find((c) => c.id.toString() === countryId);
  }, [countries, countryId]);

  return (
    <div className="space-y-4">
      {/* Distress Sale / Urgent Deals Filter */}
      <div>
        <button
          onClick={() => setIsDistressSale(!isDistressSale)}
          className={`w-full p-2.5 rounded-md border transition-colors flex items-center justify-between gap-2 text-left ${
            isDistressSale
              ? 'bg-orange-600 border-orange-600 text-white shadow-xs'
              : 'bg-orange-50/70 border-orange-200/80 text-slate-900 hover:bg-orange-100/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <Flame className={`w-4 h-4 ${isDistressSale ? 'text-white' : 'text-orange-600'}`} />
            <div>
              <p className="font-bold text-xs">Urgent Deals Only</p>
              <p
                className={`text-[10px] ${
                  isDistressSale ? 'text-orange-100' : 'text-slate-500'
                }`}
              >
                Discounted liquidation sales
              </p>
            </div>
          </div>
          <div
            className={`w-7 h-4 rounded-full transition-colors relative flex-shrink-0 ${
              isDistressSale ? 'bg-white/30' : 'bg-orange-200'
            }`}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
                isDistressSale ? 'right-0.5 bg-white' : 'left-0.5 bg-orange-600'
              }`}
            />
          </div>
        </button>
      </div>

      {/* Listing Type */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
          Type
        </label>
        <div className="space-y-1.5">
          {[
            { value: '', label: 'All' },
            { value: 'PHYSICAL', label: 'Product' },
            { value: 'SERVICE', label: 'Service' },
          ].map((item) => (
            <label
              key={item.value}
              className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 hover:text-slate-900"
            >
              <input
                type="radio"
                name="type"
                value={item.value}
                checked={type === item.value}
                onChange={(e) => setType(e.target.value)}
                className="text-blue-600 focus:ring-blue-600/20 h-3.5 w-3.5 border-slate-300"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Condition - Only show if type is NOT Service */}
      {type !== 'SERVICE' && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Condition
          </label>
          <div className="space-y-1.5">
            {[
              { value: '', label: 'Any' },
              { value: 'new', label: 'New' },
              { value: 'used', label: 'Used' },
            ].map((item) => (
              <label
                key={item.value}
                className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 hover:text-slate-900"
              >
                <input
                  type="radio"
                  name="condition"
                  value={item.value}
                  checked={condition === item.value}
                  onChange={(e) => setCondition(e.target.value)}
                  className="text-blue-600 focus:ring-blue-600/20 h-3.5 w-3.5 border-slate-300"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Trade Option */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          Trade Option
        </label>
        <select
          value={tradeType}
          onChange={(e) => setTradeType(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs text-slate-900 bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-colors"
        >
          <option value="">Any</option>
          <option value="cash">Cash Only</option>
          <option value="barter">Barter Only</option>
          <option value="cash_plus_barter">Cash + Barter</option>
        </select>
      </div>

      {/* Country Display (Locked) */}
      {activeCountry && (
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 flex-shrink-0">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Browsing In</p>
            <p className="text-xs font-bold text-slate-900 truncate">{activeCountry.name}</p>
          </div>
        </div>
      )}

      {/* State/Region Filter */}
      <div>
        <SearchableSelect
          label="State/Region"
          options={regionOptions}
          value={regionId}
          onChange={(val) => setRegionId(val.toString())}
          placeholder={!countryId ? 'Select a country first' : 'All States'}
          disabled={!countryId}
          loading={loadingRegions}
        />
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          Price Range (₦)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-colors"
          />
          <span className="text-slate-400 text-xs">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Apply Filters Button */}
      <button
        onClick={applyFilters}
        className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2.5 rounded-md font-bold text-xs transition-colors shadow-xs"
      >
        Apply Filters
      </button>
    </div>
  );
}
