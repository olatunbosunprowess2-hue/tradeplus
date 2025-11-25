'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'react-hot-toast';

interface StepProps {
    onNext: () => void;
}

export default function StepLocation({ onNext }: StepProps) {
    const { updateProfile } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

    const handleGetLocation = () => {
        setLoading(true);
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    // Reverse geocoding using OpenStreetMap (Nominatim) - Free API
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();

                    const address = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

                    setLocation({
                        lat: latitude,
                        lng: longitude,
                        address: address
                    });
                    toast.success('Location found!');
                } catch (error) {
                    console.error('Geocoding error:', error);
                    toast.error('Could not fetch address details, but coordinates saved.');
                    setLocation({
                        lat: latitude,
                        lng: longitude,
                        address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                    });
                } finally {
                    setLoading(false);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                toast.error('Unable to retrieve your location. Please allow access.');
                setLoading(false);
            }
        );
    };

    const handleSubmit = () => {
        if (!location) return;
        updateProfile({
            locationLat: location.lat,
            locationLng: location.lng,
            locationAddress: location.address
        });
        onNext();
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Confirm Your Location</h2>
                <p className="text-gray-500">We use your real location to find local trades.</p>
            </div>

            <div className="flex flex-col items-center space-y-6">
                <div className="w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 relative overflow-hidden">
                    {location ? (
                        <div className="absolute inset-0 bg-green-50 flex flex-col items-center justify-center p-4 text-center">
                            <span className="text-4xl mb-2">📍</span>
                            <p className="font-medium text-green-800 line-clamp-3">{location.address}</p>
                        </div>
                    ) : (
                        <span className="text-gray-400">Location not set</span>
                    )}
                </div>

                <button
                    onClick={handleGetLocation}
                    disabled={loading}
                    className={`w-full py-3 rounded-xl font-bold text-lg transition shadow-lg flex items-center justify-center gap-2 ${loading
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                        }`}
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            Locating...
                        </>
                    ) : (
                        <>
                            📍 Use My Current Location
                        </>
                    )}
                </button>

                <button
                    onClick={handleSubmit}
                    disabled={!location}
                    className={`w-full py-3 rounded-xl font-bold text-lg transition shadow-lg ${!location
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
