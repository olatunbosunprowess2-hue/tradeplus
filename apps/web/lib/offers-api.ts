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
    }
};
