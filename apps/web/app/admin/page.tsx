'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Admin landing page - redirects to the real-time dashboard
 */
export default function AdminPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/admin/dashboard');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );
}
