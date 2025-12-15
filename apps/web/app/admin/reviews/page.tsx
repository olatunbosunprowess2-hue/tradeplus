'use client';

import { useEffect, useState } from 'react';
import { reviewsApi } from '@/lib/reviews-api';
import { useToastStore } from '@/lib/toast-store';
import StarRating from '@/components/StarRating';

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToastStore();

    // Pagination state
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(reviews.length / itemsPerPage);
    const paginatedReviews = reviews.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const fetchFlaggedReviews = async () => {
        setLoading(true);
        try {
            const response = await reviewsApi.getFlagged();
            setReviews(response.data);
            setPage(1); // Reset to first page on new data
        } catch (error) {
            console.error('Failed to fetch flagged reviews:', error);
            addToast('error', 'Failed to load flagged reviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFlaggedReviews();
    }, []);

    const handleApprove = async (id: string) => {
        try {
            await reviewsApi.moderate(id, { flagged: false, isPublic: true });
            addToast('success', 'Review approved');
            fetchFlaggedReviews();
        } catch (error: any) {
            addToast('error', error.response?.data?.message || 'Failed to approve review');
        }
    };

    const handleHide = async (id: string) => {
        try {
            await reviewsApi.moderate(id, { isPublic: false });
            addToast('success', 'Review hidden');
            fetchFlaggedReviews();
        } catch (error: any) {
            addToast('error', error.response?.data?.message || 'Failed to hide review');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Review Moderation</h1>
                <p className="text-gray-600 mt-1">Manage flagged reviews</p>
            </div>

            {reviews.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No flagged reviews</h3>
                    <p className="mt-1 text-sm text-gray-500">All reviews have been moderated</p>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {paginatedReviews.map((review) => (
                            <div
                                key={review.id}
                                className="bg-white rounded-lg border border-gray-200 p-6"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                                                {review.reviewer.profile?.displayName?.[0] || review.reviewer.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {review.reviewer.profile?.displayName || review.reviewer.email}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Reviewing: {review.reviewee.profile?.displayName || review.reviewee.email}
                                                </p>
                                            </div>
                                        </div>
                                        <StarRating rating={review.rating} showNumber />
                                    </div>
                                    <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                                        Flagged
                                    </span>
                                </div>

                                {review.comment && (
                                    <p className="text-gray-700 mb-4 p-4 bg-gray-50 rounded-lg">
                                        {review.comment}
                                    </p>
                                )}

                                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => handleApprove(review.id)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleHide(review.id)}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                                    >
                                        Hide
                                    </button>
                                    <p className="text-sm text-gray-500 ml-auto">
                                        Listing: {review.listing?.title}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-center gap-4">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600 font-medium px-4">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
