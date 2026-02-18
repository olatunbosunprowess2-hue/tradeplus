'use client';

import StarRating from './StarRating';
import { useState } from 'react';
import { reviewsApi } from '@/lib/reviews-api';
import { useAuthStore } from '@/lib/auth-store';
import { useToastStore } from '@/lib/toast-store';
import { sanitizeUrl } from '@/lib/utils';

interface ReviewCardProps {
    review: {
        id: string;
        rating: number;
        comment?: string;
        createdAt: string;
        reviewer: {
            id: string;
            email: string;
            profile?: {
                displayName?: string;
                avatarUrl?: string;
            };
        };
        listing?: {
            id: string;
            title: string;
        };
    };
    onUpdate?: () => void;
}

export default function ReviewCard({ review, onUpdate }: ReviewCardProps) {
    const { user } = useAuthStore();
    const { addToast } = useToastStore();
    const [showActions, setShowActions] = useState(false);

    const isOwnReview = user?.id === review.reviewer?.id;
    const reviewerName = review.reviewer?.profile?.displayName || review.reviewer?.email?.split('@')[0] || 'Unknown';
    const reviewerAvatar = review.reviewer?.profile?.avatarUrl;

    const handleFlag = async () => {
        try {
            await reviewsApi.flag(review.id);
            addToast('success', 'Review flagged for moderation');
            setShowActions(false);
        } catch (error: any) {
            addToast('error', error.response?.data?.message || 'Failed to flag review');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this review?')) return;

        try {
            await reviewsApi.delete(review.id);
            addToast('success', 'Review deleted successfully');
            onUpdate?.();
        } catch (error: any) {
            addToast('error', error.response?.data?.message || 'Failed to delete review');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                        {reviewerAvatar ? (
                            <img
                                src={sanitizeUrl(reviewerAvatar)}
                                alt={reviewerName}
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            reviewerName[0].toUpperCase()
                        )}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">{reviewerName}</p>
                        <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                    </div>
                </div>

                {/* Actions menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowActions(!showActions)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                    </button>

                    {showActions && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            {isOwnReview ? (
                                <button
                                    onClick={handleDelete}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                                >
                                    Delete Review
                                </button>
                            ) : (
                                <button
                                    onClick={handleFlag}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Flag as Inappropriate
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Rating */}
            <div className="mb-3">
                <StarRating rating={review.rating} showNumber />
            </div>

            {/* Comment */}
            {review.comment && (
                <p className="text-gray-700 leading-relaxed mb-3">{review.comment}</p>
            )}

            {/* Listing info */}
            {review.listing && (
                <div className="pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                        Review for: <span className="font-medium text-gray-700">{review.listing.title}</span>
                    </p>
                </div>
            )}
        </div>
    );
}
