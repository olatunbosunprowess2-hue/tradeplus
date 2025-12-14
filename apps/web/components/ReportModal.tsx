'use client';

import { useState } from 'react';
import apiClient from '@/lib/api-client';
import { useToastStore } from '@/lib/toast-store';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    listingId?: string;
    reportedUserId?: string;
}

export default function ReportModal({ isOpen, onClose, listingId, reportedUserId }: ReportModalProps) {
    const [reason, setReason] = useState('Spam');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const { addToast } = useToastStore();

    if (!isOpen) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        // Validate file size (Max 5MB)
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        const oversizedFiles = files.filter(file => file.size > MAX_SIZE);

        if (oversizedFiles.length > 0) {
            addToast('error', `Some images are too large. Max size is 5MB.`);
            return;
        }

        if (files.length + images.length > 3) {
            addToast('warning', 'You can only upload up to 3 images');
            return;
        }

        setImages([...images, ...files]);

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
        setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        console.log('=== Report Submission Started ===');
        console.log('Reason:', reason);
        console.log('Description:', description);
        console.log('ListingId:', listingId);
        console.log('ReportedUserId:', reportedUserId);
        console.log('Evidence Images Count:', imagePreviews.length);

        // Validate description
        if (!description.trim()) {
            console.log('ERROR: Description is empty');
            addToast('error', 'Please provide a description');
            return;
        }

        // Validate that we have at least a listing or user to report
        if (!listingId && !reportedUserId) {
            console.log('ERROR: No target specified (neither listingId nor reportedUserId)');
            addToast('error', 'Cannot submit report: No target specified. Please report from a listing or user profile.');
            return;
        }

        setLoading(true);
        console.log('Loading state set to true');

        try {
            const payload = {
                reason,
                description: description.trim(),
                listingId,
                reportedUserId,
                evidenceImages: imagePreviews,
            };

            console.log('Sending payload:', payload);

            const response = await apiClient.post('/reports', payload);

            console.log('SUCCESS! Response:', response.data);
            addToast('success', 'Report submitted successfully. Thank you for helping keep BarterWave safe!');

            // Reset form
            setReason('Spam');
            setDescription('');
            setImages([]);
            setImagePreviews([]);

            // Close modal after short delay
            setTimeout(() => {
                onClose();
            }, 500);

        } catch (error: any) {
            console.error('=== Report Submission Failed ===');
            console.error('Full error:', error);
            console.error('Error response:', error.response);
            console.error('Error status:', error.response?.status);
            console.error('Error data:', error.response?.data);

            // Provide specific error messages
            if (error.response?.status === 401) {
                addToast('error', 'Please log in to submit a report');
            } else if (error.response?.status === 400) {
                const errorMsg = error.response?.data?.message || 'Invalid report data. Please check your input.';
                console.error('400 Error message:', errorMsg);
                addToast('error', errorMsg);
            } else if (error.response?.status === 500) {
                addToast('error', 'Server error. Please try again later.');
            } else if (error.message) {
                console.error('Error message:', error.message);
                addToast('error', `Failed to submit report: ${error.message}`);
            } else {
                addToast('error', 'Failed to submit report. Please check your connection and try again.');
            }
        } finally {
            setLoading(false);
            console.log('Loading state set to false');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Report Issue</h3>
                <p className="text-gray-600 mb-4 text-sm">
                    Help us maintain quality by reporting incorrect or misleading information, spam, or fraud.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Reason</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-gray-900 font-medium bg-white transition-colors"
                        >
                            <option value="Spam">Spam</option>
                            <option value="Fraud">Fraud / Scam</option>
                            <option value="Inappropriate Content">Inappropriate Content</option>
                            <option value="Misleading Information">Misleading Information</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows={4}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 resize-none text-gray-900 font-medium placeholder:text-gray-400 bg-white transition-colors"
                            placeholder="Please provide more details about the issue..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Evidence (Optional)</label>
                        <div className="grid grid-cols-3 gap-2">
                            {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                                    <img src={preview} alt={`Evidence ${index + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition text-xs"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}

                            {images.length < 3 && (
                                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-600 hover:bg-blue-50 transition">
                                    <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="text-[10px] text-gray-500 font-medium">Add Photo</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        multiple
                                    />
                                </label>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Upload screenshots or photos as proof (max 3).</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
