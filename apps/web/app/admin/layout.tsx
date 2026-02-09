'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { canAccessAdminPanel } from '@/lib/rbac';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, _hasHydrated } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Close sidebar when navigating on mobile
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!_hasHydrated) return; // Wait for hydration

        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Check if user has access to admin panel
        if (!canAccessAdminPanel(user)) {
            router.push('/listings');
        }
    }, [isAuthenticated, user, router, _hasHydrated]);

    if (!_hasHydrated || !isAuthenticated || !canAccessAdminPanel(user)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 print:bg-white relative">
            {/* Mobile Header - scrolls with content */}
            <div className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between shadow-sm shrink-0">
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Admin Panel
                </h2>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 -mr-2 text-gray-600 hover:text-gray-900 focus:outline-none"
                    aria-label="Toggle Sidebar"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isSidebarOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Wrapper */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
                print:hidden bg-white md:bg-transparent
                md:relative md:translate-x-0
                ${isSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}
            `}>
                <AdminSidebar />
            </div>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 print:p-0 print:w-full overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
