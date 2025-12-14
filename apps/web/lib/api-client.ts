import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

export const apiClient = axios.create({
    baseURL: API_URL,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and we haven't retried yet, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
                if (refreshToken) {
                    // Try to refresh the token
                    const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
                    const { accessToken, refreshToken: newRefreshToken } = response.data;

                    // Store new tokens
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('accessToken', accessToken);
                        localStorage.setItem('refreshToken', newRefreshToken);
                    }

                    // Update the original request header
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                    // Retry the original request
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // If refresh fails, logout
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                }
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export const confirmTrade = (offerId: string) => apiClient.post(`/barter/offers/${offerId}/confirm`);
export const getReceipt = (offerId: string) => apiClient.post(`/barter/offers/${offerId}/receipt`);

export const getCountries = () => apiClient.get<any[]>('/countries');
export const getRegions = (countryId: number) => apiClient.get<any[]>(`/countries/${countryId}/regions`);

export default apiClient;
