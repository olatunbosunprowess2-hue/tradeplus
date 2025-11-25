'use client';

import { useState } from 'react';
import StarRatingInput from './StarRatingInput';
import { reviewsApi } from '@/lib/reviews-api';
import { useToastStore } from '@/lib/toast-store';

interface ReviewFormProps {
    orderId: string;
    onSuccess?: () => void;
}

export default function ReviewForm({ orderId, onSuccess }: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToastStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            addToast('error', 'Please select a rating');
            return;
        }

        setIsSubmitting(true);

        try {
            await reviewsApi.create({
                orderId,
                rating,
                comment: comment.trim() || undefined,
            });

            addToast('success', 'Review submitted successfully!');
            setRating(0);
            setComment('');
            onSuccess?.();
        } catch (error: any) {
            addToast('error', error.response?.data?.message || 'Failed to submit review');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Rating
                </label>
                <StarRatingInput value={rating} onChange={setRating} />
            </div>

            <div className="mb-4">
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Review (Optional)
                </label>
                <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={1000}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Share your experience with this seller..."
                />
                <p className="mt-1 text-sm text-gray-500">
                    {comment.length}/1000 characters
                </p>
            </div>

            <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
        </form>
    );
}
