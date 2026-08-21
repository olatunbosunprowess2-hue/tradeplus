'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';
import { State, IState } from 'country-state-city';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

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
  const [gpsLoading, setGpsLoading] = useState(false);

  // Form State
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState<Country | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [availableStates, setAvailableStates] = useState<IState[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const initLocation = async () => {
      try {
        const res = await apiClient.get<Country[]>('/countries');
        const countriesData = res.data;
        setCountries(countriesData);
        await detectCountry(countriesData);
      } catch (err) {
        console.error('Failed to initialize location data:', err);
      }
    };

    initLocation();
  }, []);

  const detectCountry = async (countriesList: Country[]) => {
    try {
      const cached = localStorage.getItem('barterwave_location_cache');
      let data;

      if (cached) {
        const { timestamp, locationData } = JSON.parse(cached);
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          data = locationData;
        }
      }

      if (!data) {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        data = await response.json();
        if (data && data.country_code) {
          localStorage.setItem(
            'barterwave_location_cache',
            JSON.stringify({ timestamp: Date.now(), locationData: data })
          );
        }
      }

      if (data && data.country_code) {
        const detected = countriesList.find((c) => c.code === data.country_code);
        if (detected) {
          setCountry(detected);
          if (!city && data.city) setCity(data.city);
          if (!state && data.region) setState(data.region);
        }
      }
    } catch (e) {
      console.warn('Auto-detect country failed, using default:', e);
      if (countriesList.length > 0) {
        const defaultCountry =
          countriesList.find((c) => c.code === 'NG') ||
          countriesList.find((c) => c.code === 'US') ||
          countriesList[0];
        if (defaultCountry) {
          setCountry(defaultCountry);
        }
      }
    }
  };

  useEffect(() => {
    if (country) {
      const states = State.getStatesOfCountry(country.code);
      setAvailableStates(states);
    } else {
      setAvailableStates([]);
    }
  }, [country]);

  const handleUseGPS = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();
          const addr = data.address || {};

          if (addr.city || addr.town || addr.village)
            setCity(addr.city || addr.town || addr.village);
          if (addr.state || addr.region) setState(addr.state || addr.region);

          const houseNumber = addr.house_number || '';
          const road = addr.road || '';
          const constructedAddr = `${houseNumber} ${road}`.trim();
          if (constructedAddr) setAddress(constructedAddr);

          const countryCode = addr.country_code?.toUpperCase();
          if (countryCode) {
            const matched = countries.find((c) => c.code === countryCode);
            if (matched) setCountry(matched);
          }

          toast.success('Location details auto-filled!');
        } catch (error) {
          console.error('Geocoding error:', error);
          toast.error('Could not auto-fill address, please enter manually.');
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Unable to retrieve location.');
        setGpsLoading(false);
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
        ...(coords ? { locationLat: coords.lat, locationLng: coords.lng } : {}),
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
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Where are you located?</h2>
        <p className="text-xs text-slate-500 mt-1">
          This helps buyers and traders nearby find your listings.
        </p>
      </div>

      <div className="space-y-4">
        {/* Country */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Country
          </label>
          <select
            value={country?.id || ''}
            onChange={(e) => {
              const c = countries.find((x) => x.id === Number(e.target.value));
              if (c) setCountry(c);
            }}
            className="w-full px-3.5 py-2 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition bg-white text-slate-900"
          >
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Ikeja / Lagos"
              className="w-full px-3.5 py-2 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              State / Region
            </label>
            {availableStates.length > 0 ? (
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition bg-white text-slate-900"
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
                className="w-full px-3.5 py-2 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition bg-white text-slate-900 placeholder:text-slate-400"
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Street Address or Landmark
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 12 Admiralty Way, Lekki Phase 1"
            className="w-full px-3.5 py-2 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition bg-white text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <button
          onClick={handleUseGPS}
          type="button"
          disabled={gpsLoading}
          className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md font-semibold border border-slate-200 transition-colors flex items-center justify-center gap-2 text-xs shadow-2xs"
        >
          {gpsLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Detecting location...</span>
            </>
          ) : (
            <>
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              <span>Use Current GPS Location</span>
            </>
          )}
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-md font-bold text-xs transition-colors"
          >
            Back
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!city || !state || !address || !country || loading}
          className={`flex-1 py-2.5 rounded-md font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 ${
            !city || !state || !address || !country || loading
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
          }`}
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
    </div>
  );
}
