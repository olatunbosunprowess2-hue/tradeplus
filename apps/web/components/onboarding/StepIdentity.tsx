'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'react-hot-toast';
import { Camera, Check, RefreshCw, Upload, AlertCircle, Loader2, Sparkles, Scan } from 'lucide-react';

interface StepProps {
  onComplete: () => void;
  onBack?: () => void;
}

type FaceStatus = 'NO_FACE' | 'OFF_CENTER' | 'ALIGNED';

export default function StepIdentity({ onComplete, onBack }: StepProps) {
  const { updateProfile } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [selfie, setSelfie] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraInitializing, setCameraInitializing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Real-time Face Tracking State
  const [faceStatus, setFaceStatus] = useState<FaceStatus>('NO_FACE');
  const [faceBox, setFaceBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Stop all camera tracks
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
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

  // ============================================================
  // REAL-TIME FACE TRACKING LOOP
  // ============================================================
  useEffect(() => {
    if (!cameraReady || !videoRef.current) return;

    let detector: any = null;
    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
      try {
        detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      } catch (e) {
        console.warn('Native FaceDetector initialization failed, using CV scanner fallback:', e);
      }
    }

    let isScanning = true;
    let lastScanTime = 0;

    const trackFace = async (timestamp: number) => {
      if (!isScanning) return;

      const video = videoRef.current;
      const overlayCanvas = overlayCanvasRef.current;

      if (video && video.readyState >= 2 && overlayCanvas) {
        // Run detection every ~60ms for smooth 15-20fps tracking
        if (timestamp - lastScanTime > 60) {
          lastScanTime = timestamp;

          const videoW = video.videoWidth || 640;
          const videoH = video.videoHeight || 480;

          if (overlayCanvas.width !== videoW || overlayCanvas.height !== videoH) {
            overlayCanvas.width = videoW;
            overlayCanvas.height = videoH;
          }

          const ctx = overlayCanvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, videoW, videoH);

            let detectedBox: { x: number; y: number; width: number; height: number } | null = null;
            let currentStatus: FaceStatus = 'NO_FACE';

            // Method 1: Hardware-Accelerated Native FaceDetector API
            if (detector) {
              try {
                const faces = await detector.detect(video);
                if (faces && faces.length > 0) {
                  const b = faces[0].boundingBox;
                  detectedBox = {
                    x: b.x,
                    y: b.y,
                    width: b.width,
                    height: b.height,
                  };
                }
              } catch (err) {
                // Fallback to Method 2 if detector errors
              }
            }

            // Method 2: High-Speed Computer-Vision Luminance & Edge Scanner Fallback
            if (!detectedBox) {
              // Analyze center region of interest (ROI)
              const tempCanvas = canvasRef.current;
              if (tempCanvas) {
                const scanW = 64;
                const scanH = 48;
                tempCanvas.width = scanW;
                tempCanvas.height = scanH;
                const tCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

                if (tCtx) {
                  tCtx.drawImage(video, 0, 0, scanW, scanH);
                  const imgData = tCtx.getImageData(0, 0, scanW, scanH).data;

                  let skinPixels = 0;
                  let centerSkinPixels = 0;
                  let sumX = 0;
                  let sumY = 0;

                  for (let y = 0; y < scanH; y++) {
                    for (let x = 0; x < scanW; x++) {
                      const idx = (y * scanW + x) * 4;
                      const r = imgData[idx];
                      const g = imgData[idx + 1];
                      const b = imgData[idx + 2];

                      // Skin-tone / facial luminance heuristic (RGB + YCbCr normalized space)
                      const isSkin =
                        r > 60 &&
                        g > 40 &&
                        b > 20 &&
                        r > g &&
                        r > b &&
                        Math.abs(r - g) > 10 &&
                        r - b > 15;

                      if (isSkin) {
                        skinPixels++;
                        sumX += x;
                        sumY += y;

                        // Check if within center 50%
                        if (x > scanW * 0.25 && x < scanW * 0.75 && y > scanH * 0.15 && y < scanH * 0.85) {
                          centerSkinPixels++;
                        }
                      }
                    }
                  }

                  const totalPixels = scanW * scanH;
                  const skinRatio = skinPixels / totalPixels;

                  if (skinRatio > 0.08 && skinPixels > 50) {
                    const avgX = (sumX / skinPixels) / scanW * videoW;
                    const avgY = (sumY / skinPixels) / scanH * videoH;
                    const estSize = Math.min(videoW, videoH) * Math.sqrt(skinRatio * 2.5);

                    detectedBox = {
                      x: Math.max(0, avgX - estSize / 2),
                      y: Math.max(0, avgY - estSize / 2),
                      width: Math.min(videoW, estSize),
                      height: Math.min(videoH, estSize * 1.25),
                    };
                  }
                }
              }
            }

            // Evaluate Alignment Status
            if (detectedBox) {
              const faceCenterX = detectedBox.x + detectedBox.width / 2;
              const faceCenterY = detectedBox.y + detectedBox.height / 2;
              const targetCenterX = videoW / 2;
              const targetCenterY = videoH / 2;

              const distX = Math.abs(faceCenterX - targetCenterX) / videoW;
              const distY = Math.abs(faceCenterY - targetCenterY) / videoH;
              const sizeRatio = detectedBox.width / videoW;

              // Check if centered and good scale
              if (distX < 0.18 && distY < 0.22 && sizeRatio > 0.2 && sizeRatio < 0.75) {
                currentStatus = 'ALIGNED';
              } else {
                currentStatus = 'OFF_CENTER';
              }

              // Draw Live Corner Tracking Brackets on Overlay
              const bx = detectedBox.x;
              const by = detectedBox.y;
              const bw = detectedBox.width;
              const bh = detectedBox.height;
              const bracketLen = Math.min(24, bw * 0.2);

              ctx.strokeStyle = currentStatus === 'ALIGNED' ? '#10B981' : '#F59E0B';
              ctx.lineWidth = 3;
              ctx.lineCap = 'round';

              // Top-Left
              ctx.beginPath();
              ctx.moveTo(bx, by + bracketLen);
              ctx.lineTo(bx, by);
              ctx.lineTo(bx + bracketLen, by);
              ctx.stroke();

              // Top-Right
              ctx.beginPath();
              ctx.moveTo(bx + bw - bracketLen, by);
              ctx.lineTo(bx + bw, by);
              ctx.lineTo(bx + bw, by + bracketLen);
              ctx.stroke();

              // Bottom-Left
              ctx.beginPath();
              ctx.moveTo(bx, by + bh - bracketLen);
              ctx.lineTo(bx, by + bh);
              ctx.lineTo(bx + bracketLen, by + bh);
              ctx.stroke();

              // Bottom-Right
              ctx.beginPath();
              ctx.moveTo(bx + bw - bracketLen, by + bh);
              ctx.lineTo(bx + bw, by + bh);
              ctx.lineTo(bx + bw, by + bh - bracketLen);
              ctx.stroke();
            } else {
              currentStatus = 'NO_FACE';
            }

            setFaceStatus(currentStatus);
            setFaceBox(detectedBox);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(trackFace);
    };

    animFrameRef.current = requestAnimationFrame(trackFace);

    return () => {
      isScanning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [cameraReady]);

  // Capture photo from video stream
  const captureSelfie = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraReady) {
      toast.error('Camera not ready.');
      return;
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
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
    setFaceStatus('NO_FACE');
    setFaceBox(null);
    startCamera();
  };

  return (
    <div className="space-y-5 relative">
      <canvas ref={canvasRef} className="hidden" />

      <div className="text-center mb-3">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Take a Live Photo</h2>
        <p className="text-xs text-slate-500 mt-1">
          Position your face within the frame in good lighting.
        </p>
      </div>

      {/* Camera / Preview Viewport */}
      <div className="space-y-3">
        <div className="relative w-full h-72 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center border border-slate-300 shadow-inner">
          {selfie ? (
            <>
              <img
                src={selfie}
                alt="Selfie"
                className="w-full h-full object-contain bg-slate-950"
              />
              <div className="absolute top-3 right-3 bg-emerald-600 text-white px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Photo Captured</span>
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
                <div className="absolute inset-0 z-20 bg-slate-950 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-slate-300 text-xs font-semibold">Starting camera &amp; tracker...</p>
                </div>
              )}

              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />

              {/* Real-time Tracking Canvas Overlay */}
              <canvas
                ref={overlayCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                style={{ transform: 'scaleX(-1)' }}
              />

              {/* Live Guidance Status Badge */}
              {cameraReady && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                  {faceStatus === 'ALIGNED' ? (
                    <div className="bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-md shadow-md flex items-center gap-1.5 animate-pulse">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Face Detected &bull; Hold Still</span>
                    </div>
                  ) : faceStatus === 'OFF_CENTER' ? (
                    <div className="bg-amber-500 text-slate-950 text-[11px] font-bold px-3 py-1 rounded-md shadow-md flex items-center gap-1.5">
                      <Scan className="w-3.5 h-3.5 text-slate-950" />
                      <span>Center your face in the oval</span>
                    </div>
                  ) : (
                    <div className="bg-slate-900/80 backdrop-blur-xs text-slate-200 text-[11px] font-medium px-3 py-1 rounded-md border border-white/10 shadow-sm flex items-center gap-1.5">
                      <Scan className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                      <span>Move face into frame</span>
                    </div>
                  )}
                </div>
              )}

              {/* Centered Guide Oval with Dynamic Reactive Colors */}
              {cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div
                    className={`w-40 h-52 rounded-[45%] transition-all duration-300 ${
                      faceStatus === 'ALIGNED'
                        ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/30 scale-102'
                        : faceStatus === 'OFF_CENTER'
                        ? 'border-2 border-amber-400 ring-2 ring-amber-400/20'
                        : 'border-2 border-dashed border-white/40'
                    }`}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Controls */}
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
            className={`w-full py-2.5 rounded-md font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 ${
              !cameraReady
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : faceStatus === 'ALIGNED'
                ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white ring-2 ring-emerald-400/40'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>
              {!cameraReady
                ? 'Starting camera...'
                : faceStatus === 'ALIGNED'
                ? 'Capture Photo (Ready)'
                : 'Take Photo'}
            </span>
          </button>
        )}

        {/* Fallback Option */}
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
