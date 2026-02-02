import { apiClient } from './api-client';

export interface Dispute {
    id: string;
    orderId: string;
    reporterId: string;
    reason: string;
    description: string;
    evidenceImages: string[];
    status: 'open' | 'under_review' | 'resolved' | 'rejected';
    resolution?: string;
    adminNotes?: string;
    createdAt: string;
    resolvedAt?: string;
    order?: {
        id: string;
        status: string;
        totalPriceCents: number;
        currencyCode: string;
    };
    reporter?: {
        id: string;
        email: string;
        profile?: { displayName?: string; avatarUrl?: string };
    };
    resolvedBy?: {
        id: string;
        email: string;
        profile?: { displayName?: string };
    };
}

export interface DisputeStats {
    open: number;
    underReview: number;
    resolved: number;
    rejected: number;
    total: number;
}

export const disputesApi = {
    // User endpoints
    create: async (data: { orderId: string; reason: string; description: string; evidenceImages?: string[] }) => {
        const response = await apiClient.post<Dispute>('/disputes', data);
        return response.data;
    },

    getMyDisputes: async () => {
        const response = await apiClient.get<Dispute[]>('/disputes/my');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await apiClient.get<Dispute>(`/disputes/${id}`);
        return response.data;
    },

    // Admin endpoints
    getAll: async (status?: string, page?: number, limit?: number) => {
        const response = await apiClient.get<any>('/disputes', {
            params: { status, page, limit },
        });
        return response.data;
    },


    getStats: async () => {
        const response = await apiClient.get<DisputeStats>('/disputes/stats/summary');
        return response.data;
    },

    resolve: async (id: string, data: { resolution?: string; adminNotes?: string }) => {
        const response = await apiClient.patch<Dispute>(`/disputes/${id}/resolve`, data);
        return response.data;
    },
};
