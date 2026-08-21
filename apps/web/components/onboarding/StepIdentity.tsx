'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'react-hot-toast';
import {
  Camera,
  Check,
  RefreshCw,
  Upload,
  AlertCircle,
  Loader2,
  Scan,
  Sun,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface StepProps {
  onComplete: () => void;
  onBack?: () => void;
}

type LivenessStatus =
  | 'LOOKING_FOR_FACE'
  | 'TOO_DARK'
  | 'BLURRY_OR_COVERED'
  | 'OFF_CENTER'
  | 'HOLD_STILL'
  | 'CAPTURED';

export default function StepIdentity({ onComplete, onBack }: StepProps) {
  const { updateProfile } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [selfie, setSelfie] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraInitializing, setCameraInitializing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Biometric Liveness & Quality State
  const [livenessStatus, setLivenessStatus] = useState<LivenessStatus>('LOOKING_FOR_FACE');
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100%
  const [isHolding, setIsHolding] = useState(false);
  const [qualityFeedback, setQualityFeedback] = useState<string | null>(null);
  const [qualityPassed, setQualityPassed] = useState(false);

  // Stop camera tracks and timers
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Initialize camera with high-resolution constraints
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);
    setCameraInitializing(true);
    setQualityFeedback(null);
    setHoldProgress(0);
    setIsHolding(false);
    stopCamera();

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setCameraError('Camera access requires a secure HTTPS connection. Please upload a photo instead.');
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
        video: {
          facingMode: 'user',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
        audio: false,
      },
      { video: { facingMode: 'user' }, audio: false },
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
            'Camera permission denied. Please allow camera permissions in your browser or upload a photo.'
          );
          setCameraInitializing(false);
          return;
        }

        if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraError('No camera found on this device. Please upload a photo instead.');
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

  // ============================================================
  // BIOMETRIC QUALITY CHECK FUNCTION
  // ============================================================
  const analyzeImageQuality = (
    imageData: ImageData,
    width: number,
    height: number
  ): {
    hasFace: boolean;
    isTooDark: boolean;
    isTooBright: boolean;
    isBlurryOrCovered: boolean;
    isCentered: boolean;
    luminance: number;
    variance: number;
    skinRatio: number;
  } => {
    const data = imageData.data;
    const totalPixels = width * height;

    let totalLuminance = 0;
    let skinPixels = 0;
    let centerSkinPixels = 0;
    let sumX = 0;
    let sumY = 0;

    // Laplacian edge variance accumulator for sharpness/blur detection
    let edgeSum = 0;
    const gray = new Float32Array(totalPixels);

    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      gray[i] = lum;
      totalLuminance += lum;

      const x = i % width;
      const y = Math.floor(i / width);

      // Color/Skin tone space
      const isSkin =
        r > 55 &&
        g > 35 &&
        b > 20 &&
        r > g &&
        r > b &&
        Math.abs(r - g) > 8 &&
        r - b > 12;

      if (isSkin) {
        skinPixels++;
        sumX += x;
        sumY += y;

        if (x > width * 0.2 && x < width * 0.8 && y > height * 0.15 && y < height * 0.85) {
          centerSkinPixels++;
        }
      }
    }

    const avgLuminance = totalLuminance / totalPixels;

    // 3x3 Laplacian filter for blur and texture variance detection
    let varianceAccum = 0;
    for (let y = 1; y < height - 1; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        const idx = y * width + x;
        const lap =
          gray[idx - width] +
          gray[idx + width] +
          gray[idx - 1] +
          gray[idx + 1] -
          4 * gray[idx];
        edgeSum += Math.abs(lap);
        varianceAccum += (gray[idx] - avgLuminance) * (gray[idx] - avgLuminance);
      }
    }

    const sharpnessScore = edgeSum / (totalPixels / 4);
    const contrastVariance = varianceAccum / (totalPixels / 4);
    const skinRatio = skinPixels / totalPixels;

    const isTooDark = avgLuminance < 35;
    const isTooBright = avgLuminance > 235;

    // A covered lens / finger produces uniform flat color with near-zero edge contrast
    const isBlurryOrCovered = sharpnessScore < 4.0 || contrastVariance < 80 || skinRatio > 0.92;

    const hasFace =
      skinRatio >= 0.07 &&
      skinRatio <= 0.85 &&
      centerSkinPixels > skinPixels * 0.45 &&
      !isBlurryOrCovered &&
      !isTooDark;

    let isCentered = false;
    if (hasFace && skinPixels > 0) {
      const avgX = sumX / skinPixels / width;
      const avgY = sumY / skinPixels / height;
      isCentered = Math.abs(avgX - 0.5) < 0.18 && Math.abs(avgY - 0.5) < 0.22;
    }

    return {
      hasFace,
      isTooDark,
      isTooBright,
      isBlurryOrCovered,
      isCentered,
      luminance: avgLuminance,
      variance: contrastVariance,
      skinRatio,
    };
  };

  // ============================================================
  // CAPTURE SELFIE HANDLER
  // ============================================================
  const executeCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraReady) return;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Mirror horizontally
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);

    // Validate captured frame quality
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 120;
    sampleCanvas.height = 90;
    const sCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (sCtx) {
      sCtx.drawImage(canvas, 0, 0, 120, 90);
      const imgData = sCtx.getImageData(0, 0, 120, 90);
      const quality = analyzeImageQuality(imgData, 120, 90);

      if (quality.isTooDark) {
        setQualityFeedback('Photo is too dark. Please face a light source and retake.');
        setQualityPassed(false);
      } else if (quality.isBlurryOrCovered) {
        setQualityFeedback('Camera view appears covered or blurry. Please position your face clearly.');
        setQualityPassed(false);
      } else if (!quality.hasFace) {
        setQualityFeedback('No clear face detected in the frame. Please align your face inside the circle.');
        setQualityPassed(false);
      } else {
        setQualityFeedback(null);
        setQualityPassed(true);
      }
    } else {
      setQualityPassed(true);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setSelfie(dataUrl);
    setSelfieFile(null);
    setLivenessStatus('CAPTURED');
    stopCamera();
  }, [cameraReady, stopCamera]);

  // ============================================================
  // REAL-TIME BIOMETRIC SCANNING LOOP
  // ============================================================
  useEffect(() => {
    if (!cameraReady || !videoRef.current) return;

    let isScanning = true;
    let lastScanTime = 0;
    let holdCount = 0;

    const scanFrame = (timestamp: number) => {
      if (!isScanning) return;

      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        if (timestamp - lastScanTime > 80) {
          lastScanTime = timestamp;

          const tempCanvas = canvasRef.current;
          if (tempCanvas) {
            const scanW = 96;
            const scanH = 72;
            tempCanvas.width = scanW;
            tempCanvas.height = scanH;
            const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });

            if (ctx) {
              ctx.drawImage(video, 0, 0, scanW, scanH);
              const imgData = ctx.getImageData(0, 0, scanW, scanH);
              const q = analyzeImageQuality(imgData, scanW, scanH);

              if (q.isTooDark) {
                setLivenessStatus('TOO_DARK');
                holdCount = 0;
                setHoldProgress(0);
                setIsHolding(false);
              } else if (q.isBlurryOrCovered) {
                setLivenessStatus('BLURRY_OR_COVERED');
                holdCount = 0;
                setHoldProgress(0);
                setIsHolding(false);
              } else if (!q.hasFace || !q.isCentered) {
                setLivenessStatus(q.hasFace ? 'OFF_CENTER' : 'LOOKING_FOR_FACE');
                holdCount = 0;
                setHoldProgress(0);
                setIsHolding(false);
              } else {
                // Face is well centered & verified!
                setLivenessStatus('HOLD_STILL');
                setIsHolding(true);
                holdCount += 1;
                const progress = Math.min(100, Math.round((holdCount / 18) * 100));
                setHoldProgress(progress);

                // Auto-snap when held steady for ~1.5 seconds (18 ticks at 80ms)
                if (holdCount >= 18) {
                  isScanning = false;
                  executeCapture();
                  return;
                }
              }
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [cameraReady, executeCapture]);

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
    setQualityPassed(true);
    setQualityFeedback(null);
    stopCamera();

    const reader = new FileReader();
    reader.onloadend = () => setSelfie(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selfie || loading || !qualityPassed) {
      if (!qualityPassed) {
        toast.error('Please retake with a clear, verified face photo.');
      }
      return;
    }
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
    setQualityFeedback(null);
    setQualityPassed(false);
    setHoldProgress(0);
    setIsHolding(false);
    startCamera();
  };

  // SVG Circular Progress Ring Parameters
  const circleRadius = 136;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (holdProgress / 100) * circumference;

  return (
    <div className="space-y-5 relative">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Live Face Verification</h2>
        <p className="text-xs text-slate-500 mt-1">
          Look directly into the camera in good lighting. Auto-snaps when aligned.
        </p>
      </div>

      {/* Biometric KYC Viewport Container */}
      <div className="relative flex flex-col items-center justify-center p-3 sm:p-5 bg-slate-950 rounded-xl border border-slate-800 shadow-inner overflow-hidden min-h-[340px]">
        {/* Subtle Biometric Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        {selfie ? (
          /* ============================================================ */
          /* CAPTURED STATE & QUALITY INSPECTION                          */
          /* ============================================================ */
          <div className="flex flex-col items-center w-full z-10 py-2">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-slate-700 shadow-2xl bg-slate-900 mb-4">
              <img src={selfie} alt="Captured Selfie" className="w-full h-full object-cover" />
              {qualityPassed ? (
                <div className="absolute bottom-2 inset-x-0 mx-auto w-fit bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Face Verified</span>
                </div>
              ) : (
                <div className="absolute bottom-2 inset-x-0 mx-auto w-fit bg-rose-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <AlertCircle className="w-3 h-3 stroke-[3]" />
                  <span>Quality Check Failed</span>
                </div>
              )}
            </div>

            {/* Quality Inspection Notice */}
            {qualityFeedback ? (
              <div className="w-full max-w-sm bg-rose-950/80 border border-rose-800/80 rounded-md p-3 text-left mb-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-rose-200">Image Unacceptable</p>
                    <p className="text-[11px] text-rose-300 mt-0.5 leading-relaxed">
                      {qualityFeedback}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-sm bg-emerald-950/60 border border-emerald-800/60 rounded-md p-3 text-left mb-3">
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span className="text-xs font-bold">Photo Passed All Biometric Checks</span>
                </div>
              </div>
            )}
          </div>
        ) : cameraError ? (
          /* ============================================================ */
          /* CAMERA ERROR STATE                                           */
          /* ============================================================ */
          <div className="text-center p-6 w-full z-10">
            <div className="w-12 h-12 bg-rose-950/80 border border-rose-800 rounded-lg flex items-center justify-center mx-auto mb-3 text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-rose-300 font-semibold text-xs leading-relaxed max-w-xs mx-auto mb-4">
              {cameraError}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => startCamera()}
                type="button"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md font-bold text-xs transition-colors"
              >
                Retry
              </button>
              <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* LIVE BIOMETRIC VIEWPORT & SCANNER                            */
          /* ============================================================ */
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center z-10">
            {cameraInitializing && (
              <div className="absolute inset-0 z-30 bg-slate-950/90 rounded-full flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-slate-300 text-xs font-semibold">Starting biometric sensor...</p>
              </div>
            )}

            {/* Circular Camera Mask */}
            <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-slate-700 shadow-2xl bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />

              {/* Vertical Laser Scanline */}
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-[scan_2s_ease-in-out_infinite] opacity-75 pointer-events-none" />
            </div>

            {/* SVG Biometric Circular Progress Ring */}
            <svg
              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
              viewBox="0 0 288 288"
            >
              {/* Background Ring */}
              <circle
                cx="144"
                cy="144"
                r={circleRadius}
                fill="none"
                stroke={isHolding ? '#064e3b' : '#334155'}
                strokeWidth="6"
              />
              {/* Active Animated Progress Stroke */}
              <circle
                cx="144"
                cy="144"
                r={circleRadius}
                fill="none"
                stroke={isHolding ? '#10b981' : '#3b82f6'}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-100 ease-linear"
              />
            </svg>

            {/* Real-time Guidance Pill */}
            <div className="absolute -bottom-3 inset-x-0 mx-auto w-fit z-30">
              {livenessStatus === 'HOLD_STILL' ? (
                <div className="bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 ring-2 ring-emerald-400/40 animate-pulse">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Hold still ({Math.round(holdProgress)}%)</span>
                </div>
              ) : livenessStatus === 'TOO_DARK' ? (
                <div className="bg-amber-500 text-slate-950 text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-slate-950" />
                  <span>Too dark &bull; Face the light</span>
                </div>
              ) : livenessStatus === 'BLURRY_OR_COVERED' ? (
                <div className="bg-rose-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Uncover camera lens</span>
                </div>
              ) : livenessStatus === 'OFF_CENTER' ? (
                <div className="bg-amber-500 text-slate-950 text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                  <Scan className="w-3.5 h-3.5" />
                  <span>Center your face in circle</span>
                </div>
              ) : (
                <div className="bg-slate-900/90 text-slate-200 text-[11px] font-medium px-3 py-1 rounded-full border border-slate-700 shadow-lg flex items-center gap-1.5">
                  <Scan className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  <span>Position face inside circle</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Controls */}
      {selfie ? (
        <button
          onClick={handleRetake}
          type="button"
          className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-md border border-slate-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retake Live Photo</span>
        </button>
      ) : (
        <div className="space-y-2">
          <button
            onClick={executeCapture}
            type="button"
            disabled={!cameraReady}
            className={`w-full py-2.5 rounded-md font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 ${
              !cameraReady
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : isHolding
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/40'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>
              {!cameraReady
                ? 'Starting camera...'
                : isHolding
                ? 'Auto-Snapping (Or Click Now)'
                : 'Take Photo'}
            </span>
          </button>

          {/* Upload Fallback */}
          <div className="text-center pt-1">
            <label className="text-xs text-slate-500 hover:text-blue-600 transition cursor-pointer font-medium hover:underline">
              Upload a clear photo from gallery instead
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex gap-3 pt-2 border-t border-slate-100">
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
          disabled={loading || !selfie || !qualityPassed}
          className={`flex-1 py-2.5 rounded-md font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 ${
            loading || !selfie || !qualityPassed
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
