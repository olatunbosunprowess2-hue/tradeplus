'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';

export function AuthSyncer() {
    const refreshProfile = useAuthStore((state) => state.refreshProfile);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    const _hasHydrated = useAuthStore((state) => state._hasHydrated);

    useEffect(() => {
        const handleLogoutEvent = () => {
            useAuthStore.getState().logout();
        };
        window.addEventListener('auth:logout', handleLogoutEvent);
        return () => window.removeEventListener('auth:logout', handleLogoutEvent);
    }, []);

    useEffect(() => {
        if (isAuthenticated && _hasHydrated) {
            // Refresh profile immediately/on mount to ensure role is up to date
            refreshProfile();

            // Background refresh every 2 minutes
            const interval = setInterval(() => {
                refreshProfile();
            }, 120000);

            return () => clearInterval(interval);
        }
    }, [isAuthenticated, _hasHydrated, refreshProfile]);

    return null;
}
