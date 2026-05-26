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
    const [showCamera, setShowCamera] = useState(true);
    const [activeGuideSlide, setActiveGuideSlide] = useState(0);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraErrorType, setCameraErrorType] = useState<'permission' | 'not_found' | 'other' | null>(null);
    const [cameraRetryKey, setCameraRetryKey] = useState(0);
    const [cameraInitializing, setCameraInitializing] = useState(false);
    const initTimeoutRef = useRef<any>(null);

    // Auto-cycle the good/bad selfie guide
    useEffect(() => {
        const timer = setInterval(() => setActiveGuideSlide(s => (s + 1) % 2), 4000);
        return () => {
            clearInterval(timer);
            if (initTimeoutRef.current) {
                clearTimeout(initTimeoutRef.current);
            }
        };
    }, []);

    // Auto-start camera session on mount & clean up camera stream on unmount
    useEffect(() => {
        startCameraSession();
        return () => {
            // Stop all active camera tracks to release hardware (turns off LED, saves battery)
            if (webcamRef.current?.video?.srcObject) {
                const tracks = (webcamRef.current.video.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
            if (initTimeoutRef.current) {
                clearTimeout(initTimeoutRef.current);
            }
        };
    }, []);

    const captureSelfie = useCallback(() => {
        if (!webcamRef.current) {
            toast.error("Camera is not initialized. Please try starting the camera again.");
            return;
        }

        const video = webcamRef.current.video;
        if (!video || video.readyState < 2) {
            toast.error("Camera stream is not fully ready yet. Please wait a moment and try again.");
            return;
        }

        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            setSelfie(imageSrc);
            setShowCamera(false);
            setCameraInitializing(false);
            setCameraError(null);
            setCameraErrorType(null);
            if (initTimeoutRef.current) {
                clearTimeout(initTimeoutRef.current);
            }
            toast.success("Selfie captured successfully!");
        } else {
            toast.error("Failed to capture image. Please try again.");
        }
    }, [webcamRef]);

    const startCameraSession = () => {
        setShowCamera(true);
        setCameraError(null);
        setCameraErrorType(null);
        setCameraInitializing(true);
        
        if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
        }
        
        // Extended timeout to 12 seconds to prevent early warning banners on slow mobile devices
        initTimeoutRef.current = setTimeout(() => {
            setCameraInitializing(prev => {
                if (prev) {
                    const warningMsg = 'Camera request timed out. Please verify camera permissions or upload a photo below.';
                    setCameraError(warningMsg);
                    setCameraErrorType('other');
                    toast(warningMsg, {
                        icon: '⚠️',
                        duration: 6000,
                    });
                    return false;
                }
                return prev;
            });
        }, 12000);
    };

    const handleStartCamera = () => {
        startCameraSession();
    };

    const handleRetryCamera = () => {
        setCameraRetryKey(prev => prev + 1);
        startCameraSession();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error('Please upload a valid image file (JPEG, PNG, or WebP).');
            return;
        }

        // Validate file size (max 10MB)
        const MAX_SIZE_MB = 10;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            toast.error(`Image is too large. Maximum size is ${MAX_SIZE_MB}MB.`);
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setSelfie(reader.result as string);
            setShowCamera(false);
            setCameraInitializing(false);
            setCameraError(null);
            setCameraErrorType(null);
            if (initTimeoutRef.current) {
                clearTimeout(initTimeoutRef.current);
            }
            toast.success('Photo uploaded successfully!');
        };
        reader.readAsDataURL(file);
    };

    const handleUserMediaError = useCallback((error: string | DOMException) => {
        console.error('Webcam media error:', error);
        let errorMsg = 'Failed to access camera.';
        let errorType: 'permission' | 'not_found' | 'other' = 'other';
        if (typeof error === 'string') {
            errorMsg = error;
            if (error.toLowerCase().includes('denied') || error.toLowerCase().includes('permission') || error.toLowerCase().includes('allow')) {
                errorType = 'permission';
            }
        } else if (error instanceof DOMException) {
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMsg = 'Camera access was denied. Please allow camera permissions in your settings, or upload a photo instead.';
                errorType = 'permission';
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMsg = 'No camera device found on this system.';
                errorType = 'not_found';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMsg = 'Camera is already in use by another application. Please close other apps using the camera and try again.';
                errorType = 'other';
            } else if (error.name === 'OverconstrainedError') {
                errorMsg = 'Camera does not support the requested settings. Retrying with default settings...';
                errorType = 'other';
            } else if (error.message) {
                errorMsg = error.message;
            }
        }
        setCameraError(errorMsg);
        setCameraErrorType(errorType);
        toast.error(errorMsg);
    }, []);

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
        } finally {
            setLoading(false);
        }
    };

    const getInstructions = () => {
        if (cameraErrorType === 'not_found') {
            return (
                <p className="text-xs text-red-600 mt-2 font-medium">
                    Please make sure your camera is plugged in, powered on, and recognized by your system. If you don't have a camera, you can upload a photo from your device.
                </p>
            );
        }

        if (typeof window === 'undefined') return null;
        const ua = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isAndroid = /Android/i.test(ua);
        const isChrome = /CriOS/.test(ua);
        
        if (isIOS) {
            if (isChrome) {
                return (
                    <ol className="text-left text-xs text-red-600 space-y-1.5 mt-3 list-decimal pl-5 leading-normal">
                        <li>Open iOS <strong>Settings</strong> app</li>
                        <li>Scroll down and tap <strong>Chrome</strong></li>
                        <li>Toggle <strong>Camera</strong> permission to <strong>ON</strong></li>
                        <li>Return to Chrome, reload the page & try again</li>
                    </ol>
                );
            }
            return (
                <ol className="text-left text-xs text-red-600 space-y-1.5 mt-3 list-decimal pl-5 leading-normal">
                    <li>Tap the <strong>aA</strong> settings icon in your Safari address bar</li>
                    <li>Tap <strong>Website Settings</strong></li>
                    <li>Change Camera access to <strong>Allow</strong></li>
                    <li>Reload the page or tap <strong>Retry Camera</strong></li>
                </ol>
            );
        }

        if (isAndroid) {
            return (
                <ol className="text-left text-xs text-red-600 space-y-1.5 mt-3 list-decimal pl-5 leading-normal">
                    <li>Tap the <strong>sliders/settings</strong> icon in your Chrome address bar (left of the domain)</li>
                    <li>Tap <strong>Site settings</strong> and ensure <strong>Camera</strong> access is set to <strong>Allow</strong></li>
                    <li>If it remains blocked: Open your Android <strong>Settings</strong> app &gt; <strong>Apps</strong> &gt; <strong>Chrome</strong> &gt; <strong>Permissions</strong> &gt; <strong>Camera</strong> &gt; set to <strong>Allow only while using the app</strong></li>
                    <li>Return here, refresh the page and try again</li>
                </ol>
            );
        }
        
        return (
            <ol className="text-left text-xs text-red-600 space-y-1.5 mt-3 list-decimal pl-5 leading-normal">
                <li>Tap the settings/lock icon in your browser address bar</li>
                <li>Ensure <strong>Camera</strong> access is set to <strong>Allow</strong></li>
                <li>Tap <strong>Retry Camera</strong> below</li>
            </ol>
        );
    };

    return (
        <div className="space-y-6 relative">

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
            {/* CAMERA PERMISSION DENIED BANNER                   */}
            {/* ================================================ */}
            {cameraError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-red-800">
                            {cameraErrorType === 'permission' && 'Camera Permission Blocked'}
                            {cameraErrorType === 'not_found' && 'No Camera Detected'}
                            {cameraErrorType === 'other' && 'Camera Error'}
                        </p>
                        <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                            {cameraErrorType === 'permission' && 'Your browser has denied camera access. To complete identity verification, please enable camera access in your settings.'}
                            {cameraErrorType === 'not_found' && 'We could not detect a camera device. Live face verification is required to complete onboarding.'}
                            {cameraErrorType === 'other' && cameraError}
                        </p>
                        {getInstructions()}
                    </div>
                </div>
            )}

            {/* ================================================ */}
            {/* CAMERA / SELFIE AREA                             */}
            {/* ================================================ */}
            <div className="space-y-3">
                <div className={`relative w-full h-72 bg-black rounded-2xl overflow-hidden flex items-center justify-center group shadow-lg`}>
                    {selfie ? (
                        <img src={selfie} alt="Selfie" className="w-full h-full object-contain bg-slate-950" />
                    ) : showCamera && !cameraError ? (
                        <>
                            {cameraInitializing && (
                                <div className="absolute inset-0 z-10 bg-black flex flex-col items-center justify-center space-y-3 p-4">
                                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-gray-400 text-sm font-semibold">Requesting camera access...</p>
                                    <p className="text-gray-500 text-xs text-center leading-relaxed font-medium">
                                        Please allow camera permissions if prompted by your browser.
                                    </p>
                                </div>
                            )}
                            <Webcam
                                key={cameraRetryKey}
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="w-full h-full object-cover"
                                videoConstraints={{
                                    facingMode: { ideal: 'user' }
                                }}
                                mirrored={true}
                                onUserMediaError={(err) => {
                                    setCameraInitializing(false);
                                    if (initTimeoutRef.current) {
                                        clearTimeout(initTimeoutRef.current);
                                    }
                                    handleUserMediaError(err);
                                }}
                                onUserMedia={() => {
                                    setCameraInitializing(false);
                                    setCameraError(null);
                                    setCameraErrorType(null);
                                    if (initTimeoutRef.current) {
                                        clearTimeout(initTimeoutRef.current);
                                    }
                                }}
                            />
                            {/* Face alignment overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                <div className="w-40 h-52 border-2 border-white/40 rounded-[50%] animate-pulse" style={{ animationDuration: '3s' }} />
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-6 w-full">
                            <div className={`w-20 h-20 ${cameraError ? 'bg-red-900/40' : 'bg-gray-800/80'} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-700 transition-all group-hover:scale-110`}>
                                {cameraError ? (
                                    <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                ) : (
                                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </div>
                            <p className={`${cameraError ? 'text-red-400' : 'text-gray-400'} font-medium`}>
                                {cameraErrorType === 'permission' && 'Camera Permission Blocked'}
                                {cameraErrorType === 'not_found' && 'No Camera Detected'}
                                {cameraErrorType === 'other' && 'Camera Error'}
                                {!cameraError && 'Camera is off'}
                            </p>
                            <p className="text-gray-500 text-xs mt-1 max-w-[220px] mx-auto leading-normal">
                                {cameraErrorType === 'permission' && 'Enable camera in your browser settings to proceed'}
                                {cameraErrorType === 'not_found' && 'A front-facing camera device is required'}
                                {cameraErrorType === 'other' && 'Check connection or try again'}
                                {!cameraError && 'Tap below to start'}
                            </p>
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
                            setCameraError(null);
                            setCameraErrorType(null);
                        }}
                        className="w-full py-3 border-2 border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold transition-all hover:border-gray-300 flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retake Selfie
                    </button>
                ) : showCamera && !cameraError ? (
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={captureSelfie}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-full font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                        >
                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Capture Photo
                        </button>
                    </div>
                ) : cameraError ? (
                    <div className="flex flex-col gap-2.5">
                        <button
                            onClick={handleRetryCamera}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-full font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Retry Camera
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5">
                        <button
                            onClick={handleStartCamera}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-full font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Start Camera
                        </button>
                    </div>
                )}

                {/* Subtle photo upload fallback */}
                <div className="text-center pt-1.5">
                    <label className="text-xs text-gray-400 hover:text-blue-500 active:text-blue-600 transition cursor-pointer select-none font-medium underline underline-offset-4 decoration-gray-300 hover:decoration-blue-400">
                        Unable to use camera? Upload photo instead
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </label>
                </div>
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
