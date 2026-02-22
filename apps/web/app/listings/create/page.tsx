'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import apiClient from '@/lib/api-client';
import { useListingsStore } from '@/lib/listings-store';
import { getGroupedCurrencies } from '@/lib/currencies';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import VerificationRequiredModal from '@/components/VerificationRequiredModal';
import SuspendedAccountModal from '@/components/SuspendedAccountModal';
import BusinessAddressModal from '@/components/BusinessAddressModal';
import { DistressBoostModal, SpotlightModal } from '@/components/PaywallModal';
import { initializePayment, redirectToPaystack, checkListingLimit, useSpotlightCredit } from '@/lib/payments-api';
import { compressImages } from '@/lib/image-compression';
import Image from 'next/image';

// --- Validation Schema ---
const listingSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional(),
    type: z.enum(['PHYSICAL', 'SERVICE']),
    condition: z.enum(['new', 'used']).optional(),
    categoryId: z.number().min(1, 'Please select a category'),
    priceCents: z.string().optional(),
    currency: z.string(),
    paymentMethod: z.enum(['cash', 'barter', 'both']),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    images: z.array(z.any()).min(1, 'At least one image is required'),
}).refine((data) => {
    if (data.type === 'PHYSICAL' && !data.condition) return false;
    return true;
}, {
    message: "Condition is required for physical items",
    path: ["condition"],
});

export default function CreateListingPage() {
    const router = useRouter();
    const { isAuthenticated, user, _hasHydrated, refreshProfile } = useAuthStore();
    const { addListing } = useListingsStore();

    // --- State ---
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [showSuspendedModal, setShowSuspendedModal] = useState(false);
    const [showBusinessAddressModal, setShowBusinessAddressModal] = useState(false);
    const [showPaywallModal, setShowPaywallModal] = useState<'distress' | 'spotlight' | null>(null);
    const [createdListingId, setCreatedListingId] = useState<string | null>(null);
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);
    const [showListingLimitModal, setShowListingLimitModal] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'PHYSICAL' as 'PHYSICAL' | 'SERVICE',
        condition: 'used',
        categoryId: 0,
        priceCents: '',
        currency: 'NGN',
        paymentMethod: 'cash' as 'cash' | 'barter' | 'both',
        quantity: 1,
        isAvailable: true,
        isDistressSale: false,
        distressReason: '',
        barterPreference1: '',
        barterPreference2: '',
        barterPreference3: '',
        barterPreferencesOnly: false,
        downpaymentCents: '', // Added downpayment field
    });

    // Media
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [video, setVideo] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string>('');

    // Categories
    const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);

    // Service Categories
    const serviceCategories = [8, 9, 14];
    const isServiceCategory = serviceCategories.includes(formData.categoryId) || formData.type === 'SERVICE';

    // --- Effects ---
    useEffect(() => {
        if (_hasHydrated) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (user?.status === 'suspended') {
                setShowSuspendedModal(true);
            } else if (user && !user.isVerified) {
                setShowVerificationModal(true);
            } else if (user && !user.profile?.countryId) {
                // Prompt user to set business address if not set
                setShowBusinessAddressModal(true);
            }
        }
    }, [isAuthenticated, user, router, _hasHydrated]);

    // Fetch categories from API
    useEffect(() => {
        apiClient.get('/categories')
            .then(res => setCategories(res.data))
            .catch(err => console.error('Failed to fetch categories:', err));
    }, []);

    // Periodic suspension check - refresh profile every 30 seconds
    useEffect(() => {
        if (!isAuthenticated) return;

        // Initial refresh
        refreshProfile();

        // Set up interval for periodic refresh
        const interval = setInterval(() => {
            refreshProfile();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [isAuthenticated, refreshProfile]);

    // --- Handlers ---
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + images.length > 3) {
            toast.error('Maximum 3 images allowed');
            return;
        }

        // Compress images client-side before storing
        const toastId = toast.loading('Compressing images...');
        try {
            const compressed = await compressImages(files);
            toast.dismiss(toastId);

            compressed.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreviews(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });

            setImages(prev => [...prev, ...compressed]);
        } catch {
            toast.dismiss(toastId);
            toast.error('Failed to process images');
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 50 * 1024 * 1024) {
            toast.error('Video must be under 50MB');
            return;
        }
        setVideo(file);
        const reader = new FileReader();
        reader.onloadend = () => setVideoPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const validateStep = (currentStep: number) => {
        const errors: Record<string, string> = {};

        if (currentStep === 1) {
            if (formData.categoryId === 0) errors.categoryId = 'Please select a category';
        }

        if (currentStep === 2) {
            if (formData.title.length < 3) errors.title = 'Title must be at least 3 characters';
            if (!isServiceCategory && !formData.condition) errors.condition = 'Condition is required';
        }

        if (currentStep === 3) {
            if (images.length === 0 && !isServiceCategory) errors.images = 'At least one image is required';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(step)) {
            setStep(prev => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    const prevStep = () => {
        setStep(prev => prev - 1);
        window.scrollTo(0, 0);
    };

    const handleSubmit = async () => {
        // Block submission if user is suspended
        if (user?.status === 'suspended') {
            setShowSuspendedModal(true);
            return;
        }

        if (!validateStep(4)) return;
        setLoading(true);

        try {
            const form = new FormData();
            // Data Mapping
            form.append('title', formData.title);
            if (formData.description) form.append('description', formData.description);
            form.append('type', formData.type);
            if (formData.condition) form.append('condition', formData.condition);
            form.append('categoryId', formData.categoryId.toString());
            if (formData.priceCents && parseFloat(formData.priceCents) > 0) {
                form.append('priceCents', (parseFloat(formData.priceCents) * 100).toString());
            }
            form.append('currencyCode', formData.currency);
            form.append('quantity', formData.quantity.toString());

            // Downpayment (Verified Brands only)
            if (user?.brandVerificationStatus === 'VERIFIED_BRAND' && formData.downpaymentCents && parseFloat(formData.downpaymentCents) > 0) {
                form.append('downpaymentCents', (parseFloat(formData.downpaymentCents) * 100).toString());
                form.append('downpaymentCurrency', formData.currency);
            }

            // Service availability
            if (formData.type === 'SERVICE') {
                form.append('isAvailable', formData.isAvailable.toString());
            }

            // Payment Methods
            const allowCash = formData.paymentMethod === 'cash' || formData.paymentMethod === 'both';
            const allowBarter = formData.paymentMethod === 'barter' || formData.paymentMethod === 'both';
            form.append('allowCash', allowCash.toString());
            form.append('allowBarter', allowBarter.toString());
            form.append('allowCashPlusBarter', (allowCash && allowBarter).toString());

            // Files
            images.forEach(img => form.append('images', img));
            if (video) form.append('video', video);

            // Distress
            if (formData.isDistressSale) {
                form.append('isDistressSale', 'true');
                if (formData.distressReason) form.append('distressReason', formData.distressReason);
            }

            // Barter Prefs
            if (allowBarter) {
                if (formData.barterPreference1) form.append('barterPreference1', formData.barterPreference1);
                if (formData.barterPreference2) form.append('barterPreference2', formData.barterPreference2);
                if (formData.barterPreference3) form.append('barterPreference3', formData.barterPreference3);
                form.append('barterPreferencesOnly', formData.barterPreferencesOnly.toString());
            }

            // Auto-apply user's business location to listing
            if (user?.profile?.countryId) {
                form.append('countryId', user.profile.countryId.toString());
            }
            if (user?.profile?.regionId) {
                form.append('regionId', user.profile.regionId.toString());
            }

            const response = await apiClient.post('/listings', form);
            addListing(response.data);
            toast.success('Listing created successfully!');

            // Store listing ID for potential boost purchase
            setCreatedListingId(response.data.id);

            // Show appropriate paywall modal based on listing type
            if (formData.isDistressSale) {
                setShowPaywallModal('distress');
            } else {
                setShowPaywallModal('spotlight');
            }

        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to create listing');
        } finally {
            setLoading(false);
        }
    };

    const handlePaywallSelect = async (optionId: string) => {
        if (!createdListingId) return;

        setIsPaymentLoading(true);
        try {
            const result = await initializePayment(optionId as any, createdListingId);
            redirectToPaystack(result.authorizationUrl);
        } catch (error) {
            console.error('Payment initialization failed:', error);
            toast.error('Failed to initialize payment. Please try again.');
            // Still navigate to listing on error
            router.push(`/listings/${createdListingId}`);
        } finally {
            setIsPaymentLoading(false);
        }
    };

    const handleUseCredit = async (optionId: string) => {
        if (!createdListingId) return;

        setIsPaymentLoading(true);
        try {
            const result = await useSpotlightCredit(createdListingId);
            if (result.success) {
                toast.success(result.message);
                await refreshProfile(); // Refresh credits
                router.push(`/listings/${createdListingId}`);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Credit usage failed:', error);
            toast.error('Failed to use credit. Please try again.');
        } finally {
            setIsPaymentLoading(false);
        }
    };

    const handlePaywallClose = () => {
        setShowPaywallModal(null);
        if (createdListingId) {
            router.push(`/listings/${createdListingId}`);
        }
    };

    if (!_hasHydrated || !isAuthenticated) return null;

    // --- Render Wizard Steps ---
    return (
        <div className="min-h-screen bg-gray-50 py-10 pb-20">
            <VerificationRequiredModal isOpen={showVerificationModal} onClose={() => router.push('/listings')} />
            <SuspendedAccountModal isOpen={showSuspendedModal} onClose={() => router.push('/listings')} actionAttempted="create a listing" />
            <BusinessAddressModal
                isOpen={showBusinessAddressModal}
                onClose={() => router.push('/listings')}
                onComplete={() => setShowBusinessAddressModal(false)}
            />

            {/* Post-Upload Paywall Modals */}
            <DistressBoostModal
                isOpen={showPaywallModal === 'distress'}
                onClose={handlePaywallClose}
                onSelectOption={handlePaywallSelect}
                isLoading={isPaymentLoading}
            />
            <SpotlightModal
                isOpen={showPaywallModal === 'spotlight'}
                onClose={handlePaywallClose}
                onSelectOption={handlePaywallSelect}
                onUseCredit={handleUseCredit}
                creditsAvailable={user?.spotlightCredits}
                isLoading={isPaymentLoading}
            />

            <div className="container mx-auto px-4 max-w-3xl">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-500">Step {step} of 4</span>
                        <span className="text-sm font-bold text-blue-600">
                            {step === 1 ? 'Basics' : step === 2 ? 'Details' : step === 3 ? 'Media' : 'Pricing'}
                        </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-500 ease-out"
                            style={{ width: `${(step / 4) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 min-h-[500px] flex flex-col">
                    <div className="p-8 flex-1">

                        {/* STEP 1: BASICS */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h1 className="text-2xl font-bold text-gray-900">What are you listing?</h1>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setFormData({ ...formData, type: 'PHYSICAL' })}
                                        className={`p-6 rounded-xl border-2 text-left transition-all ${formData.type === 'PHYSICAL'
                                            ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                                            : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-3xl mb-3 block">📦</span>
                                        <h3 className="font-bold text-gray-900">Product</h3>
                                        <p className="text-sm text-gray-500 mt-1">Gadgets, Clothes, Cars...</p>
                                    </button>

                                    <button
                                        onClick={() => setFormData({ ...formData, type: 'SERVICE' })}
                                        className={`p-6 rounded-xl border-2 text-left transition-all ${formData.type === 'SERVICE'
                                            ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                                            : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-3xl mb-3 block">🛠️</span>
                                        <h3 className="font-bold text-gray-900">Service</h3>
                                        <p className="text-sm text-gray-500 mt-1">Plumbing, Design, Lessons...</p>
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                                    <select
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                                    >
                                        <option value={0}>Select a category</option>
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>{category.name}</option>
                                        ))}
                                    </select>
                                    {validationErrors.categoryId && <p className="text-red-500 text-sm mt-1">{validationErrors.categoryId}</p>}
                                </div>
                            </div>
                        )}

                        {/* STEP 2: DETAILS */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h1 className="text-2xl font-bold text-gray-900">Describe your item</h1>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. iPhone 13 Pro Max - 256GB"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                    {validationErrors.title && <p className="text-red-500 text-sm mt-1">{validationErrors.title}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={4}
                                        placeholder="Add details about condition, features, specific flaws, etc."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {!isServiceCategory && (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Condition</label>
                                            <select
                                                value={formData.condition}
                                                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                                            >
                                                <option value="used">Used</option>
                                                <option value="new">New</option>
                                            </select>
                                        </div>
                                    )}
                                    {formData.type === 'PHYSICAL' && (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Quantity</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={formData.quantity}
                                                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Availability Toggle for Services */}
                                {formData.type === 'SERVICE' && (
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold text-gray-900">Available for Booking</h3>
                                                <p className="text-xs text-gray-600 mt-1">Toggle off when you're fully booked or unavailable</p>
                                            </div>
                                            <div
                                                onClick={() => setFormData(p => ({ ...p, isAvailable: !p.isAvailable }))}
                                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${formData.isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}
                                            >
                                                <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${formData.isAvailable ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STEP 3: MEDIA */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h1 className="text-2xl font-bold text-gray-900">Add Photos & Video</h1>
                                <p className="text-gray-500 text-sm">Clear photos increase your chances of selling.</p>

                                <div>
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        {imagePreviews.map((src, idx) => (
                                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border shadow-sm group">
                                                <img src={src} alt="Preview" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => removeImage(idx)}
                                                    className="absolute top-2 right-2 bg-red-500/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        ))}

                                        {images.length < 3 && (
                                            <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center cursor-pointer">
                                                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                <span className="text-xs font-semibold text-gray-600">Add Image</span>
                                                <input type="file" onChange={handleImageChange} accept="image/*" className="hidden" />
                                            </label>
                                        )}
                                    </div>
                                    {validationErrors.images && <p className="text-red-500 text-sm">{validationErrors.images}</p>}
                                </div>

                                <div className="border-t border-gray-100 pt-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-3">Add Video (Optional)</label>
                                    {videoPreview ? (
                                        <div className="relative rounded-xl overflow-hidden bg-black aspect-video group">
                                            <video src={videoPreview} className="w-full h-full" controls />
                                            <button
                                                onClick={() => { setVideo(null); setVideoPreview(''); }}
                                                className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="block w-full p-6 border-2 border-dashed border-gray-300 rounded-xl text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors">
                                            <span className="text-purple-600 font-medium">Click to upload video</span>
                                            <span className="block text-xs text-gray-400 mt-1">MP4 up to 50MB</span>
                                            <input type="file" onChange={handleVideoChange} accept="video/*" className="hidden" />
                                        </label>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STEP 4: PRICING */}
                        {step === 4 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h1 className="text-2xl font-bold text-gray-900">Price & Payment</h1>

                                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-4">
                                    <div className="pt-1"><span className="text-xl">🔥</span></div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-bold text-gray-900">Distress Sale?</h3>
                                            <div onClick={() => setFormData(p => ({ ...p, isDistressSale: !p.isDistressSale }))} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${formData.isDistressSale ? 'bg-orange-500' : 'bg-gray-300'}`}>
                                                <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${formData.isDistressSale ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">Mark this if you need cash urgently. Trade will be disabled.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Price</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={formData.priceCents}
                                            onChange={(e) => setFormData({ ...formData, priceCents: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Currency</label>
                                        <select
                                            value={formData.currency}
                                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                                        >
                                            {Object.entries(getGroupedCurrencies()).map(([group, currencies]) => (
                                                <optgroup label={group} key={group}>
                                                    {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Verified Brand Downpayment Override */}
                                {user?.brandVerificationStatus === 'VERIFIED_BRAND' && !formData.isDistressSale && (
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mt-4">
                                        <div className="flex items-start gap-3">
                                            <span className="text-xl">💰</span>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 text-sm">Override Downpayment</h3>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            Set a custom downpayment for this listing (overrides your brand defaults).
                                                        </p>
                                                    </div>
                                                    <div
                                                        onClick={() => setFormData(p => ({
                                                            ...p,
                                                            downpaymentCents: p.downpaymentCents ? '' : '0',
                                                        }))}
                                                        className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors ${formData.downpaymentCents ? 'bg-amber-500' : 'bg-gray-300'}`}
                                                    >
                                                        <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${formData.downpaymentCents ? 'translate-x-5' : 'translate-x-0'}`} />
                                                    </div>
                                                </div>

                                                {formData.downpaymentCents !== '' && (
                                                    <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                                                        <label className="block text-sm font-bold text-gray-700 mb-2">Amount</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-3 text-gray-500">{formData.currency}</span>
                                                            <input
                                                                type="number"
                                                                placeholder="0.00"
                                                                value={formData.downpaymentCents || ''}
                                                                onChange={(e) => {
                                                                    const val = parseFloat(e.target.value);
                                                                    const price = parseFloat(formData.priceCents);
                                                                    if (price && val > price * 0.5) {
                                                                        toast.error('Downpayment cannot exceed 50% of listing price');
                                                                        return;
                                                                    }
                                                                    setFormData({ ...formData, downpaymentCents: e.target.value })
                                                                }}
                                                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                                                            />
                                                        </div>
                                                        <p className="text-xs text-amber-700 mt-2">
                                                            Buyers will be required to pay this amount upfront. Max 50% of listing price.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!formData.isDistressSale && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-3">Accept Payment Via</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['cash', 'barter', 'both'].map((method) => (
                                                <button
                                                    key={method}
                                                    onClick={() => setFormData({ ...formData, paymentMethod: method as any })}
                                                    className={`py-3 rounded-xl border font-medium text-sm transition-all capitalize ${formData.paymentMethod === method
                                                        ? 'bg-gray-900 text-white border-gray-900'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {method}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(formData.paymentMethod === 'barter' || formData.paymentMethod === 'both') && !formData.isDistressSale && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Trade Items (Optional)</label>
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                placeholder="e.g. Gaming Laptop"
                                                value={formData.barterPreference1}
                                                onChange={(e) => setFormData({ ...formData, barterPreference1: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                            {formData.barterPreference1 && (
                                                <input
                                                    type="text"
                                                    placeholder="e.g. DSLR Camera"
                                                    value={formData.barterPreference2}
                                                    onChange={(e) => setFormData({ ...formData, barterPreference2: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm animate-in fade-in slide-in-from-top-2 duration-200"
                                                />
                                            )}
                                            {formData.barterPreference2 && (
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Electric Scooter"
                                                    value={formData.barterPreference3}
                                                    onChange={(e) => setFormData({ ...formData, barterPreference3: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm animate-in fade-in slide-in-from-top-2 duration-200"
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* FOOTER ACTIONS */}
                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                        {step > 1 ? (
                            <button
                                onClick={prevStep}
                                className="px-6 py-3 text-gray-600 font-bold hover:text-gray-900"
                            >
                                Back
                            </button>
                        ) : (
                            <div />
                        )}

                        <button
                            onClick={step === 4 ? handleSubmit : nextStep}
                            disabled={loading}
                            className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-200'
                                }`}
                        >
                            {loading ? 'Creating...' : step === 4 ? 'Publish Listing' : 'Next Step'}
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
}
