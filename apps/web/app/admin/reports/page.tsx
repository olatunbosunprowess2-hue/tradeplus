'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/admin-api';
import { useToastStore } from '@/lib/toast-store';
import Link from 'next/link';

export default function AdminReportsPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToastStore();

    const [selectedReport, setSelectedReport] = useState<any>(null);

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const response = await adminApi.getReports();
            setReports(response.data);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
            addToast('error', 'Failed to load reports');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Type</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Reporter</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Reported Entity</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Reason</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Evidence</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Status</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        Loading reports...
                                    </td>
                                </tr>
                            ) : reports.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        No reports found
                                    </td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${report.listingId ? 'bg-blue-50 text-blue-800' :
                                                report.reportedUserId ? 'bg-purple-100 text-purple-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {report.listingId ? 'Listing' : report.reportedUserId ? 'User' : 'Message'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm">
                                            {report.reporter?.profile?.displayName || report.reporter?.email}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {report.listing ? (
                                                <Link href={`/listings/${report.listing.id}`} className="text-blue-600 hover:underline" target="_blank">
                                                    {report.listing.title}
                                                </Link>
                                            ) : report.reportedUser ? (
                                                <span className="text-gray-900 font-medium">
                                                    {report.reportedUser.profile?.displayName || report.reportedUser.email}
                                                </span>
                                            ) : (
                                                <span className="text-gray-500">Unknown</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm max-w-xs truncate" title={report.reason}>
                                            {report.reason}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {report.evidenceImages && report.evidenceImages.length > 0 ? (
                                                <button
                                                    onClick={() => setSelectedReport(report)}
                                                    className="text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    View ({report.evidenceImages.length})
                                                </button>
                                            ) : (
                                                <span className="text-gray-400">None</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${report.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm">
                                            {new Date(report.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Evidence Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Evidence for Report</h3>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6">
                            <h4 className="font-bold text-gray-800 mb-2">Reason</h4>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedReport.reason}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {selectedReport.evidenceImages.map((image: string, index: number) => (
                                <div key={index} className="rounded-lg overflow-hidden border border-gray-200">
                                    <img src={image} alt={`Evidence ${index + 1}`} className="w-full h-auto" />
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
