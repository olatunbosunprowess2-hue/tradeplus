'use client';

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'react-hot-toast';

interface StepProps {
    onComplete: () => void;
}

export default function StepIdentity({ onComplete }: StepProps) {
    const { updateProfile } = useAuthStore();
    const webcamRef = useRef<Webcam>(null);
    const [selfie, setSelfie] = useState<string | null>(null);
    const [idFront, setIdFront] = useState<File | null>(null);
    const [idBack, setIdBack] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const captureSelfie = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setSelfie(imageSrc);
        }
    }, [webcamRef]);

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

        setLoading(true);

        // Simulate upload delay
        setTimeout(() => {
            // In a real app, we would upload files to S3/Cloudinary here
            // For now, we just save the local object URLs or base64
            updateProfile({
                faceVerificationUrl: selfie,
                idDocumentFrontUrl: URL.createObjectURL(idFront),
                idDocumentBackUrl: URL.createObjectURL(idBack),
            });
            setLoading(false);
            onComplete();
        }, 2000);
    };

    return (
        <div className="space-y-8">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Identity Verification</h2>
                <p className="text-gray-500">Final step! We need to verify it's really you.</p>
            </div>

            {/* 1. Selfie Section */}
            <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">1. Take a Selfie</h3>
                <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden flex items-center justify-center">
                    {selfie ? (
                        <img src={selfie} alt="Selfie" className="w-full h-full object-cover" />
                    ) : (
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>
                {selfie ? (
                    <button
                        onClick={() => setSelfie(null)}
                        className="w-full py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                        Retake Selfie
                    </button>
                ) : (
                    <button
                        onClick={captureSelfie}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                    >
                        Capture Photo
                    </button>
                )}
            </div>

            {/* 2. ID Upload Section */}
            <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">2. Upload Government ID</h3>

                <div className="grid grid-cols-2 gap-4">
                    {/* Front */}
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition cursor-pointer relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'front')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="space-y-2">
                            <span className="text-2xl">🪪</span>
                            <p className="text-sm font-medium text-gray-600">
                                {idFront ? 'Front Uploaded ✅' : 'Upload Front'}
                            </p>
                        </div>
                    </div>

                    {/* Back */}
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition cursor-pointer relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'back')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="space-y-2">
                            <span className="text-2xl">🔄</span>
                            <p className="text-sm font-medium text-gray-600">
                                {idBack ? 'Back Uploaded ✅' : 'Upload Back'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading || !selfie || !idFront || !idBack}
                className={`w-full py-4 rounded-xl font-bold text-lg transition shadow-lg mt-8 ${loading || !selfie || !idFront || !idBack
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
            >
                {loading ? 'Submitting for Review...' : 'Submit Verification'}
            </button>
        </div>
    );
}
