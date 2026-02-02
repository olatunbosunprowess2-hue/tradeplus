'use client';

import { useState, useRef, useCallback } from 'react';
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
    const [idFront, setIdFront] = useState<File | null>(null);
    const [idBack, setIdBack] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [documentType, setDocumentType] = useState<string>('government_id');
    const [showCamera, setShowCamera] = useState(false);
    const [showCameraModal, setShowCameraModal] = useState(false);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
        if (e.target.files && e.target.files[0]) {
            if (side === 'front') setIdFront(e.target.files[0]);
            else setIdBack(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!selfie || !idFront || !idBack) {
            toast.error('Please complete all steps');
            return;
        }

        // Prevent multiple submissions by setting loading immediately
        if (loading) return;
        setLoading(true);

        try {
            console.log('🚀 Starting verification submission...');

            const formData = new FormData();
            formData.append('idDocumentType', documentType);
            formData.append('verificationStatus', 'PENDING');
            formData.append('onboardingCompleted', 'true'); // Mark onboarding as complete

            console.log('📸 Converting selfie to blob...');
            // Convert selfie base64 to blob
            if (selfie) {
                const res = await fetch(selfie);
                const blob = await res.blob();
                formData.append('faceVerification', blob, 'selfie.jpg');
                console.log('✅ Selfie blob created:', blob.size, 'bytes');
            }

            if (idFront) {
                formData.append('idDocumentFront', idFront);
                console.log('✅ ID Front added:', idFront.name, idFront.size, 'bytes');
            }
            if (idBack) {
                formData.append('idDocumentBack', idBack);
                console.log('✅ ID Back added:', idBack.name, idBack.size, 'bytes');
            }

            console.log('📤 Sending FormData to backend...');
            // Update auth store with FormData
            await updateProfile(formData);

            console.log('✅ Verification submitted successfully!');
            toast.success('Verification submitted successfully!');
            // Success - onComplete will be called
            onComplete();
        } catch (error: any) {
            console.error('❌ Error processing files:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            const errorMessage = error.response?.data?.message || error.message || 'Failed to process files';
            toast.error(`Error: ${errorMessage}`);
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 relative">
            {/* Camera Permission Modal */}
            {showCameraModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl transform transition-all scale-100 animate-in zoom-in-95 duration-200">
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

            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Identity Verification</h2>
                <p className="text-gray-500">Final step! We need to verify it's really you.</p>
            </div>

            {/* 1. Selfie Section */}
            <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">1. Take a Selfie</h3>
                <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden flex items-center justify-center group">
                    {selfie ? (
                        <img src={selfie} alt="Selfie" className="w-full h-full object-cover" />
                    ) : showCamera ? (
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-700 transition">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-400 font-medium">Camera is off</p>
                        </div>
                    )}
                </div>
                {selfie ? (
                    <button
                        onClick={() => {
                            setSelfie(null);
                            setShowCamera(true);
                        }}
                        className="w-full py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                        Retake Selfie
                    </button>
                ) : showCamera ? (
                    <button
                        onClick={captureSelfie}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                    >
                        Capture Photo
                    </button>
                ) : (
                    <button
                        onClick={handleStartCamera}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                    >
                        Start Camera
                    </button>
                )}
            </div>

            {/* 2. ID Upload Section */}
            <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">2. Upload ID Document</h3>

                {/* Document Type Selection */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                        { id: 'government_id', label: '(NIN or BVN) Government ID' },
                        { id: 'student_id', label: 'Student ID' },
                        { id: 'passport', label: 'Passport' },
                        { id: 'drivers_license', label: 'Driver\'s License' },
                    ].map((type) => (
                        <button
                            key={type.id}
                            onClick={() => setDocumentType(type.id)}
                            className={`px-3 py-2 text-sm border rounded-lg transition font-medium ${documentType === type.id
                                ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500'
                                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mb-2">Select the type of document you are uploading.</p>

                <div className="grid grid-cols-2 gap-4">
                    {/* Front */}
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition cursor-pointer relative group">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'front')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="space-y-2 flex flex-col items-center justify-center h-40">
                            {idFront ? (
                                <>
                                    <span className="text-4xl">✅</span>
                                    <p className="text-sm font-medium text-green-600">Front Uploaded</p>
                                    <p className="text-xs text-gray-400">{idFront.name}</p>
                                </>
                            ) : (
                                <>
                                    {/* Skeleton ID Card */}
                                    <div className="w-24 h-16 border-2 border-gray-200 rounded bg-gray-50 mb-2 relative overflow-hidden">
                                        <div className="absolute top-2 left-2 w-6 h-6 bg-gray-200 rounded-full"></div>
                                        <div className="absolute top-3 left-10 w-10 h-2 bg-gray-200 rounded"></div>
                                        <div className="absolute top-6 left-10 w-8 h-2 bg-gray-200 rounded"></div>
                                        <div className="absolute top-9 left-2 w-16 h-2 bg-gray-200 rounded"></div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition">Upload Front Side</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Back */}
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition cursor-pointer relative group">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'back')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="space-y-2 flex flex-col items-center justify-center h-40">
                            {idBack ? (
                                <>
                                    <span className="text-4xl">✅</span>
                                    <p className="text-sm font-medium text-green-600">Back Uploaded</p>
                                    <p className="text-xs text-gray-400">{idBack.name}</p>
                                </>
                            ) : (
                                <>
                                    {/* Skeleton ID Card Back */}
                                    <div className="w-24 h-16 border-2 border-gray-200 rounded bg-gray-50 mb-2 relative overflow-hidden">
                                        <div className="absolute top-2 left-0 w-full h-3 bg-gray-200"></div>
                                        <div className="absolute top-8 left-2 w-20 h-2 bg-gray-200 rounded"></div>
                                        <div className="absolute top-11 left-2 w-16 h-2 bg-gray-200 rounded"></div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition">Upload Back Side</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 mt-8">
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
                    disabled={loading || !selfie || !idFront || !idBack}
                    className={`${onBack ? 'flex-1' : 'w-full'} py-4 rounded-xl font-bold text-lg transition shadow-lg ${loading || !selfie || !idFront || !idBack
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                >
                    {loading ? 'Submitting for Review...' : 'Submit Verification'}
                </button>
            </div>
        </div>
    );
}
