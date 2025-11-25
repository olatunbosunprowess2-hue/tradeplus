import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthResponse } from './types';
import apiClient from './api-client';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    _hasHydrated: boolean; // Track if persisted state has been loaded
    login: (email: string, password: string) => Promise<void>;
    register: (data: { email: string; password: string; displayName: string }) => Promise<void>;
    logout: () => void;
    setAuth: (data: AuthResponse) => void;
    updateProfile: (data: Partial<User>) => void;
    setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            _hasHydrated: false,

            login: async (email: string, password: string) => {
                try {
                    const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
                    const { accessToken, refreshToken, user } = response.data;

                    if (typeof window !== 'undefined') {
                        localStorage.setItem('accessToken', accessToken);
                        localStorage.setItem('refreshToken', refreshToken);
                    }

                    set({
                        user,
                        accessToken,
                        refreshToken,
                        isAuthenticated: true,
                    });
                } catch (error) {
                    console.error('Login failed:', error);
                    throw error;
                }
            },

            register: async (data) => {
                try {
                    const response = await apiClient.post<AuthResponse>('/auth/register', data);
                    const { accessToken, refreshToken, user } = response.data;

                    if (typeof window !== 'undefined') {
                        localStorage.setItem('accessToken', accessToken);
                        localStorage.setItem('refreshToken', refreshToken);
                    }

                    set({
                        user,
                        accessToken,
                        refreshToken,
                        isAuthenticated: true,
                    });
                } catch (error) {
                    console.error('Registration failed:', error);
                    throw error;
                }
            },

            logout: () => {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                }

                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                });
            },

            setAuth: (data: AuthResponse) => {
                const { accessToken, refreshToken, user } = data;

                if (typeof window !== 'undefined') {
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', refreshToken);
                }

                set({
                    user,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                });
            },

            updateProfile: (data) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...data } : null
                }));
            },

            setHasHydrated: (state) => {
                set({
                    _hasHydrated: state
                });
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            }
        }
    )
);
