'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const CATEGORIES = [
    'All',
    'Mobile Phones & Tablets',
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Beauty & Health',
    'Sports & Outdoors',
    'Vehicles',
    'Services',
    'Books & Media',
    'Jobs'
];

export default function CategoryPills() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get('category') || 'All';
    const [isExpanded, setIsExpanded] = useState(false);

    const handleCategoryClick = (category: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (category === 'All') {
            params.delete('category');
        } else {
            params.set('category', category);
        }
        // Reset page when category changes
        params.delete('page');
        router.push(`/listings?${params.toString()}`);
    };

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex flex-wrap gap-2">
                {(isExpanded ? CATEGORIES : CATEGORIES.slice(0, 4)).map((category) => (
                    <button
                        key={category}
                        onClick={() => handleCategoryClick(category)}
                        className={`
                            whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all
                            ${currentCategory === category
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                            }
                        `}
                    >
                        {category}
                    </button>
                ))}
                {!isExpanded && (
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-blue-600 border border-gray-200 hover:bg-gray-200 transition-all"
                    >
                        See All
                    </button>
                )}
                {isExpanded && (
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 transition-all"
                    >
                        Show Less
                    </button>
                )}
            </div>

            {/* Desktop View */}
            <div className="hidden md:flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                    <button
                        key={category}
                        onClick={() => handleCategoryClick(category)}
                        className={`
                            px-4 py-2 rounded-full text-sm font-medium transition-all
                            ${currentCategory === category
                                ? 'bg-gray-900 text-white shadow-md transform scale-105'
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                            }
                        `}
                    >
                        {category}
                    </button>
                ))}
            </div>
        </div>
    );
}
