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
    isAuthenticated: boolean;
    rememberMe: boolean;
    _hasHydrated: boolean;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    register: (data: { email: string; password: string; displayName: string }) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    handleGoogleCallback: (code: string) => Promise<void>;
    logout: () => Promise<void>;
    setAuth: (user: User) => void;
    updateProfile: (data: Partial<User> | FormData) => Promise<void>;
    refreshProfile: () => Promise<void>;
    checkAuth: () => Promise<boolean>;
    setHasHydrated: (state: boolean) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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
            isAuthenticated: false,
            rememberMe: false,
            _hasHydrated: false,

            // ================================================================
            // EMAIL/PASSWORD LOGIN
            // ================================================================
            login: async (email: string, password: string, rememberMe: boolean = false) => {
                // CRITICAL: Clear any existing session data BEFORE attempting login
                // This prevents "Account Crossover" where an old token is sent with the login request
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('auth-storage');
                    sessionStorage.removeItem('accessToken');
                    sessionStorage.removeItem('refreshToken');
                    sessionStorage.removeItem('auth-storage');
                }

                const response = await apiClient.post<AuthResponse>('/auth/login', {
                    email,
                    password,
                });

                // Store tokens based on rememberMe preference
                // sessionStorage = cleared when browser closes
                // localStorage = persistent across browser sessions
                if (typeof window !== 'undefined') {
                    const storage = rememberMe ? localStorage : sessionStorage;
                    storage.setItem('accessToken', response.data.accessToken);
                    storage.setItem('refreshToken', response.data.refreshToken);
                    // Also save rememberMe flag permanently so we know which storage to check
                    localStorage.setItem('rememberMe', rememberMe ? 'true' : 'false');
                }

                set({
                    user: response.data.user,
                    isAuthenticated: true,
                    rememberMe,
                });
            },

            // ================================================================
            // REGISTRATION
            // ================================================================
            register: async (data) => {
                const response = await apiClient.post<AuthResponse>('/auth/register', data);

                // Store tokens in localStorage as fallback
                if (typeof window !== 'undefined') {
                    localStorage.setItem('accessToken', response.data.accessToken);
                    localStorage.setItem('refreshToken', response.data.refreshToken);
                }

                set({
                    user: response.data.user,
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
                    let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';
                    if (!baseUrl.endsWith('/api')) {
                        baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
                        baseUrl += '/api';
                    }
                    const backendOAuthUrl = `${baseUrl}/auth/google`;
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

                // Store tokens in localStorage
                if (typeof window !== 'undefined') {
                    localStorage.setItem('accessToken', response.data.accessToken);
                    localStorage.setItem('refreshToken', response.data.refreshToken);
                }

                // Clear PKCE storage
                sessionStorage.removeItem('oauth_code_verifier');
                sessionStorage.removeItem('oauth_state');

                set({
                    user: response.data.user,
                    isAuthenticated: true,
                });
            },

            // ================================================================
            // LOGOUT
            // ================================================================
            logout: async () => {
                // Clear state immediately to prevent stale data bleeding
                set({
                    user: null,
                    isAuthenticated: false,
                    rememberMe: false,
                });

                // Optionally notify backend to clear cookies
                try {
                    await apiClient.post('/auth/logout').catch(() => { });
                } catch {
                    // Ignore logout errors
                }

                // Clear tokens from BOTH storages to prevent data bleeding between accounts
                if (typeof window !== 'undefined') {
                    // Clear localStorage
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('auth-storage');
                    localStorage.removeItem('rememberMe');
                    // Clear sessionStorage
                    sessionStorage.removeItem('accessToken');
                    sessionStorage.removeItem('refreshToken');
                    sessionStorage.removeItem('auth-storage');
                }
            },

            // ================================================================
            // SET AUTH (used by callbacks)
            // ================================================================
            setAuth: (user: User) => {
                set({
                    user,
                    isAuthenticated: true,
                });
            },

            // ================================================================
            // UPDATE PROFILE
            // ================================================================
            updateProfile: async (data: Partial<User> | FormData) => {
                // Optimistic update only works for JSON data
                if (!(data instanceof FormData)) {
                    set((state) => {
                        if (!state.user) return { user: null };

                        const profileFields = ['displayName', 'bio', 'avatarUrl', 'countryId', 'regionId'];
                        const newUser = { ...state.user };
                        const updateData = data as any;

                        // Handle profile fields
                        const profileUpdates: any = {};
                        profileFields.forEach(field => {
                            if (updateData[field] !== undefined) {
                                profileUpdates[field] = updateData[field];
                            }
                        });

                        if (Object.keys(profileUpdates).length > 0) {
                            newUser.profile = { ...(newUser.profile || {}), ...profileUpdates };
                        }

                        // Handle root user fields
                        const rootFields = ['firstName', 'lastName', 'phoneNumber', 'locationAddress', 'locationLat', 'locationLng', 'onboardingCompleted', 'city', 'state', 'countryId'];
                        rootFields.forEach(field => {
                            if (updateData[field] !== undefined) {
                                (newUser as any)[field] = updateData[field];
                            }
                        });

                        return { user: newUser };
                    });
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
                } catch (error: any) {
                    // If 401, user session is invalid - clear auth state
                    if (error?.response?.status === 401) {
                        set({
                            user: null,
                            isAuthenticated: false,
                        });
                    } else {
                        // Other errors - graceful degradation
                        console.warn('Failed to refresh profile:', error);
                    }
                }
            },

            // ================================================================
            // CHECK AUTH (REFRESH TOKEN)
            // ================================================================
            checkAuth: async () => {
                try {
                    // Try to hit a protected endpoint or refresh endpoint to verify cookie validity
                    const response = await apiClient.get<User>('/auth/me'); // Or just profile

                    set({
                        user: response.data,
                        isAuthenticated: true,
                    });

                    return true;
                } catch (error) {
                    // If check fails, we might try to refresh?
                    // But apiClient interceptor usually handles refresh. 
                    // If everything fails, we are not auth.
                    set({
                        isAuthenticated: false,
                        user: null,
                    });
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
                // Persistent store mainly for user profile data for UX
                // Auth validity is now determined by the cookie, but we assume
                // valid if state says so until an API call proves otherwise (401).

                const { user, isAuthenticated, ...rest } = state;
                const sanitizedUser = user ? {
                    ...user,
                    faceVerificationUrl: undefined,
                    idDocumentFrontUrl: undefined,
                    idDocumentBackUrl: undefined,
                } : null;

                return {
                    user: sanitizedUser,
                    isAuthenticated, // Optimistically persist auth state
                };
            },
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            }
        }
    )
);

