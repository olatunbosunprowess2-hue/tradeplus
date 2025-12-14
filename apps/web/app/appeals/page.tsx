'use client';

import { useState, useEffect } from 'react';
import { appealsApi } from '@/lib/appeals-api';
import { useToastStore } from '@/lib/toast-store';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';

export default function AppealsPage() {
    const [appeals, setAppeals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const { addToast } = useToastStore();
    const router = useRouter();

    const [formData, setFormData] = useState({
        reason: '',
        message: '',
        evidenceImages: [] as string[]
    });

    const fetchAppeals = async () => {
        try {
            const response = await appealsApi.getAppeals();
            setAppeals(response.data);
        } catch (error) {
            console.error('Failed to fetch appeals:', error);
            addToast('error', 'Failed to load appeals');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.reason || !formData.message) {
            addToast('error', 'Please fill in all required fields');
            return;
        }

        try {
            await appealsApi.submitAppeal(formData);
            addToast('success', 'Appeal submitted successfully');
            setShowForm(false);
            setFormData({ reason: '', message: '', evidenceImages: [] });
            fetchAppeals();
        } catch (error) {
            console.error('Failed to submit appeal:', error);
            addToast('error', 'Failed to submit appeal');
        }
    };

    useEffect(() => {
        fetchAppeals();
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">My Appeals</h1>
                {!showform && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                        Submit New Appeal
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Submit an Appeal</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason for Appeal *
                            </label>
                            <input
                                type="text"
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                placeholder="e.g., Wrongful suspension, Mistaken report"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Detailed Explanation *
                            </label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                placeholder="Please explain why you believe this action was incorrect..."
                                rows={6}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Supporting Evidence (Optional)
                            </label>
                            <ImageUpload
                                onUploadComplete={(url) => setFormData({ ...formData, evidenceImages: [...formData.evidenceImages, url] })}
                                maxFiles={3}
                            />
                            {formData.evidenceImages.length > 0 && (
                                <div className="mt-2 flex gap-2 flex-wrap">
                                    {formData.evidenceImages.map((url, index) => (
                                        <div key={index} className="relative">
                                            <img src={url} alt={`Evidence ${index + 1}`} className="w-20 h-20 object-cover rounded" />
                                            <button
                                                type="button"
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    evidenceImages: formData.evidenceImages.filter((_, i) => i !== index)
                                                })}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setFormData({ reason: '', message: '', evidenceImages: [] });
                                }}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                            >
                                Submit Appeal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Appeals List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                ) : appeals.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                        <p className="text-gray-500">No appeals found</p>
                    </div>
                ) : (
                    appeals.map((appeal) => (
                        <div key={appeal.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{appeal.reason}</h3>
                                    <p className="text-sm text-gray-500">
                                        Submitted {new Date(appeal.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full  text-xs font-bold ${appeal.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        appeal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {appeal.status}
                                </span>
                            </div>

                            <p className="text-gray-700 mb-4">{appeal.message}</p>

                            {appeal.adminMessage && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                                    <p className="text-sm font-medium text-blue-900 mb-1">Admin Response:</p>
                                    <p className="text-blue-800">{appeal.adminMessage}</p>
                                </div>
                            )}

                            {appeal.evidenceImages && appeal.evidenceImages.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Evidence:</p>
                                    <div className="flex gap-2">
                                        {appeal.evidenceImages.map((url: string, index: number) => (
                                            <img key={index} src={url} alt={`Evidence ${index + 1}`} className="w-24 h-24 object-cover rounded" />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
