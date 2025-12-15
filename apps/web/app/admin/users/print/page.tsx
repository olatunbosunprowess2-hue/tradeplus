'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminApi } from '@/lib/admin-api';

export default function UserPrintParamsPage() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Generate a unique report ID (clean format)
    const reportId = `BW-${Date.now().toString(36).toUpperCase().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const reportDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    const reportTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit'
    });

    useEffect(() => {
        const fetchUser = async () => {
            if (!userId) return;
            try {
                const response = await adminApi.getUser(userId);
                setUser(response.data);
            } catch (err: any) {
                console.error('Failed to fetch user:', err);
                if (err.response?.status === 403) {
                    setError('Access Denied: Only Super Admins can view verification details.');
                } else {
                    setError('Failed to load user report.');
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, [userId]);

    if (!userId) return <div className="p-8 text-center text-red-600 font-bold">Error: No user ID provided</div>;

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
            <p className="text-slate-600 font-medium">Preparing Secure Report...</p>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="bg-white shadow-xl rounded-2xl p-10 text-center max-w-md border border-red-100">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
                <p className="text-slate-600 mb-8">{error}</p>
                <button onClick={() => window.close()} className="px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition">
                    Close Window
                </button>
            </div>
        </div>
    );

    if (!user) return <div className="p-8 text-center text-slate-600 font-medium">User not found</div>;

    const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <div className="bg-white min-h-screen print:m-0">
            {/* Subtle Watermark Pattern - Very Light */}
            <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.015] select-none overflow-hidden print:opacity-[0.025]">
                <div className="absolute inset-0 flex flex-wrap content-center justify-center gap-40 -rotate-[20deg] scale-125">
                    {Array.from({ length: 50 }).map((_, i) => (
                        <span key={i} className="text-6xl font-black text-slate-900 uppercase whitespace-nowrap tracking-widest">
                            Barterwave
                        </span>
                    ))}
                </div>
            </div>

            {/* Screen-Only Controls */}
            <div className="print:hidden sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200 z-40">
                <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
                    <button onClick={() => window.close()} className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Close
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500">Report ID: <code className="bg-slate-100 px-2 py-1 rounded text-xs">{reportId}</code></span>
                        <button onClick={() => window.print()} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-500/25">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Download PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Document Content */}
            <div className="max-w-5xl mx-auto px-6 py-10 print:p-8 print:max-w-none relative z-10">

                {/* Professional Header */}
                <header className="mb-10 pb-8 border-b-2 border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <span className="text-white font-black text-2xl">B</span>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Barterwave</h1>
                                    <p className="text-sm text-slate-500">Identity Verification Report</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="inline-block bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Report ID</p>
                                <p className="font-mono font-bold text-slate-900">{reportId}</p>
                            </div>
                            <p className="text-xs text-slate-500 mt-3">{reportDate} at {reportTime}</p>
                        </div>
                    </div>
                </header>

                {/* User Identity Section */}
                <section className="mb-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
                        <h2 className="text-lg font-bold text-slate-900">Subject Information</h2>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Full Name</label>
                                    <p className="text-lg font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Display Name</label>
                                    <p className="text-slate-700">{user.profile?.displayName || 'Not set'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Email Address</label>
                                    <p className="font-mono text-slate-700">{user.email}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Phone Number</label>
                                    <p className="font-mono text-slate-700">{user.phoneNumber || 'Not provided'}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Reference Number</label>
                                    <p className="text-sm text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200">#{user.id.slice(-8).toUpperCase()}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Account Status</label>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {user.status}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${user.verificationStatus === 'VERIFIED' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {user.verificationStatus}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Registration Date</label>
                                    <p className="text-slate-700">{formatDate(user.createdAt)}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Location</label>
                                    <p className="text-slate-700">{user.locationAddress || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Verification Location Section */}
                <section className="mb-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-6 bg-emerald-600 rounded-full"></div>
                        <h2 className="text-lg font-bold text-slate-900">Verification Location</h2>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs text-emerald-700 uppercase tracking-wider block mb-2">Registered Address</label>
                                <p className="text-lg font-semibold text-slate-900">{user.locationAddress || 'No address provided'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-emerald-700 uppercase tracking-wider block mb-2">GPS Coordinates</label>
                                <div className="bg-white rounded-lg px-4 py-3 border border-emerald-200">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <span className="text-xs text-slate-500 block">Latitude</span>
                                            <span className="font-mono font-semibold text-slate-900">{user.locationLat || 'N/A'}</span>
                                        </div>
                                        <div className="w-px h-8 bg-emerald-200"></div>
                                        <div>
                                            <span className="text-xs text-slate-500 block">Longitude</span>
                                            <span className="font-mono font-semibold text-slate-900">{user.locationLng || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                                {user.locationLat && user.locationLng && (
                                    <a
                                        href={`https://www.google.com/maps?q=${user.locationLat},${user.locationLng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline mt-2 print:hidden"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        View on Google Maps
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
                <section className="mb-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
                        <h2 className="text-lg font-bold text-slate-900">Identity Verification Documents</h2>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3 print:bg-transparent print:border-slate-300">
                        <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm text-amber-800 print:text-slate-700">
                            <strong>Security Notice:</strong> This document contains sensitive identity information. Handle with care and dispose of securely after use.
                        </p>
                    </div>

                    {/* Photo Grid */}
                    <div className="space-y-8">
                        {/* Selfie */}
                        <div className="break-inside-avoid">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-slate-700">1. Live Selfie Verification</h3>
                                <span className="text-xs text-slate-500">Face Match</span>
                            </div>
                            <div className="bg-slate-100 rounded-xl overflow-hidden border border-slate-200 h-[350px] flex items-center justify-center">
                                {user.faceVerificationUrl ? (
                                    <img src={user.faceVerificationUrl} alt="Selfie Verification" className="max-w-full max-h-full object-contain" />
                                ) : (
                                    <p className="text-slate-400 italic">No selfie provided</p>
                                )}
                            </div>
                        </div>

                        {/* ID Documents */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1">
                            {/* ID Front */}
                            <div className="break-inside-avoid">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-slate-700">2. ID Front</h3>
                                    <span className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-600">{user.idDocumentType || 'ID'}</span>
                                </div>
                                <div className="bg-slate-100 rounded-xl overflow-hidden border border-slate-200 h-[280px] flex items-center justify-center print:h-[400px]">
                                    {user.idDocumentFrontUrl ? (
                                        <img src={user.idDocumentFrontUrl} alt="ID Front" className="max-w-full max-h-full object-contain" />
                                    ) : (
                                        <p className="text-slate-400 italic">Not provided</p>
                                    )}
                                </div>
                            </div>

                            {/* ID Back */}
                            <div className="break-inside-avoid">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-slate-700">3. ID Back</h3>
                                </div>
                                <div className="bg-slate-100 rounded-xl overflow-hidden border border-slate-200 h-[280px] flex items-center justify-center print:h-[400px]">
                                    {user.idDocumentBackUrl ? (
                                        <img src={user.idDocumentBackUrl} alt="ID Back" className="max-w-full max-h-full object-contain" />
                                    ) : (
                                        <p className="text-slate-400 italic">Not provided</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="mt-16 pt-8 border-t border-slate-200">
                    <div className="flex justify-between items-end text-xs text-slate-500">
                        <div>
                            <p className="font-semibold text-slate-700 mb-1">Barterwave Inc.</p>
                            <p>This is an official verification report. Unauthorized distribution is prohibited.</p>
                            <p className="mt-2">Report generated on {reportDate}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-mono">{reportId}</p>
                            <p>Page 1 of 1</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
