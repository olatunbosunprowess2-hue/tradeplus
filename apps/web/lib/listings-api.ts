import apiClient from './api-client';
import type { Listing, PaginatedResponse } from './types';

export interface ListingsQuery {
    search?: string;
    categoryId?: number;
    countryId?: number;
    regionId?: number;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    sellerId?: string;
    page?: number;
    limit?: number;
    isDistressSale?: boolean;
}

export const listingsApi = {
    getAll: async (query: ListingsQuery = {}) => {
        const response = await apiClient.get<PaginatedResponse<Listing>>('/listings', { params: query });
        return response.data;
    },

    getOne: async (id: string) => {
        const response = await apiClient.get<Listing>(`/listings/${id}`);
        return response.data;
    },

    create: async (data: Partial<Listing>) => {
        const response = await apiClient.post<Listing>('/listings', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Listing>) => {
        const response = await apiClient.patch<Listing>(`/listings/${id}`, data);
        return response.data;
    },

    createOffer: async (data: any) => {
        const response = await apiClient.post('/barter/offers', data);
        return response;
    },

    delete: async (id: string) => {
        await apiClient.delete(`/listings/${id}`);
    }
};
