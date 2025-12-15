'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, _hasHydrated } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!_hasHydrated) return; // Wait for hydration

        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Check if user is admin
        if (user?.role !== 'admin') {
            router.push('/listings');
        }
    }, [isAuthenticated, user, router, _hasHydrated]);

    if (!_hasHydrated || !isAuthenticated || user?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50 print:bg-white">
            <div className="print:hidden">
                <AdminSidebar />
            </div>
            <main className="flex-1 p-8 print:p-0 print:w-full">
                {children}
            </main>
        </div>
    );
}
