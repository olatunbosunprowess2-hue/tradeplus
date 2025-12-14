'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';

export function AuthSyncer() {
    const refreshProfile = useAuthStore((state) => state.refreshProfile);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    useEffect(() => {
        if (isAuthenticated) {
            // Refresh profile immediately/on mount to ensure role is up to date
            refreshProfile();

            // Optional: Set up an interval or focus listener if 
            // we really want "real-time" without reload
            // For now, refreshing on mount/navigation is usually what is expected.
            const interval = setInterval(() => {
                refreshProfile();
            }, 30000); // Check every 30 seconds? 

            return () => clearInterval(interval);
        }
    }, [isAuthenticated, refreshProfile]);

    return null;
}
