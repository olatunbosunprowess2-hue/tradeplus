import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './auth-store';

interface LocationState {
    detectedCountryCode: string | null;
    detectedCountryId: number | null;
    isDetecting: boolean;
    hasAttemptedDetection: boolean;
    detectLocation: () => Promise<void>;
    setDetectedCountry: (code: string, id: number) => void;
}

export const useLocationStore = create<LocationState>()(
    persist(
        (set, get) => ({
            detectedCountryCode: null,
            detectedCountryId: null,
            isDetecting: false,
            hasAttemptedDetection: false,

            detectLocation: async () => {
                const { hasAttemptedDetection, isDetecting } = get();
                if (hasAttemptedDetection || isDetecting) return;

                set({ isDetecting: true });

                try {
                    // Using ipapi.co for free IP-based geolocation (JSON format)
                    const response = await fetch('https://ipapi.co/json/');
                    const data = await response.json();

                    if (data && data.country_code) {
                        const countryCode = data.country_code; // e.g., "NG", "KE"

                        // We need to map this code to our database ID
                        // This will be handled in the component when countries are loaded
                        set({
                            detectedCountryCode: countryCode,
                            hasAttemptedDetection: true
                        });
                    }
                } catch (error) {
                    console.error('Failed to detect location:', error);
                    set({ hasAttemptedDetection: true });
                } finally {
                    set({ isDetecting: false });
                }
            },

            setDetectedCountry: (code: string, id: number) => {
                set({ detectedCountryCode: code, detectedCountryId: id });
            },
        }),
        {
            name: 'location-storage',
            partialize: (state) => ({
                detectedCountryCode: state.detectedCountryCode,
                detectedCountryId: state.detectedCountryId,
                hasAttemptedDetection: state.hasAttemptedDetection,
            }),
        }
    )
);
