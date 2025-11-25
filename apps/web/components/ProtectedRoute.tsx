'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, _hasHydrated } = useAuthStore();

    useEffect(() => {
        // Only redirect if hydration is complete and user is not authenticated
        if (_hasHydrated && !isAuthenticated) {
            // Save the attempted URL to redirect back after login
            sessionStorage.setItem('redirectAfterLogin', pathname);
            router.push('/login');
        }
    }, [isAuthenticated, _hasHydrated, router, pathname]);

    // Show loading while hydrating or if not authenticated after hydration
    if (!_hasHydrated || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return <>{children}</>;
}
