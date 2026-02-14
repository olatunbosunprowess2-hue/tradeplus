'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import apiClient from '@/lib/api-client';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface BrandStatus {
    brandVerificationStatus: string;
    brandName: string | null;
    brandWebsite: string | null;
    brandInstagram: string | null;
    brandTwitter: string | null;
    brandLinkedin: string | null;
    brandFacebook: string | null;
    brandTiktok: string | null;
    brandPhysicalAddress: string | null;
    brandWhatsApp: string | null;
    brandApplicationNote: string | null;
    brandVerifiedAt: string | null;
    brandRejectionReason: string | null;
}

export default function BrandApplyPage() {
    const { user, isAuthenticated } = useAuthStore();
    const [status, setStatus] = useState<BrandStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Waitlist state
    const [waitlistEmail, setWaitlistEmail] = useState('');
    const [waitlistName, setWaitlistName] = useState('');
    const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
    const [waitlistSuccess, setWaitlistSuccess] = useState(false);
    const [waitlistError, setWaitlistError] = useState('');

    // Form state
    const [form, setForm] = useState({
        brandName: '',
        brandWebsite: '',
        brandInstagram: '',
        brandTwitter: '',
        brandLinkedin: '',
        brandFacebook: '',
        brandTiktok: '',
        brandPhysicalAddress: '',
        brandPhoneNumber: '',
        brandWhatsApp: '',
        brandApplicationNote: '',
    });
    const [proofUrls, setProofUrls] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        if (proofUrls.length + files.length > 5) {
            setError('Maximum 5 proof files allowed');
            return;
        }
        setUploading(true);
        setError('');
        try {
            const newUrls: string[] = [];
            for (const file of Array.from(files)) {
                const formData = new FormData();
                formData.append('file', file);
                const res = await apiClient.post('/uploads/image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                newUrls.push(res.data.url);
            }
            setProofUrls(prev => [...prev, ...newUrls]);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload proof');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeProof = (index: number) => {
        setProofUrls(prev => prev.filter((_, i) => i !== index));
    };

    // Fetch current brand status if authenticated
    useEffect(() => {
        if (isAuthenticated) {
            apiClient.get('/brand-verification/status')
                .then(res => {
                    setStatus(res.data);
                    // Pre-fill form if rejected (allow reapply)
                    if (res.data.brandVerificationStatus === 'REJECTED') {
                        setForm({
                            brandName: res.data.brandName || '',
                            brandWebsite: res.data.brandWebsite || '',
                            brandInstagram: res.data.brandInstagram || '',
                            brandTwitter: res.data.brandTwitter || '',
                            brandLinkedin: res.data.brandLinkedin || '',
                            brandFacebook: res.data.brandFacebook || '',
                            brandTiktok: res.data.brandTiktok || '',
                            brandPhysicalAddress: res.data.brandPhysicalAddress || '',
                            brandPhoneNumber: res.data.brandPhoneNumber || '',
                            brandWhatsApp: res.data.brandWhatsApp || '',
                            brandApplicationNote: '',
                        });
                    }
                })
                .catch(() => { })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.brandName.trim()) {
            setError('Brand name is required');
            return;
        }
        if (!form.brandPhysicalAddress.trim()) {
            setError('Physical address is required for verification');
            return;
        }
        if (!form.brandPhoneNumber.trim()) {
            setError('Business phone number is required');
            return;
        }
        if (proofUrls.length === 0) {
            setError('Please upload at least one proof document (photo, screenshot, or document)');
            return;
        }

        // Auto-fix website URL if it starts with www.
        let finalWebsite = form.brandWebsite.trim();
        if (finalWebsite && finalWebsite.toLowerCase().startsWith('www.')) {
            finalWebsite = 'https://' + finalWebsite;
        }

        setSubmitting(true);
        setError('');
        try {
            await apiClient.post('/brand-verification/apply', {
                ...form,
                brandWebsite: finalWebsite,
                brandProofUrls: proofUrls
            });
            setSuccess(true);
            toast.success('Application submitted successfully!');
            // Refetch status
            const res = await apiClient.get('/brand-verification/status');
            setStatus(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit application');
            toast.error(err.response?.data?.message || 'Failed to submit application');
        } finally {
            setSubmitting(false);
        }
    };

    const handleWaitlist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!waitlistEmail.trim()) {
            setWaitlistError('Email is required');
            return;
        }
        setWaitlistSubmitting(true);
        setWaitlistError('');
        try {
            await apiClient.post('/brand-verification/waitlist', {
                email: waitlistEmail,
                name: waitlistName || undefined,
            });
            setWaitlistSuccess(true);
            toast.success('Joined waitlist successfully!');
        } catch (err: any) {
            setWaitlistError(err.response?.data?.message || 'Failed to join waitlist');
        } finally {
            setWaitlistSubmitting(false);
        }
    };

    // Status display for users who already applied
    const renderStatus = () => {
        if (!status || status.brandVerificationStatus === 'NONE') return null;

        if (status.brandVerificationStatus === 'PENDING') {
            return (
                <div className="max-w-2xl mx-auto mb-8">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-6 sm:p-8 text-center">
                        <div className="text-4xl sm:text-5xl mb-4">⏳</div>
                        <h2 className="text-xl sm:text-2xl font-bold text-amber-800 dark:text-amber-200 mb-2">Application Under Review</h2>
                        <p className="text-amber-700 dark:text-amber-300 mb-4 max-w-lg mx-auto">
                            Your brand <strong>&ldquo;{status.brandName}&rdquo;</strong> is being reviewed by our team. We&apos;ll notify you once a decision is made.
                        </p>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-left text-sm text-gray-600 dark:text-gray-300 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                            {status.brandWebsite && <p className="truncate">🌐 {status.brandWebsite}</p>}
                            {status.brandInstagram && <p className="truncate">📸 {status.brandInstagram}</p>}
                            {status.brandTwitter && <p className="truncate">🐦 {status.brandTwitter}</p>}
                            {status.brandLinkedin && <p className="truncate">💼 {status.brandLinkedin}</p>}
                            {status.brandPhysicalAddress && <p className="col-span-1 sm:col-span-2 truncate">📍 {status.brandPhysicalAddress}</p>}
                        </div>
                    </div>
                </div>
            );
        }

        if (status.brandVerificationStatus === 'VERIFIED_BRAND') {
            return (
                <div className="max-w-2xl mx-auto mb-8">
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-8 text-center">
                        <div className="text-5xl mb-4">✦</div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent mb-2">
                            You&apos;re a Verified Brand!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            <strong>{status.brandName}</strong> is verified since {status.brandVerifiedAt ? new Date(status.brandVerifiedAt).toLocaleDateString() : 'recently'}.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <Link href="/listings/create" className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-white rounded-lg font-semibold shadow hover:shadow-md transition-all">
                                Create Listing →
                            </Link>
                            <Link href="/settings/bank-details" className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-all">
                                Set Up Bank Details
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        if (status.brandVerificationStatus === 'REJECTED') {
            return (
                <div className="max-w-2xl mx-auto mb-8">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-6">
                        <div className="text-3xl mb-3">❌</div>
                        <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Application Not Approved</h2>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3">
                            <p className="text-sm text-gray-500 mb-1">Reason:</p>
                            <p className="text-red-700 dark:text-red-300">{status.brandRejectionReason}</p>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            You can reapply below with updated information.
                        </p>
                    </div>
                </div>
            );
        }

        return null;
    };

    const showForm = isAuthenticated && (!status || status.brandVerificationStatus === 'NONE' || status.brandVerificationStatus === 'REJECTED');

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
            {/* Compact Header Section */}
            <div className="relative overflow-hidden mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 pointer-events-none" />
                <div className="relative max-w-5xl mx-auto px-4 py-12 sm:py-16 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium mb-4">
                        <span>✦</span> Official Verification
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
                        Get Verified on{' '}
                        <span className="bg-gradient-to-r from-amber-500 to-yellow-400 bg-clip-text text-transparent">
                            BarterWave
                        </span>
                    </h1>
                    <p className="text-base text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
                        Build trust, unlock cash payments, and get premium selling tools.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 pb-20">
                {/* Compact Features Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
                    {[
                        { icon: '✦', title: 'Verified Badge', desc: 'Build buyer trust' },
                        { icon: '💰', title: 'Cash Up', desc: 'Accept cash & barter' },
                        { icon: '🔒', title: 'Escrow', desc: 'Secure downpayments' },
                        { icon: '📱', title: 'Direct Chat', desc: 'WhatsApp contact' },
                    ].map((f, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm text-center">
                            <div className="text-xl mb-1">{f.icon}</div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-0.5">{f.title}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{f.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Status display */}
                {!loading && renderStatus()}

                {/* Application Form */}
                {!loading && showForm && (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
                            <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {status?.brandVerificationStatus === 'REJECTED' ? 'Reapply for Verification' : 'Brand Application Form'}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Please provide accurate details to avoid rejection.</p>
                            </div>

                            {success ? (
                                <div className="text-center py-8">
                                    <div className="text-5xl mb-4">🎉</div>
                                    <h3 className="text-xl font-bold text-green-600 mb-2">Application Submitted!</h3>
                                    <p className="text-gray-500">We&apos;ll review your application and get back to you soon.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Brand Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={form.brandName}
                                                onChange={e => setForm({ ...form, brandName: e.target.value })}
                                                placeholder="e.g., Nike Nigeria"
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Website
                                            </label>
                                            <input
                                                type="text"
                                                value={form.brandWebsite}
                                                onChange={e => setForm({ ...form, brandWebsite: e.target.value })}
                                                placeholder="yourbrand.com"
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Physical Address <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={form.brandPhysicalAddress}
                                                onChange={e => setForm({ ...form, brandPhysicalAddress: e.target.value })}
                                                placeholder="City, State"
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Phone Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={form.brandPhoneNumber}
                                                onChange={e => setForm({ ...form, brandPhoneNumber: e.target.value })}
                                                placeholder="+234..."
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                WhatsApp <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={form.brandWhatsApp}
                                                onChange={e => setForm({ ...form, brandWhatsApp: e.target.value })}
                                                placeholder="For chat button"
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Social Media Section */}
                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Social Media Handles (Optional)</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-gray-400">📸</span>
                                                    <input
                                                        type="text"
                                                        value={form.brandInstagram}
                                                        onChange={e => setForm({ ...form, brandInstagram: e.target.value })}
                                                        placeholder="Instagram (e.g. @nike)"
                                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-gray-400">🐦</span>
                                                    <input
                                                        type="text"
                                                        value={form.brandTwitter}
                                                        onChange={e => setForm({ ...form, brandTwitter: e.target.value })}
                                                        placeholder="X (Twitter)"
                                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-gray-400">💼</span>
                                                    <input
                                                        type="text"
                                                        value={form.brandLinkedin}
                                                        onChange={e => setForm({ ...form, brandLinkedin: e.target.value })}
                                                        placeholder="LinkedIn URL"
                                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-gray-400">📘</span>
                                                    <input
                                                        type="text"
                                                        value={form.brandFacebook}
                                                        onChange={e => setForm({ ...form, brandFacebook: e.target.value })}
                                                        placeholder="Facebook URL"
                                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-gray-400">🎵</span>
                                                    <input
                                                        type="text"
                                                        value={form.brandTiktok}
                                                        onChange={e => setForm({ ...form, brandTiktok: e.target.value })}
                                                        placeholder="TikTok Handle"
                                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Application Note
                                        </label>
                                        <textarea
                                            value={form.brandApplicationNote}
                                            onChange={e => setForm({ ...form, brandApplicationNote: e.target.value })}
                                            placeholder="Tell us about your brand..."
                                            rows={3}
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all resize-none"
                                        />
                                    </div>

                                    {/* Proof Upload */}
                                    <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
                                        <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                                            Proof of Brand Identity <span className="text-red-500">*</span>
                                        </label>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                            Upload photos, documents, or screenshots proving ownership. Max 5 files.
                                        </p>

                                        {/* Uploaded Proof Thumbnails */}
                                        {proofUrls.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {proofUrls.map((url, i) => (
                                                    <div key={i} className="relative group">
                                                        <img
                                                            src={url}
                                                            alt={`Proof ${i + 1}`}
                                                            className="w-16 h-16 rounded-lg object-cover border border-amber-200 dark:border-amber-700 shadow-sm"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeProof(i)}
                                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {proofUrls.length < 5 && (
                                            <div>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleProofUpload}
                                                    className="hidden"
                                                    id="proof-upload"
                                                />
                                                <label
                                                    htmlFor="proof-upload"
                                                    className={`inline-flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer transition-all text-sm font-medium ${uploading
                                                        ? 'border-amber-300 bg-amber-50 text-amber-600 cursor-wait'
                                                        : 'border-gray-300 dark:border-gray-600 hover:border-amber-400 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-amber-600'
                                                        }`}
                                                >
                                                    {uploading ? (
                                                        <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-600" /> Uploading...</>
                                                    ) : (
                                                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Add Proof</>
                                                    )}
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg text-center">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-60 transition-all"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Application'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                )}

                {/* Not logged in prompt */}
                {!loading && !isAuthenticated && (
                    <div className="max-w-xl mx-auto mb-12">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl p-6 text-center">
                            <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-1">
                                Sign in to Apply
                            </h3>
                            <p className="text-sm text-blue-600 dark:text-blue-300 mb-4">
                                You need a BarterWave account to apply for brand verification.
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow hover:bg-blue-700 transition-all"
                            >
                                Sign In →
                            </Link>
                        </div>
                    </div>
                )}

                {/* Waitlist Section */}
                <div className="max-w-2xl mx-auto mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                            Not a Brand Yet?
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Join our waitlist to be notified when premium features become available to everyone.
                        </p>
                    </div>

                    {waitlistSuccess ? (
                        <div className="text-center py-2">
                            <p className="text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 inline-block px-4 py-1 rounded-full text-sm">
                                ✅ You&apos;re on the waitlist!
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                            <input
                                type="text"
                                value={waitlistName}
                                onChange={e => setWaitlistName(e.target.value)}
                                placeholder="Name (Optional)"
                                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="email"
                                value={waitlistEmail}
                                onChange={e => setWaitlistEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                disabled={waitlistSubmitting}
                                className="px-6 py-2.5 bg-gray-900 dark:bg-gray-700 text-white font-medium rounded-lg hover:bg-black dark:hover:bg-gray-600 disabled:opacity-60 transition-all whitespace-nowrap text-sm"
                            >
                                {waitlistSubmitting ? '...' : 'Join Waitlist'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
