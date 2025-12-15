import apiClient from './api-client';

export interface AdminStats {
    totalUsers: number;
    activeUsers: number;
    totalListings: number;
    activeListings: number;
    totalOrders: number;
    totalRevenue: number;
    flaggedReviews: number;
    openReports: number;
}

export interface AdminUserQuery {
    search?: string;
    status?: string;
    role?: string;
    page?: number;
    limit?: number;
}

export interface AdminListingQuery {
    search?: string;
    status?: string;
    category?: string;
    page?: number;
    limit?: number;
}

export interface UpdateUserStatusData {
    status?: string;
    verificationStatus?: string;
    rejectionReason?: string;
    adminMessage?: string;
}

export interface UpdateListingStatusData {
    status: string;
}

export const adminApi = {
    // Users
    getUsers: (query?: AdminUserQuery) =>
        apiClient.get('/admin/users', { params: query }),

    getUser: (id: string) =>
        apiClient.get(`/admin/users/${id}`),

    updateUserStatus: (id: string, data: UpdateUserStatusData) =>
        apiClient.patch(`/admin/users/${id}/status`, data),

    // Listings
    getListings: (query?: AdminListingQuery) =>
        apiClient.get('/admin/listings', { params: query }),

    updateListingStatus: (id: string, data: UpdateListingStatusData) =>
        apiClient.patch(`/admin/listings/${id}/status`, data),

    // Stats
    getStats: () =>
        apiClient.get<AdminStats>('/admin/stats'),

    // Reports
    getReports: () =>
        apiClient.get('/reports'),

    resolveReport: (reportId: string, adminMessage?: string) =>
        apiClient.patch(`/reports/${reportId}/resolve`, { adminMessage }),

    deleteReportedListing: (reportId: string, adminMessage?: string) =>
        apiClient.delete(`/reports/${reportId}/delete-listing`, { data: { adminMessage } }),
};
