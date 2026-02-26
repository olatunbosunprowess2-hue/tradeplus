'use client';

import { useState, useRef } from 'react';
import apiClient from '@/lib/api-client';
import imageCompression from 'browser-image-compression';

interface ImageUploadProps {
    onUploadComplete: (url: string) => void;
    maxFiles?: number;
}

export default function ImageUpload({ onUploadComplete, maxFiles = 3 }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];

        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (!isImage && !isVideo) {
            setError('Please select an image or video file');
            return;
        }

        if (isVideo && file.size > 50 * 1024 * 1024) {
            alert('Video size must not exceed 50MB');
            setError('Video must be less than 50MB');
            return;
        }

        if (isImage && file.size > 10 * 1024 * 1024) {
            setError('Initial image must be less than 10MB before compression');
            return;
        }

        setError('');
        setIsUploading(true);

        try {
            let fileToUpload = file;
            if (isImage) {
                const options = {
                    maxSizeMB: 0.5,
                    maxWidthOrHeight: 1080,
                    useWebWorker: true,
                    initialQuality: 0.7,
                };
                fileToUpload = await imageCompression(file, options);
            }

            const formData = new FormData();
            formData.append('file', fileToUpload);

            const response = await apiClient.post('/uploads/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            onUploadComplete(response.data.url);
        } catch (err: any) {
            console.error('Upload failed:', err);
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div>
            <label className="group block w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all">
                {isUploading ? (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                        <span className="text-sm text-gray-600">Uploading...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <svg className="w-10 h-10 text-gray-400 group-hover:text-blue-500 mb-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Click to upload media</span>
                        <span className="text-xs text-gray-500 mt-1">Images (auto-compressed), Video (max 50MB)</span>
                    </div>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                />
            </label>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
    );
}
