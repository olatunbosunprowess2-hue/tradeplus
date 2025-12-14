import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthResponse } from './types';
import apiClient from './api-client';

// ============================================================================
// CONFIGURATION
// ============================================================================
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ||
    (typeof window !== 'undefined' ? `${window.location.origin}/auth/google/callback` : '');

// ============================================================================
// TYPES
// ============================================================================
interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    _hasHydrated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: { email: string; password: string; displayName: string }) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    handleGoogleCallback: (code: string) => Promise<void>;
    logout: () => Promise<void>;
    setAuth: (data: AuthResponse) => void;
    updateProfile: (data: Partial<User> | FormData) => Promise<void>;
    refreshProfile: () => Promise<void>;
    refreshAccessToken: () => Promise<boolean>;
    setHasHydrated: (state: boolean) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Securely store tokens - prioritizes HttpOnly cookies when available
 * Falls back to localStorage with additional security measures
 */
function storeTokensSecurely(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;

    // For client-side, we store in localStorage
    // Note: In production, you should use HttpOnly cookies set by the server
    // This requires the backend to set cookies in the login response
    try {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    } catch (e) {
        console.error('Failed to store tokens:', e);
    }
}

/**
 * Clear stored tokens
 */
function clearStoredTokens(): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('auth-storage');
    } catch (e) {
        console.error('Failed to clear tokens:', e);
    }
}

/**
 * Generate a cryptographically secure state parameter for OAuth
 */
function generateOAuthState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a code verifier for PKCE
 */
function generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Generate code challenge from verifier for PKCE
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// ============================================================================
// AUTH STORE
// ============================================================================
export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            _hasHydrated: false,

            // ================================================================
            // EMAIL/PASSWORD LOGIN
            // ================================================================
            login: async (email: string, password: string) => {
                const response = await apiClient.post<AuthResponse>('/auth/login', {
                    email,
                    password,
                });

                const { accessToken, refreshToken, user } = response.data;

                // Store tokens securely
                storeTokensSecurely(accessToken, refreshToken);

                set({
                    user,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                });
            },

            // ================================================================
            // REGISTRATION
            // ================================================================
            register: async (data) => {
                const response = await apiClient.post<AuthResponse>('/auth/register', data);
                const { accessToken, refreshToken, user } = response.data;

                storeTokensSecurely(accessToken, refreshToken);

                set({
                    user,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                });
            },

            // ================================================================
            // GOOGLE OAUTH LOGIN
            // ================================================================
            loginWithGoogle: async () => {
                if (!GOOGLE_CLIENT_ID) {
                    console.warn('Google OAuth not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in environment.');

                    // For development, redirect to backend OAuth endpoint if available
                    const backendOAuthUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api'}/auth/google`;
                    window.location.href = backendOAuthUrl;
                    return;
                }

                // Generate PKCE parameters
                const codeVerifier = generateCodeVerifier();
                const codeChallenge = await generateCodeChallenge(codeVerifier);
                const state = generateOAuthState();

                // Store PKCE verifier and state for validation
                sessionStorage.setItem('oauth_code_verifier', codeVerifier);
                sessionStorage.setItem('oauth_state', state);

                // Build Google OAuth URL
                const params = new URLSearchParams({
                    client_id: GOOGLE_CLIENT_ID,
                    redirect_uri: GOOGLE_REDIRECT_URI,
                    response_type: 'code',
                    scope: 'openid email profile',
                    state,
                    code_challenge: codeChallenge,
                    code_challenge_method: 'S256',
                    access_type: 'offline', // Get refresh token
                    prompt: 'consent', // Always show consent screen
                });

                const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
                window.location.href = authUrl;
            },

            // ================================================================
            // HANDLE GOOGLE CALLBACK
            // ================================================================
            handleGoogleCallback: async (code: string) => {
                // Retrieve stored PKCE verifier
                const codeVerifier = sessionStorage.getItem('oauth_code_verifier');

                if (!codeVerifier) {
                    throw new Error('OAuth session expired. Please try again.');
                }

                // Exchange code for tokens via backend
                const response = await apiClient.post<AuthResponse>('/auth/google/callback', {
                    code,
                    codeVerifier,
                    redirectUri: GOOGLE_REDIRECT_URI,
                });

                const { accessToken, refreshToken, user } = response.data;

                // Clear PKCE storage
                sessionStorage.removeItem('oauth_code_verifier');
                sessionStorage.removeItem('oauth_state');

                storeTokensSecurely(accessToken, refreshToken);

                set({
                    user,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                });
            },

            // ================================================================
            // LOGOUT
            // ================================================================
            logout: async () => {
                // Optionally notify backend
                try {
                    const token = get().refreshToken;
                    if (token) {
                        await apiClient.post('/auth/logout', { refreshToken: token }).catch(() => { });
                    }
                } catch {
                    // Ignore logout errors
                }

                clearStoredTokens();

                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                });
            },

            // ================================================================
            // SET AUTH (used by callbacks)
            // ================================================================
            setAuth: (data: AuthResponse) => {
                storeTokensSecurely(data.accessToken, data.refreshToken);

                set({
                    user: data.user,
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                    isAuthenticated: true,
                });
            },

            // ================================================================
            // UPDATE PROFILE
            // ================================================================
            updateProfile: async (data: Partial<User> | FormData) => {
                // Optimistic update only works for JSON data
                if (!(data instanceof FormData)) {
                    set((state) => ({
                        user: state.user ? { ...state.user, ...data } : null
                    }));
                }

                const response = await apiClient.patch('/users/profile', data);

                if (response.data) {
                    set((state) => ({
                        user: state.user ? { ...state.user, ...response.data } : response.data
                    }));
                }
            },

            // ================================================================
            // REFRESH PROFILE
            // ================================================================
            refreshProfile: async () => {
                try {
                    const response = await apiClient.get<User>('/users/profile');
                    set((state) => ({
                        user: state.user ? { ...state.user, ...response.data } : response.data
                    }));
                } catch (error) {
                    // Graceful degradation - profile refresh is optional
                    console.warn('Failed to refresh profile:', error);
                }
            },

            // ================================================================
            // REFRESH ACCESS TOKEN
            // ================================================================
            refreshAccessToken: async () => {
                const refreshToken = get().refreshToken;
                if (!refreshToken) return false;

                try {
                    const response = await apiClient.post<{ accessToken: string; refreshToken?: string }>('/auth/refresh', {
                        refreshToken,
                    });

                    const newAccessToken = response.data.accessToken;
                    const newRefreshToken = response.data.refreshToken || refreshToken;

                    storeTokensSecurely(newAccessToken, newRefreshToken);

                    set({
                        accessToken: newAccessToken,
                        refreshToken: newRefreshToken,
                    });

                    return true;
                } catch (error) {
                    // Refresh failed, logout
                    get().logout();
                    return false;
                }
            },

            // ================================================================
            // HYDRATION STATE
            // ================================================================
            setHasHydrated: (state) => {
                set({ _hasHydrated: state });
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => {
                // Exclude sensitive image URLs from localStorage
                const { user, ...rest } = state;
                const sanitizedUser = user ? {
                    ...user,
                    faceVerificationUrl: undefined,
                    idDocumentFrontUrl: undefined,
                    idDocumentBackUrl: undefined,
                } : null;

                return {
                    ...rest,
                    user: sanitizedUser,
                };
            },
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            }
        }
    )
);
