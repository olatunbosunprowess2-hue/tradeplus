'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'react-hot-toast';

interface StepProps {
    onComplete: () => void;
    onBack?: () => void;
}

// =====================================================
// GOOD / BAD SELFIE GUIDANCE DATA
// =====================================================
const GOOD_TIPS = [
    { icon: '☀️', label: 'Find bright, even lighting' },
    { icon: '👤', label: 'Face the camera directly' },
    { icon: '😐', label: 'Neutral expression, eyes open' },
    { icon: '🖼️', label: 'Plain background behind you' },
];

const BAD_TIPS = [
    { icon: '🌑', label: 'Too dark or backlit' },
    { icon: '🕶️', label: 'Sunglasses or masks' },
    { icon: '👥', label: 'Multiple people in frame' },
    { icon: '📐', label: 'Blurry, angled, or cropped' },
];

export default function StepIdentity({ onComplete, onBack }: StepProps) {
    const { updateProfile } = useAuthStore();
    const webcamRef = useRef<Webcam>(null);
    const [selfie, setSelfie] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [activeGuideSlide, setActiveGuideSlide] = useState(0);

    // Auto-cycle the good/bad selfie guide
    useEffect(() => {
        const timer = setInterval(() => setActiveGuideSlide(s => (s + 1) % 2), 4000);
        return () => clearInterval(timer);
    }, []);

    const captureSelfie = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setSelfie(imageSrc);
            setShowCamera(false);
        }
    }, [webcamRef]);

    const handleStartCamera = () => {
        setShowCameraModal(true);
    };

    const confirmCameraPermission = () => {
        setShowCameraModal(false);
        setShowCamera(true);
    };

    const handleSubmit = async () => {
        if (!selfie) {
            toast.error('Please take a selfie to continue');
            return;
        }

        if (loading) return;
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('verificationStatus', 'PENDING');
            formData.append('onboardingCompleted', 'true');

            // Convert selfie base64 to blob
            const res = await fetch(selfie);
            const blob = await res.blob();
            formData.append('faceVerification', blob, 'selfie.jpg');

            await updateProfile(formData);
            toast.success('Verification submitted successfully!');
            onComplete();
        } catch (error: any) {
            console.error('Error submitting verification:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to submit verification';
            toast.error(`Error: ${errorMessage}`);
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 relative">
            {/* Camera Permission Modal */}
            {showCameraModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setShowCameraModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Enable Camera Access</h3>
                        <p className="text-gray-500 text-center mb-6">
                            We need access to your camera to take a selfie for identity verification.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={confirmCameraPermission}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                            >
                                Enable Camera
                            </button>
                            <button
                                onClick={() => setShowCameraModal(false)}
                                className="w-full py-3 text-gray-500 font-medium hover:bg-gray-50 rounded-xl transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="text-center mb-2">
                <h2 className="text-2xl font-bold text-gray-900">Identity Verification</h2>
                <p className="text-gray-500 mt-1">Take a clear selfie so we can verify it's really you.</p>
            </div>

            {/* ================================================ */}
            {/* GOOD vs BAD SELFIE ANIMATED GUIDE                */}
            {/* ================================================ */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100 overflow-hidden">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 text-center">
                    📸 Selfie Guide
                </p>

                {/* Slide Container */}
                <div className="relative h-[170px]">
                    {/* GOOD slide */}
                    <div
                        className={`absolute inset-0 transition-all duration-500 ${activeGuideSlide === 0
                            ? 'opacity-100 translate-x-0'
                            : 'opacity-0 translate-x-8 pointer-events-none'
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            {/* Animated face mockup - GOOD */}
                            <div className="w-28 h-28 shrink-0 relative">
                                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-green-100 to-emerald-50 border-2 border-green-300 flex flex-col items-center justify-center shadow-sm">
                                    {/* Face outline */}
                                    <div className="w-12 h-14 rounded-full border-2 border-green-400 relative mb-1 animate-pulse" style={{ animationDuration: '3s' }}>
                                        {/* Eyes */}
                                        <div className="absolute top-4 left-2 w-2 h-2 bg-green-500 rounded-full" />
                                        <div className="absolute top-4 right-2 w-2 h-2 bg-green-500 rounded-full" />
                                        {/* Smile */}
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-4 h-2 border-b-2 border-green-500 rounded-b-full" />
                                    </div>
                                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Good</span>
                                </div>
                                {/* Checkmark badge */}
                                <div className="absolute -top-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce" style={{ animationDuration: '2s' }}>
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            {/* Tips */}
                            <div className="flex-1 space-y-2 pt-1">
                                {GOOD_TIPS.map((tip, i) => (
                                    <div
                                        key={tip.label}
                                        className="flex items-center gap-2.5 bg-white/70 px-3 py-1.5 rounded-lg animate-in slide-in-from-right duration-300"
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    >
                                        <span className="text-base">{tip.icon}</span>
                                        <span className="text-xs font-medium text-gray-700">{tip.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* BAD slide */}
                    <div
                        className={`absolute inset-0 transition-all duration-500 ${activeGuideSlide === 1
                            ? 'opacity-100 translate-x-0'
                            : 'opacity-0 -translate-x-8 pointer-events-none'
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            {/* Animated face mockup - BAD */}
                            <div className="w-28 h-28 shrink-0 relative">
                                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-red-100 to-orange-50 border-2 border-red-300 flex flex-col items-center justify-center shadow-sm">
                                    {/* Tilted face outline */}
                                    <div className="w-12 h-14 rounded-full border-2 border-red-400 relative mb-1 rotate-12 opacity-60">
                                        {/* Sunglasses */}
                                        <div className="absolute top-3.5 left-1 w-3 h-2 bg-red-400 rounded-sm" />
                                        <div className="absolute top-3.5 right-1 w-3 h-2 bg-red-400 rounded-sm" />
                                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-6 h-[1px] bg-red-400" />
                                        {/* Frown */}
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-4 h-2 border-t-2 border-red-400 rounded-t-full" />
                                    </div>
                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Bad</span>
                                </div>
                                {/* X badge */}
                                <div className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-bounce" style={{ animationDuration: '2s' }}>
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            </div>
                            {/* Tips */}
                            <div className="flex-1 space-y-2 pt-1">
                                {BAD_TIPS.map((tip, i) => (
                                    <div
                                        key={tip.label}
                                        className="flex items-center gap-2.5 bg-white/70 px-3 py-1.5 rounded-lg animate-in slide-in-from-right duration-300"
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    >
                                        <span className="text-base">{tip.icon}</span>
                                        <span className="text-xs font-medium text-gray-700">{tip.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Slide Dots */}
                <div className="flex justify-center gap-2 mt-3">
                    <button
                        onClick={() => setActiveGuideSlide(0)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${activeGuideSlide === 0 ? 'bg-green-500 w-5' : 'bg-gray-300 hover:bg-gray-400'}`}
                    />
                    <button
                        onClick={() => setActiveGuideSlide(1)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${activeGuideSlide === 1 ? 'bg-red-500 w-5' : 'bg-gray-300 hover:bg-gray-400'}`}
                    />
                </div>
            </div>

            {/* ================================================ */}
            {/* CAMERA / SELFIE AREA                             */}
            {/* ================================================ */}
            <div className="space-y-3">
                <div className="relative w-full h-72 bg-black rounded-2xl overflow-hidden flex items-center justify-center group shadow-lg">
                    {selfie ? (
                        <img src={selfie} alt="Selfie" className="w-full h-full object-cover" />
                    ) : showCamera ? (
                        <>
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="w-full h-full object-cover"
                            />
                            {/* Face alignment overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-40 h-52 border-2 border-white/40 rounded-[50%] animate-pulse" style={{ animationDuration: '3s' }} />
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-6">
                            <div className="w-20 h-20 bg-gray-800/80 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-700 transition-all group-hover:scale-110">
                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-400 font-medium">Camera is off</p>
                            <p className="text-gray-500 text-xs mt-1">Tap below to start</p>
                        </div>
                    )}

                    {/* Selfie captured badge */}
                    {selfie && (
                        <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg animate-in zoom-in duration-200">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            Selfie captured
                        </div>
                    )}
                </div>

                {/* Camera Controls */}
                {selfie ? (
                    <button
                        onClick={() => {
                            setSelfie(null);
                            setShowCamera(true);
                        }}
                        className="w-full py-3 border-2 border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold transition-all hover:border-gray-300 flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retake Selfie
                    </button>
                ) : showCamera ? (
                    <button
                        onClick={captureSelfie}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Capture Photo
                    </button>
                ) : (
                    <button
                        onClick={handleStartCamera}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Start Camera
                    </button>
                )}
            </div>

            {/* Info Note */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <div>
                    <p className="text-xs font-semibold text-amber-800">Why a selfie?</p>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                        Your selfie helps us protect the community from fake accounts. It's reviewed by a human moderator and never shared publicly.
                    </p>
                </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 mt-4">
                {onBack && (
                    <button
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
                    onClick={handleSubmit}
                    disabled={loading || !selfie}
                    className={`${onBack ? 'flex-1' : 'w-full'} py-4 rounded-xl font-bold text-lg transition shadow-lg ${loading || !selfie
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/25 active:scale-[0.98]'
                        }`}
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Submitting...
                        </span>
                    ) : (
                        'Submit Verification'
                    )}
                </button>
            </div>
        </div>
    );
}
