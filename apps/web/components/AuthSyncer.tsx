'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { io } from 'socket.io-client';

export function AuthSyncer() {
    const refreshProfile = useAuthStore((state) => state.refreshProfile);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    const currentUserId = user?.id;

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

    // Global Presence Heartbeat
    useEffect(() => {
        if (!isAuthenticated || !_hasHydrated || !currentUserId) return;

        const socketUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api').replace('/api', '');
        const socket = io(`${socketUrl}/activity`, {
            transports: ['websocket'],
        });

        const sendHeartbeat = () => {
            if (socket.connected) {
                socket.emit('heartbeat');
            }
        };

        socket.on('connect', () => {
            socket.emit('join', currentUserId);
            sendHeartbeat();
        });

        // Heartbeat every 30s
        const heartbeatInterval = setInterval(sendHeartbeat, 30000);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                sendHeartbeat();
            }
        };

        const handleFocus = () => {
            sendHeartbeat();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(heartbeatInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            socket.disconnect();
        };
    }, [isAuthenticated, _hasHydrated, currentUserId]);

    return null;
}
