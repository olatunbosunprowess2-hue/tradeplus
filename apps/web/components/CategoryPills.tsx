'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface Category {
    id: number;
    name: string;
    slug: string;
}

export default function CategoryPills() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentCategoryId = searchParams.get('categoryId') || '';
    const [isExpanded, setIsExpanded] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Fetch categories from API
    useEffect(() => {
        apiClient.get<Category[]>('/categories')
            .then(res => setCategories(res.data))
            .catch(err => console.error('Failed to fetch categories:', err));
    }, []);

    const pathname = usePathname();
    // ...
    const handleCategoryClick = (categoryId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (categoryId === '') {
            params.delete('categoryId');
        } else {
            params.set('categoryId', categoryId);
        }
        // Reset page when category changes
        params.delete('page');

        // If on home page, go to listings. Else stay on current page (e.g. distress)
        const targetPath = pathname === '/' ? '/listings' : pathname;
        router.push(`${targetPath}?${params.toString()}`);
    };

    const allCategories = [{ id: 0, name: 'All', slug: 'all' }, ...categories];

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                    Marketplace Categories
                </h2>
            </div>

            {/* Mobile View — Horizontal Scroll */}
            <div className={`
                md:hidden flex gap-2 pb-2 -mx-4 px-4 overflow-x-auto scrollbar-hide
            `}>
                {allCategories.map((category) => {
                    const isActive = (category.id === 0 ? currentCategoryId === '' : currentCategoryId === category.id.toString());
                    return (
                        <button
                            key={category.id}
                            onClick={() => handleCategoryClick(category.id === 0 ? '' : category.id.toString())}
                            className={`
                                whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0
                                ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
                                }
                            `}
                        >
                            {category.name}
                        </button>
                    );
                })}
            </div>

            {/* Desktop View — Flex Wrap with Premium Styling */}
            <div className="hidden md:flex flex-wrap gap-2.5">
                {allCategories.map((category) => {
                    const isActive = (category.id === 0 ? currentCategoryId === '' : currentCategoryId === category.id.toString());
                    return (
                        <button
                            key={category.id}
                            onClick={() => handleCategoryClick(category.id === 0 ? '' : category.id.toString())}
                            className={`
                                px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300
                                ${isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/20 scale-105'
                                    : 'bg-white text-gray-600 border border-gray-100 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/30 hover:shadow-md'
                                }
                            `}
                        >
                            {category.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
