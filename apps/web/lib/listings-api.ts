import apiClient from './api-client';
import type { Listing } from './types';

export interface ListingsQuery {
    search?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    sellerId?: string;
    page?: number;
    limit?: number;
}

export const listingsApi = {
    getAll: async (query: ListingsQuery = {}) => {
        const response = await apiClient.get<Listing[]>('/listings', { params: query });
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

    delete: async (id: string) => {
        await apiClient.delete(`/listings/${id}`);
    }
};
