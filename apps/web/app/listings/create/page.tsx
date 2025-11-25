'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import apiClient from '@/lib/api-client';
import { useListingsStore } from '@/lib/listings-store';

export default function CreateListingPage() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const { addListing } = useListingsStore();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'PHYSICAL' as 'PHYSICAL' | 'SERVICE',
        condition: 'used',
        categoryId: 1,
        priceCents: '',
        currency: 'NGN',
        paymentMethod: 'cash' as 'cash' | 'barter' | 'both',
        quantity: 1,
    });

    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showFreeConfirmation, setShowFreeConfirmation] = useState(false);

    // Service-based categories where condition, quantity, and images are optional
    // Also check if the user explicitly selected "Service" type
    const serviceCategories = [8, 9, 14]; // Services, Repair & Construction, Jobs
    const isServiceCategory = serviceCategories.includes(formData.categoryId) || formData.type === 'SERVICE';

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) {
        return null;
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + images.length > 3) {
            setError('You can only upload up to 3 images');
            return;
        }

        setImages([...images, ...files]);

        // Create previews
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

    const processSubmission = async () => {
        setError('');
        setLoading(true);
        setShowFreeConfirmation(false);

        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            const newListing: any = {
                id: Math.random().toString(36).substr(2, 9),
                title: formData.title,
                description: formData.description,
                type: formData.type,
                priceCents: formData.priceCents ? parseInt(formData.priceCents) * 100 : 0,
                originalPriceCents: 0,
                condition: formData.type === 'SERVICE' ? undefined : formData.condition,
                allowCash: formData.paymentMethod === 'cash' || formData.paymentMethod === 'both',
                allowBarter: formData.paymentMethod === 'barter' || formData.paymentMethod === 'both',
                allowCashPlusBarter: false, // Default for now
                shippingMeetInPerson: true, // Default
                shippingShipItem: formData.type === 'PHYSICAL', // Default
                images: imagePreviews.map((url, index) => ({
                    id: Math.random().toString(36).substr(2, 9),
                    url,
                    sortOrder: index
                })),
                sellerId: user?.id || 'current-user',
                seller: {
                    id: user?.id || 'current-user',
                    email: user?.email || 'user@example.com',
                    profile: {
                        displayName: user?.profile?.displayName || 'Me',
                        region: user?.profile?.region
                    }
                },
                quantity: formData.quantity,
                categoryId: formData.categoryId,
                category: { id: formData.categoryId, name: 'Category', slug: 'category' }, // Simplified
                currencyCode: formData.currency,
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            addListing(newListing);
            router.push('/listings');
        } catch (err: any) {
            setError(err.message || 'Failed to create listing');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check for free listing
        if (!formData.priceCents || parseInt(formData.priceCents) === 0) {
            if (formData.paymentMethod !== 'barter') {
                setShowFreeConfirmation(true);
                return;
            }
        }

        processSubmission();
    };

    return (
        <div className="min-h-screen bg-gray-50 py-6 pb-20 relative">
            {showFreeConfirmation && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">🎁</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">List for Free?</h3>
                            <p className="text-gray-600">
                                You haven't set a price. Do you want to list this item for free?
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowFreeConfirmation(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={processSubmission}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                            >
                                Yes, List Free
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 max-w-2xl">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Listing</h1>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-5 space-y-5">
                    {/* Listing Type */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">
                            Listing Type <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'PHYSICAL' })}
                                className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all border-2 ${formData.type === 'PHYSICAL'
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                                    }`}
                            >
                                Physical Product
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'SERVICE' })}
                                className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all border-2 ${formData.type === 'SERVICE'
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                                    }`}
                            >
                                Service
                            </button>
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Product Images {!isServiceCategory && <span className="text-red-500">*</span>}
                            {isServiceCategory && <span className="text-gray-500 text-xs font-normal ml-1">(Optional)</span>}
                        </label>
                        <p className="text-xs text-gray-600 mb-3">Upload up to 3 images</p>
                        {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                                <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition"
                                >
                                    ×
                                </button>
                            </div>
                        ))}

                        {images.length < 3 && (
                            <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-600 hover:bg-blue-50 transition">
                                <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="text-xs text-gray-500 font-medium">Add Photo</span>
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

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Product/Service Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-gray-900 font-medium placeholder:text-gray-500"
                            placeholder={formData.type === 'SERVICE' ? 'e.g., Professional Web Development' : 'e.g., iPhone 13 Pro Max - 256GB'}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-gray-900 placeholder:text-gray-500 font-medium resize-none transition-colors"
                            placeholder="Describe your item..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Condition */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Condition {!isServiceCategory && <span className="text-red-500">*</span>}
                                {isServiceCategory && <span className="text-gray-500 text-xs font-normal ml-1">(Optional)</span>}
                            </label>
                            <select
                                value={formData.condition}
                                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-gray-900 font-medium bg-white transition-colors cursor-pointer"
                            >
                                <option value="new">New</option>
                                <option value="used">Used</option>
                                {isServiceCategory && <option value="">Not Applicable</option>}
                            </select>
                        </div>

                        {/* Quantity */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Quantity {!isServiceCategory && <span className="text-red-500">*</span>}
                                {isServiceCategory && <span className="text-gray-500 text-xs font-normal ml-1">(Optional)</span>}
                            </label>
                            <input
                                type="number"
                                min="1"
                                required={!isServiceCategory}
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-gray-900 font-medium transition-colors"
                            />
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.categoryId}
                            onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-gray-900 font-medium bg-white transition-colors cursor-pointer"
                        >
                            <option value="">Select a category</option>
                            <option value={1}>Electronics</option>
                            <option value={2}>Fashion</option>
                            <option value={3}>Mobile Phones & Tablets</option>
                            <option value={4}>Home & Garden</option>
                            <option value={5}>Sports & Outdoors</option>
                            <option value={6}>Beauty & Health</option>
                            <option value={7}>Vehicles</option>
                            <option value={8}>Services</option>
                            <option value={9}>Books & Media</option>
                            <option value={10}>Jobs</option>
                        </select>
                    </div>

                    {/* Price & Currency */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Price
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.priceCents}
                                onChange={(e) => setFormData({ ...formData, priceCents: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-gray-900 placeholder:text-gray-500 font-medium transition-colors"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Currency
                            </label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-gray-900 font-medium bg-white transition-colors cursor-pointer"
                            >
                                <option value="NGN">₦ NGN</option>
                                <option value="USD">$ USD</option>
                                <option value="GHS">₵ GHS</option>
                                <option value="KES">KSh KES</option>
                                <option value="ZAR">R ZAR</option>
                            </select>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">
                            Payment Method <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-3">
                            {(['cash', 'barter', 'both'] as const).map((method) => (
                                <button
                                    key={method}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, paymentMethod: method })}
                                    className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all border-2 ${formData.paymentMethod === method
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                                        }`}
                                >
                                    {method === 'cash' ? 'Cash Only' : method === 'barter' ? 'Barter Only' : 'Cash & Barter'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {loading ? 'Creating...' : 'Create Listing'}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
