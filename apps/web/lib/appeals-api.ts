import apiClient from './api-client';

export interface CreateAppealData {
    reportId?: string;
    reason: string;
    message: string;
    evidenceImages?: string[];
}

export interface ReviewAppealData {
    decision: 'approved' | 'rejected';
    adminMessage?: string;
}

export const appealsApi = {
    // Submit an appeal
    submitAppeal: (data: CreateAppealData) =>
        apiClient.post('/appeals', data),

    // Get all appeals (user sees their own, admin sees all)
    getAppeals: () =>
        apiClient.get('/appeals'),

    // Review appeal (admin only)
    reviewAppeal: (appealId: string, data: ReviewAppealData) =>
        apiClient.patch(`/appeals/${appealId}/review`, data),
};
