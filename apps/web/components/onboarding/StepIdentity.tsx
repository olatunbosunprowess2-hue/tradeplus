'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'react-hot-toast';

interface StepProps {
    onComplete: () => void;
    onBack?: () => void;
}

export default function StepIdentity({ onComplete, onBack }: StepProps) {
    const { updateProfile } = useAuthStore();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [selfie, setSelfie] = useState<string | null>(null);
    const [selfieFile, setSelfieFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraInitializing, setCameraInitializing] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    // Stop all camera tracks
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    // Start the camera with progressive constraint fallback
    const startCamera = useCallback(async () => {
        setCameraError(null);
        setCameraReady(false);
        setCameraInitializing(true);
        stopCamera();

        // Check if browser environment is not secure context (WebRTC requires HTTPS or localhost)
        if (typeof window !== 'undefined' && !window.isSecureContext) {
            setCameraError('Camera access requires a secure connection (HTTPS). Please switch to HTTPS or take a photo instead.');
            setCameraInitializing(false);
            return;
        }

        // Check if mediaDevices is supported at all
        if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraError('Camera API is not supported in this browser. Please take a photo instead.');
            setCameraInitializing(false);
            return;
        }

        // Ordered list of constraints to try — from ideal to most permissive
        const constraintsList = [
            { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
            { video: { facingMode: 'user' }, audio: false },
            { video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
            { video: true, audio: false },
        ];

        for (let i = 0; i < constraintsList.length; i++) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia(constraintsList[i]);
                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    // Wait for actual video frames to arrive
                    await new Promise<void>((resolve, reject) => {
                        const video = videoRef.current!;
                        const timeout = setTimeout(() => reject(new Error('Video feed timeout')), 8000);

                        const onPlaying = () => {
                            clearTimeout(timeout);
                            video.removeEventListener('playing', onPlaying);
                            resolve();
                        };
                        video.addEventListener('playing', onPlaying);

                        video.play().catch(err => {
                            clearTimeout(timeout);
                            reject(err);
                        });
                    });
                }

                setCameraReady(true);
                setCameraInitializing(false);
                return; // Success — exit the loop
            } catch (err: any) {
                console.warn(`Camera constraint set ${i} failed:`, err.name, err.message);

                // Permission denied — no point trying other constraints
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setCameraError('Camera permission denied. Please allow camera access in your browser settings, then tap Retry.');
                    setCameraInitializing(false);
                    return;
                }

                // No camera device at all
                if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    setCameraError('No camera found on this device.');
                    setCameraInitializing(false);
                    return;
                }

                // Camera in use by another app
                if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                    setCameraError('Camera is in use by another app. Close it and retry.');
                    setCameraInitializing(false);
                    return;
                }

                // For OverconstrainedError or other transient errors, try next constraint set
                if (i === constraintsList.length - 1) {
                    // All constraint sets failed
                    setCameraError('Could not start camera. Please upload a photo instead.');
                    setCameraInitializing(false);
                    return;
                }
                // Otherwise continue to next constraint set
            }
        }
    }, [stopCamera]);

    // Auto-start on mount, cleanup on unmount
    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [startCamera, stopCamera]);

    // Capture photo from video stream
    const captureSelfie = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !cameraReady) {
            toast.error('Camera not ready.');
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Mirror horizontally (selfie mode)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setSelfie(dataUrl);
        setSelfieFile(null);
        stopCamera();
    }, [cameraReady, stopCamera]);

    // Handle file upload from gallery
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/') && !file.name.match(/\.(jpg|jpeg|png|webp|heic|heif)$/i)) {
            toast.error('Please upload a valid image.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image too large. Max 10MB.');
            return;
        }

        setSelfieFile(file);
        stopCamera();

        const reader = new FileReader();
        reader.onloadend = () => setSelfie(reader.result as string);
        reader.readAsDataURL(file);
    };

    // Submit verification
    const handleSubmit = async () => {
        if (!selfie || loading) return;
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('verificationStatus', 'PENDING');
            formData.append('onboardingCompleted', 'true');

            if (selfieFile) {
                formData.append('faceVerification', selfieFile, selfieFile.name);
            } else {
                // Convert base64 data URL to blob
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
            toast.error(error.response?.data?.message || error.message || 'Submission failed.');
        } finally {
            setLoading(false);
        }
    };

    // Retake — restart camera
    const handleRetake = () => {
        setSelfie(null);
        setSelfieFile(null);
        setCameraError(null);
        startCamera();
    };

    return (
        <div className="space-y-4 relative">
            {/* Hidden canvas for capturing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Header */}
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">Take a selfie</h2>
                <p className="text-gray-500 text-sm mt-0.5">Clear, front-facing, good lighting.</p>
            </div>

            {/* Camera / Preview Area */}
            <div className="space-y-3">
                <div className="relative w-full h-72 bg-black rounded-2xl overflow-hidden flex items-center justify-center shadow-lg">
                    {selfie ? (
                        /* Captured / uploaded preview */
                        <>
                            <img src={selfie} alt="Selfie" className="w-full h-full object-contain bg-slate-950" />
                            <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                Captured
                            </div>
                        </>
                    ) : cameraError ? (
                        /* Error state */
                        <div className="text-center p-6 w-full">
                            <div className="w-16 h-16 bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            </div>
                            <p className="text-red-400 font-medium text-sm">{cameraError}</p>
                        </div>
                    ) : (
                        /* Live camera feed */
                        <>
                            {cameraInitializing && (
                                <div className="absolute inset-0 z-10 bg-black flex flex-col items-center justify-center space-y-3">
                                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-gray-400 text-sm font-semibold">Starting camera...</p>
                                    <p className="text-gray-500 text-xs">Allow camera access if prompted.</p>
                                </div>
                            )}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                                style={{ transform: 'scaleX(-1)' }}
                            />
                            {/* Face alignment oval */}
                            {cameraReady && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-40 h-52 border-2 border-white/30 rounded-[50%]" />
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Controls */}
                {selfie ? (
                    <button
                        onClick={handleRetake}
                        className="w-full py-3 border-2 border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retake
                    </button>
                ) : cameraError ? (
                    <div className="space-y-3">
                        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-3">
                            <svg className="w-4.5 h-4.5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-xs text-red-800 font-semibold">Camera Access Restricted</p>
                                <p className="text-[11px] text-red-700 mt-0.5 leading-relaxed">{cameraError}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => startCamera()}
                                className="py-3 bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.98] text-gray-700 rounded-xl font-bold transition-all shadow-sm text-sm"
                            >
                                Retry Camera
                            </button>
                            <label className="py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl font-bold transition-all shadow-md text-sm flex items-center justify-center cursor-pointer gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Take / Upload
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/heic"
                                    capture="user"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </label>
                        </div>
                    </div>
                ) : (
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
                )}

                {/* Upload fallback */}
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
