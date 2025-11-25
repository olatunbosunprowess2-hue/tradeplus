import apiClient from './api-client';

export interface CreateReviewData {
    orderId: string;
    rating: number;
    comment?: string;
}

export interface UpdateReviewData {
    rating?: number;
    comment?: string;
}

export interface ReviewQueryParams {
    userId?: string;
    listingId?: string;
    page?: number;
    limit?: number;
}

export const reviewsApi = {
    // Create a review
    create: (data: CreateReviewData) =>
        apiClient.post('/reviews', data),

    // Get all reviews with optional filters
    getAll: (params?: ReviewQueryParams) =>
        apiClient.get('/reviews', { params }),

    // Get a single review
    getOne: (id: string) =>
        apiClient.get(`/reviews/${id}`),

    // Update a review
    update: (id: string, data: UpdateReviewData) =>
        apiClient.patch(`/reviews/${id}`, data),

    // Delete a review
    delete: (id: string) =>
        apiClient.delete(`/reviews/${id}`),

    // Flag a review
    flag: (id: string) =>
        apiClient.post(`/reviews/${id}/flag`),

    // Admin: Get flagged reviews
    getFlagged: () =>
        apiClient.get('/reviews/admin/flagged'),

    // Admin: Moderate a review
    moderate: (id: string, data: { isPublic?: boolean; flagged?: boolean; adminResponse?: string }) =>
        apiClient.patch(`/reviews/admin/${id}/moderate`, data),
};
