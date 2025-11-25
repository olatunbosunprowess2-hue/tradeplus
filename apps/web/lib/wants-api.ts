import { apiClient } from './api-client';
import { WantItem } from './wants-store';

export const wantsApi = {
    getAll: async () => {
        const response = await apiClient.get<WantItem[]>('/wants');
        return response.data;
    },

    create: async (data: Omit<WantItem, 'id' | 'createdAt' | 'isFulfilled'>) => {
        const response = await apiClient.post<WantItem>('/wants', data);
        return response.data;
    },

    update: async (id: string, data: Partial<WantItem>) => {
        const response = await apiClient.patch<WantItem>(`/wants/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await apiClient.delete(`/wants/${id}`);
    },

    getAllByUser: async (userId: string) => {
        const response = await apiClient.get<WantItem[]>(`/wants/user/${userId}`);
        return response.data;
    },
};
