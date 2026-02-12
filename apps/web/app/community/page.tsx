'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CommunityRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/listings?tab=community');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500 font-medium">Loading Community Feed...</p>
            </div>
        </div>
    );
}
