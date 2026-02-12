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

export interface SidebarCounts {
    users: number;
    listings: number;
    reviews: number;
    reports: number;
    appeals: number;
    disputes: number;
    security: number;
    pendingBrands: number;
    breakdown: {
        pendingVerifications: number;
        suspendedUsers: number;
        suspendedListings: number;
        flaggedReviews: number;
        openReports: number;
        openDisputes: number;
        pendingAppeals: number;
        blockedIps: number;
        multiReportedUsers: number;
    };
}

export interface AdminUserQuery {
    search?: string;
    status?: string;
    role?: string;
    verificationStatus?: string;
    page?: number;
    limit?: number;
}


export interface AdminListingQuery {
    search?: string;
    status?: string;
    categoryId?: number;
    isDistressSale?: 'true' | 'false';
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

    getUserReports: (userId: string) =>
        apiClient.get(`/admin/users/${userId}/reports`),

    // Listings
    getListings: (query?: AdminListingQuery) =>
        apiClient.get('/admin/listings', { params: query }),

    updateListingStatus: (id: string, data: UpdateListingStatusData) =>
        apiClient.patch(`/admin/listings/${id}/status`, data),

    // Stats
    getStats: () =>
        apiClient.get<AdminStats>('/admin/stats'),

    // Sidebar notification counts
    getSidebarCounts: () =>
        apiClient.get<SidebarCounts>('/admin/sidebar-counts'),

    // Reports
    getReports: (query?: { status?: string, page?: number, limit?: number }) =>
        apiClient.get('/admin/reports', { params: query }),


    resolveReport: (reportId: string, adminMessage?: string) =>
        apiClient.patch(`/reports/${reportId}/resolve`, { adminMessage }),

    deleteReportedListing: (reportId: string, adminMessage?: string) =>
        apiClient.delete(`/reports/${reportId}/delete-listing`, { data: { adminMessage } }),

    // Trades
    getTrades: (query?: { status?: string; downpaymentStatus?: string; search?: string; page?: number; limit?: number }) =>
        apiClient.get('/admin/trades', { params: query }),

    // User Verification Toggle
    toggleUserVerification: (id: string, verified: boolean) =>
        apiClient.patch(`/admin/users/${id}/verify`, { verified }),
};
