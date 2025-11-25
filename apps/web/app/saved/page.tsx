'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SavedListingsPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/wants');
    }, [router]);
    return null;
}
