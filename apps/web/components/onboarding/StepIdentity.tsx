'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'react-hot-toast';
import { Camera, Check, RefreshCw, Upload, AlertCircle, Loader2 } from 'lucide-react';

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
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start camera with progressive fallback
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);
    setCameraInitializing(true);
    stopCamera();

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setCameraError('Camera requires a secure HTTPS connection. Please upload a photo instead.');
      setCameraInitializing(false);
      return;
    }

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraError('Camera is not supported in this browser. Please upload a photo instead.');
      setCameraInitializing(false);
      return;
    }

    const constraintsList = [
      {
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      },
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
          await new Promise<void>((resolve, reject) => {
            const video = videoRef.current!;
            const timeout = setTimeout(() => reject(new Error('Video feed timeout')), 8000);

            const onPlaying = () => {
              clearTimeout(timeout);
              video.removeEventListener('playing', onPlaying);
              resolve();
            };
            video.addEventListener('playing', onPlaying);

            video.play().catch((err) => {
              clearTimeout(timeout);
              reject(err);
            });
          });
        }

        setCameraReady(true);
        setCameraInitializing(false);
        return;
      } catch (err: any) {
        console.warn(`Camera constraint ${i} failed:`, err.name, err.message);

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError(
            'Camera permission denied. Please allow access in your browser or upload a photo.'
          );
          setCameraInitializing(false);
          return;
        }

        if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraError('No camera found on this device. Please upload a photo instead.');
          setCameraInitializing(false);
          return;
        }

        if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setCameraError('Camera is currently in use by another app.');
          setCameraInitializing(false);
          return;
        }

        if (i === constraintsList.length - 1) {
          setCameraError('Could not initialize camera. Please upload a photo instead.');
          setCameraInitializing(false);
          return;
        }
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

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

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setSelfie(dataUrl);
    setSelfieFile(null);
    stopCamera();
  }, [cameraReady, stopCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !file.type.startsWith('image/') &&
      !file.name.match(/\.(jpg|jpeg|png|webp|heic|heif)$/i)
    ) {
      toast.error('Please upload a valid image file.');
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

  const handleRetake = () => {
    setSelfie(null);
    setSelfieFile(null);
    setCameraError(null);
    startCamera();
  };

  return (
    <div className="space-y-5 relative">
      <canvas ref={canvasRef} className="hidden" />

      <div className="text-center mb-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Take a Live Photo</h2>
        <p className="text-xs text-slate-500 mt-1">
          A clear, front-facing selfie in good lighting to verify your identity.
        </p>
      </div>

      {/* Camera / Preview Box */}
      <div className="space-y-3">
        <div className="relative w-full h-64 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-300 shadow-inner">
          {selfie ? (
            <>
              <img
                src={selfie}
                alt="Selfie"
                className="w-full h-full object-contain bg-slate-950"
              />
              <div className="absolute top-3 right-3 bg-emerald-600 text-white px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Photo Ready</span>
              </div>
            </>
          ) : cameraError ? (
            <div className="text-center p-6 w-full">
              <div className="w-12 h-12 bg-rose-950/60 border border-rose-800/80 rounded-lg flex items-center justify-center mx-auto mb-3 text-rose-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-rose-300 font-semibold text-xs leading-relaxed max-w-xs mx-auto">
                {cameraError}
              </p>
            </div>
          ) : (
            <>
              {cameraInitializing && (
                <div className="absolute inset-0 z-10 bg-slate-900 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-slate-300 text-xs font-semibold">Starting camera...</p>
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
              {cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-36 h-48 border-2 border-white/40 rounded-[45%]" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Capture / Retake Controls */}
        {selfie ? (
          <button
            onClick={handleRetake}
            type="button"
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-md border border-slate-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retake Photo</span>
          </button>
        ) : cameraError ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => startCamera()}
              type="button"
              className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-xs transition-colors"
            >
              Retry Camera
            </button>
            <label className="py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md font-bold text-xs transition-colors shadow-xs flex items-center justify-center cursor-pointer gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Photo</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                capture="user"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        ) : (
          <button
            onClick={captureSelfie}
            type="button"
            disabled={!cameraReady}
            className={`w-full py-2.5 rounded-md font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 ${
              cameraReady
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{cameraReady ? 'Take Photo' : 'Waiting for camera...'}</span>
          </button>
        )}

        {/* Upload Fallback Link */}
        {!selfie && (
          <div className="text-center pt-1">
            <label className="text-xs text-slate-500 hover:text-blue-600 transition cursor-pointer font-medium hover:underline">
              Upload a photo from your gallery instead
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

      {/* Navigation Footer */}
      <div className="flex gap-3 pt-3">
        {onBack && (
          <button
            onClick={onBack}
            type="button"
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-md font-bold text-xs transition-colors"
          >
            Back
          </button>
        )}
        <button
          onClick={handleSubmit}
          type="button"
          disabled={loading || !selfie}
          className={`flex-1 py-2.5 rounded-md font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 ${
            loading || !selfie
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <span>Submit Verification</span>
          )}
        </button>
      </div>
    </div>
  );
}
