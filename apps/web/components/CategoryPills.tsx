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
        <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
            </div>

            {/* Mobile View — horizontal scroll so See All stays inline */}
            <div className="md:hidden flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                {(isExpanded ? allCategories : allCategories.slice(0, 4)).map((category) => (
                    <button
                        key={category.id}
                        onClick={() => handleCategoryClick(category.id === 0 ? '' : category.id.toString())}
                        className={`
                            whitespace-nowrap px-2.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0
                            ${(category.id === 0 ? currentCategoryId === '' : currentCategoryId === category.id.toString())
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                            }
                        `}
                    >
                        {category.name}
                    </button>
                ))}
                {!isExpanded && allCategories.length > 4 && (
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="whitespace-nowrap px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-blue-600 border border-gray-200 hover:bg-gray-200 transition-all shrink-0"
                    >
                        See All
                    </button>
                )}
                {isExpanded && (
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="whitespace-nowrap px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 transition-all shrink-0"
                    >
                        Show Less
                    </button>
                )}
            </div>

            {/* Desktop View */}
            <div className="hidden md:flex flex-wrap gap-2">
                {allCategories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => handleCategoryClick(category.id === 0 ? '' : category.id.toString())}
                        className={`
                            px-4 py-2 rounded-full text-sm font-medium transition-all
                            ${(category.id === 0 ? currentCategoryId === '' : currentCategoryId === category.id.toString())
                                ? 'bg-gray-900 text-white shadow-md transform scale-105'
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                            }
                        `}
                    >
                        {category.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
