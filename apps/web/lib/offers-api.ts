import apiClient from './api-client';
import type { BarterOffer } from './types';

export interface CreateOfferDto {
    targetListingId: string;
    offeredItems?: { listingId: string; quantity: number }[];
    offeredCashCents?: number;
    message?: string;
}

export interface CounterOfferDto {
    offeredItems?: { listingId: string; quantity: number }[];
    offeredCashCents?: number;
    message?: string;
}

export interface OfferQuery {
    role?: 'buyer' | 'seller';
    status?: string;
    listingId?: string;
    page?: number;
    limit?: number;
}

export const offersApi = {
    create: async (data: CreateOfferDto) => {
        const response = await apiClient.post<BarterOffer>('/barter/offers', data);
        return response.data;
    },

    getAll: async (query: OfferQuery = {}) => {
        const response = await apiClient.get<BarterOffer[]>('/barter/offers', { params: query });
        return response.data;
    },

    getOne: async (id: string) => {
        const response = await apiClient.get<BarterOffer>(`/barter/offers/${id}`);
        return response.data;
    },

    accept: async (id: string) => {
        const response = await apiClient.patch<BarterOffer>(`/barter/offers/${id}/accept`);
        return response.data;
    },

    reject: async (id: string) => {
        const response = await apiClient.patch<BarterOffer>(`/barter/offers/${id}/reject`);
        return response.data;
    },

    counter: async (id: string, data: CounterOfferDto) => {
        const response = await apiClient.post<BarterOffer>(`/barter/offers/${id}/counter`, data);
        return response.data;
    },

    markPaid: async (id: string) => {
        const response = await apiClient.patch<BarterOffer>(`/barter/offers/${id}/mark-paid`);
        return response.data;
    },

    confirmReceipt: async (id: string) => {
        const response = await apiClient.patch<BarterOffer>(`/barter/offers/${id}/confirm-receipt`);
        return response.data;
    },

    extendTimer: async (id: string) => {
        const response = await apiClient.patch<BarterOffer | { message: string }>(`/barter/offers/${id}/extend`);
        return response.data;
    },

    getBrandSettings: async () => {
        const response = await apiClient.get('/barter/brand-settings');
        return response.data;
    },

    updateBrandSettings: async (data: {
        requireDownpayment?: boolean;
        downpaymentType?: 'FIXED' | 'PERCENTAGE';
        downpaymentValue?: number;
        defaultTimerDuration?: number;
    }) => {
        const response = await apiClient.patch('/barter/brand-settings', data);
        return response.data;
    },
};
