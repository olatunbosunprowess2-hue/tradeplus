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
    const [showPermissionModal, setShowPermissionModal] = useState(false);

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
        if (!location) {
            toast.error('Please set your GPS location to continue');
            return;
        }

        updateProfile({
            locationLat: location.lat,
            locationLng: location.lng,
            locationAddress: location.address,
        } as any);

        onNext();
    };

    const handleRequestLocation = () => {
        setShowPermissionModal(true);
    };

    const confirmLocationPermission = () => {
        setShowPermissionModal(false);
        handleGetLocation();
    };

    // Form is valid when GPS location is set
    const isFormValid = location !== null;

    return (
        <div className="space-y-6 relative">
            {showPermissionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Allow Location Access</h3>
                        <p className="text-gray-500 text-center mb-6">
                            We need your location to show you relevant trades and verified users in your area.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={confirmLocationPermission}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                            >
                                Allow Access
                            </button>
                            <button
                                onClick={() => setShowPermissionModal(false)}
                                className="w-full py-3 text-gray-500 font-medium hover:bg-gray-50 rounded-xl transition"
                            >
                                Not Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Where are you located?</h2>
                <p className="text-gray-500">Enable GPS to find local trades near you.</p>
            </div>

            <div className="space-y-6">
                {/* GPS Location Illustration */}
                <div className="flex justify-center">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${location
                            ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-200'
                            : 'bg-gradient-to-br from-blue-100 to-blue-200'
                        }`}>
                        {location ? (
                            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        )}
                    </div>
                </div>

                {/* Get Location Button */}
                <button
                    onClick={handleRequestLocation}
                    disabled={loading}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${location
                            ? 'bg-green-50 border-2 border-green-300 text-green-700'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                        }`}
                >
                    {loading ? (
                        <>
                            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Finding Your Location...</span>
                        </>
                    ) : location ? (
                        <>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>GPS Location Set</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Enable GPS Location</span>
                        </>
                    )}
                </button>

                {/* Location Address Display */}
                {location && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                        <p className="text-sm text-green-800 font-medium">📍 Your Location</p>
                        <p className="text-sm text-green-700 mt-1">{location.address}</p>
                    </div>
                )}

                {/* Helper Text */}
                {!location && (
                    <p className="text-sm text-center text-gray-400">
                        Your location helps us show you nearby traders and listings
                    </p>
                )}

                {/* Continue Button */}
                <button
                    onClick={handleSubmit}
                    disabled={!isFormValid}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-md mt-6 ${!isFormValid
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
