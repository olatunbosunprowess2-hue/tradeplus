import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

// Create base instance WITHOUT baseURL to avoid Axios's path resolution quirks for nested paths
export const apiClient = axios.create({
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Robust Request Interceptor
 * 1. Explicitly prepends the API_URL to relative paths (prevents /api stripping bug)
 * 2. Manually injects Authorization header from localStorage (cross-origin tunnel fallback)
 * 3. Provides debug logging in development
 */
apiClient.interceptors.request.use((config) => {
    // 1. URL Construction
    if (config.url && !config.url.startsWith('http')) {
        const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';
        const base = rawApiUrl.startsWith('http') ? rawApiUrl :
            (typeof window !== 'undefined' ? window.location.origin + rawApiUrl : rawApiUrl);

        const normalizedBase = base.endsWith('/') ? base : `${base}/`;
        const relativeUrl = config.url.startsWith('/') ? config.url.substring(1) : config.url;

        config.url = normalizedBase + relativeUrl;
    }

    // 2. Token Injection (Manual fallback for cross-origin tunnels where cookies are blocked)
    // Check the correct storage based on rememberMe setting
    if (typeof window !== 'undefined') {
        const rememberMe = localStorage.getItem('rememberMe') === 'true';
        const storage = rememberMe ? localStorage : sessionStorage;
        // Try the preferred storage first, then fallback to the other
        const token = storage.getItem('accessToken') ||
            (rememberMe ? sessionStorage.getItem('accessToken') : localStorage.getItem('accessToken'));
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }

    // 3. FormData handling - delete Content-Type to let browser set it with boundary
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    // 4. Debug logging in development
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
        console.log(`🚀 [API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});



// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and we haven't retried yet, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Prevent infinite loops if refresh endpoint itself returns 401
            if (originalRequest.url?.includes('/auth/refresh')) {
                if (typeof window !== 'undefined') {
                    // Clear persisted auth state to break the loop
                    localStorage.removeItem('auth-storage');
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('rememberMe');
                    sessionStorage.removeItem('auth-storage');
                    sessionStorage.removeItem('accessToken');
                    sessionStorage.removeItem('refreshToken');
                    // Only redirect if not already on login/register page
                    const currentPath = window.location.pathname;
                    if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(error);
            }

            try {
                // Call refresh endpoint - cookies are sent automatically
                await apiClient.post('/auth/refresh');

                // Retry the original request
                return apiClient(originalRequest);
            } catch (refreshError) {
                // If refresh fails, logout
                if (typeof window !== 'undefined') {
                    // Clear persisted auth state to break the loop
                    localStorage.removeItem('auth-storage');
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('rememberMe');
                    sessionStorage.removeItem('auth-storage');
                    sessionStorage.removeItem('accessToken');
                    sessionStorage.removeItem('refreshToken');
                    // Only redirect if not already on login/register page
                    const currentPath = window.location.pathname;
                    if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
                        window.location.href = '/login';
                    }
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
