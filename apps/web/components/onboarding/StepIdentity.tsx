'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'react-hot-toast';

interface StepProps {
    onComplete: () => void;
    onBack?: () => void;
}

export default function StepIdentity({ onComplete, onBack }: StepProps) {
    const { updateProfile } = useAuthStore();
    const webcamRef = useRef<Webcam>(null);
    const [selfie, setSelfie] = useState<string | null>(null);
    const [selfieFile, setSelfieFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [showCamera, setShowCamera] = useState(true);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraErrorType, setCameraErrorType] = useState<'permission' | 'not_found' | 'other' | null>(null);
    const [cameraRetryKey, setCameraRetryKey] = useState(0);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraInitializing, setCameraInitializing] = useState(false);
    const initTimeoutRef = useRef<any>(null);
    const [useFallbackConstraints, setUseFallbackConstraints] = useState(false);

    // Auto-start camera on mount & clean up on unmount
    useEffect(() => {
        startCameraSession();
        return () => {
            if (webcamRef.current?.video?.srcObject) {
                const tracks = (webcamRef.current.video.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
            if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
        };
    }, []);

    const captureSelfie = useCallback(() => {
        if (!webcamRef.current) {
            toast.error("Camera not ready. Please wait a moment.");
            return;
        }
        const video = webcamRef.current.video;
        if (!video || video.readyState < 2) {
            toast.error("Camera still loading. Please wait.");
            return;
        }
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            setSelfie(imageSrc);
            setSelfieFile(null);
            setShowCamera(false);
            setCameraInitializing(false);
            setCameraError(null);
            setCameraErrorType(null);
            if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
        } else {
            toast.error("Capture failed. Try again.");
        }
    }, []);

    const startCameraSession = () => {
        setShowCamera(true);
        setCameraError(null);
        setCameraErrorType(null);
        setCameraInitializing(true);
        setCameraReady(false);

        if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);

        // If camera doesn't init within 10s, try fallback constraints
        initTimeoutRef.current = setTimeout(() => {
            setCameraInitializing(prev => {
                if (prev) {
                    // Try with no constraints at all (fallback)
                    if (!useFallbackConstraints) {
                        setUseFallbackConstraints(true);
                        setCameraRetryKey(k => k + 1);
                        return true; // Stay initializing
                    }
                    // If fallback also failed, show error
                    setCameraError('Camera timed out. Please upload a photo instead.');
                    setCameraErrorType('other');
                    return false;
                }
                return prev;
            });
        }, 10000);
    };

    const handleRetryCamera = () => {
        setUseFallbackConstraints(false);
        setCameraRetryKey(prev => prev + 1);
        startCameraSession();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
        if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|heic|heif)$/i)) {
            toast.error('Please upload a JPEG, PNG, or WebP image.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image too large. Max 10MB.');
            return;
        }

        // Store the actual file for direct upload
        setSelfieFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setSelfie(reader.result as string);
            setShowCamera(false);
            setCameraInitializing(false);
            setCameraError(null);
            setCameraErrorType(null);
            if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
        };
        reader.readAsDataURL(file);
    };

    const handleUserMediaError = useCallback((error: string | DOMException) => {
        console.error('Webcam error:', error);
        let errorMsg = 'Camera access failed.';
        let errorType: 'permission' | 'not_found' | 'other' = 'other';

        if (typeof error === 'string') {
            errorMsg = error;
            if (error.toLowerCase().includes('denied') || error.toLowerCase().includes('permission')) {
                errorType = 'permission';
            }
        } else if (error instanceof DOMException) {
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMsg = 'Camera permission denied.';
                errorType = 'permission';
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMsg = 'No camera found.';
                errorType = 'not_found';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMsg = 'Camera in use by another app.';
                errorType = 'other';
            } else if (error.name === 'OverconstrainedError') {
                // Try again with no constraints
                if (!useFallbackConstraints) {
                    setUseFallbackConstraints(true);
                    setCameraRetryKey(k => k + 1);
                    return;
                }
                errorMsg = 'Camera not supported. Upload a photo instead.';
                errorType = 'other';
            } else if (error.message) {
                errorMsg = error.message;
            }
        }
        setCameraError(errorMsg);
        setCameraErrorType(errorType);
    }, [useFallbackConstraints]);

    const handleSubmit = async () => {
        if (!selfie || loading) return;
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('verificationStatus', 'PENDING');
            formData.append('onboardingCompleted', 'true');

            if (selfieFile) {
                // Direct file upload — most reliable path
                formData.append('faceVerification', selfieFile, selfieFile.name);
            } else {
                // Camera capture — convert base64 data URL to blob manually
                const parts = selfie.split(',');
                const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
                const bstr = atob(parts[1]);
                const u8arr = new Uint8Array(bstr.length);
                for (let i = 0; i < bstr.length; i++) {
                    u8arr[i] = bstr.charCodeAt(i);
                }
                const blob = new Blob([u8arr], { type: mime });
                formData.append('faceVerification', blob, 'selfie.jpg');
            }

            await updateProfile(formData);
            toast.success('Verification submitted!');
            onComplete();
        } catch (error: any) {
            console.error('Verification submit error:', error);
            const msg = error.response?.data?.message || error.message || 'Submission failed. Please try again.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // Video constraints: try front camera first, fallback to any camera
    const videoConstraints = useFallbackConstraints
        ? { width: 640, height: 480 }
        : { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } };

    return (
        <div className="space-y-4 relative">

            {/* Header — compact */}
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">Take a selfie</h2>
                <p className="text-gray-500 text-sm mt-0.5">Clear, front-facing, good lighting.</p>
            </div>

            {/* Camera / Selfie Area */}
            <div className="space-y-3">
                <div className="relative w-full h-72 bg-black rounded-2xl overflow-hidden flex items-center justify-center shadow-lg">
                    {selfie ? (
                        <img src={selfie} alt="Selfie" className="w-full h-full object-contain bg-slate-950" />
                    ) : showCamera && !cameraError ? (
                        <>
                            {cameraInitializing && !cameraReady && (
                                <div className="absolute inset-0 z-10 bg-black flex flex-col items-center justify-center space-y-3 p-4">
                                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-gray-400 text-sm font-semibold">Starting camera...</p>
                                    <p className="text-gray-500 text-xs text-center">Allow camera access if prompted.</p>
                                </div>
                            )}
                            <Webcam
                                key={cameraRetryKey}
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                screenshotQuality={0.92}
                                className="w-full h-full object-cover"
                                videoConstraints={videoConstraints}
                                mirrored={!useFallbackConstraints}
                                onUserMediaError={(err) => {
                                    setCameraInitializing(false);
                                    setCameraReady(false);
                                    if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
                                    handleUserMediaError(err);
                                }}
                                onUserMedia={() => {
                                    setCameraInitializing(false);
                                    setCameraReady(true);
                                    setCameraError(null);
                                    setCameraErrorType(null);
                                    if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
                                }}
                            />
                            {/* Face alignment oval */}
                            {cameraReady && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-40 h-52 border-2 border-white/30 rounded-[50%]" />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center p-6 w-full">
                            <div className="w-16 h-16 bg-gray-800/80 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-400 font-medium text-sm">Camera is off</p>
                        </div>
                    )}

                    {/* Selfie captured badge */}
                    {selfie && (
                        <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            Captured
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
                            setCameraReady(false);
                            startCameraSession();
                        }}
                        className="w-full py-3 border-2 border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retake
                    </button>
                ) : showCamera && !cameraError ? (
                    <button
                        onClick={captureSelfie}
                        disabled={!cameraReady}
                        className={`w-full py-3 rounded-full font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm ${
                            cameraReady
                                ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {cameraReady ? 'Capture' : 'Waiting for camera...'}
                    </button>
                ) : cameraError ? (
                    <div className="space-y-2">
                        {/* Compact error — one line */}
                        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs text-red-700 font-medium">{cameraError} {cameraErrorType === 'permission' && 'Enable camera in browser settings.'}</p>
                        </div>
                        <button
                            onClick={handleRetryCamera}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-full font-bold transition-all shadow-md text-sm"
                        >
                            Retry Camera
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => { startCameraSession(); }}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-full font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                    >
                        Start Camera
                    </button>
                )}

                {/* Upload fallback — always visible but subtle */}
                {!selfie && (
                    <div className="text-center">
                        <label className="text-xs text-gray-400 hover:text-blue-500 transition cursor-pointer font-medium underline underline-offset-4 decoration-gray-300 hover:decoration-blue-400">
                            Upload a photo instead
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/heic"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </label>
                    </div>
                )}
            </div>

            {/* Submit */}
            <div className="flex gap-3">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold text-base hover:bg-gray-200 transition"
                    >
                        Back
                    </button>
                )}
                <button
                    onClick={handleSubmit}
                    disabled={loading || !selfie}
                    className={`${onBack ? 'flex-1' : 'w-full'} py-4 rounded-xl font-bold text-base transition shadow-lg ${loading || !selfie
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
                        'Submit'
                    )}
                </button>
            </div>
        </div>
    );
}
