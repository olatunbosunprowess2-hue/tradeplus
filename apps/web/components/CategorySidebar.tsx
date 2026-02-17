'use client';

import {
    Smartphone,
    Laptop,
    Home,
    Shirt,
    Car,
    Hammer,
    Music,
    Gamepad2,
    Baby,
    HeartPulse,
    Dumbbell,
    Briefcase,
    BookOpen,
    Camera,
    Dog,
    Gem,
    Building2,
    Armchair,
    UtensilsCrossed,
    Cpu,
    Tv,
    Palette,
    Printer,
    Package,
    ChevronRight,
    LayoutGrid
} from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface Category {
    id: number;
    name: string;
    slug: string;
}

// Map slug or ID to Lucide icons
const categoryIconMap: Record<string, any> = {
    'electronics': Tv,
    'fashion': Shirt,
    'mobile-phones': Smartphone,
    'home-garden': Home,
    'sports': Dumbbell,
    'beauty': HeartPulse,
    'vehicles': Car,
    'services': Hammer,
    'books': BookOpen,
    'jobs': Briefcase,
    'computers': Laptop,
    'gaming': Gamepad2,
    'furniture': Armchair,
    'real-estate': Building2,
    'baby-kids': Baby,
    'musical-instruments': Music,
    'agriculture': UtensilsCrossed,
    'building-materials': Hammer,
    'jewelry': Gem,
    'appliances': Cpu,
    'art-collectibles': Palette,
    'photography': Camera,
    'pets': Dog,
    'office': Printer,
    'other': Package
};

export default function CategorySidebar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const currentCategoryId = searchParams.get('categoryId') || '';

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await apiClient.get<Category[]>('/categories');
            return res.data;
        }
    });

    const handleCategoryClick = (categoryId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (categoryId === '') {
            params.delete('categoryId');
        } else {
            params.set('categoryId', categoryId);
        }
        params.delete('page');

        const targetPath = pathname === '/' ? '/listings' : pathname;
        router.push(`${targetPath}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full max-h-[calc(100vh-120px)]">
            <div className="p-4 border-b border-gray-50 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Categories</h2>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
                {/* All Categories Option */}
                <button
                    onClick={() => handleCategoryClick('')}
                    className={`w-full flex items-center justify-between px-4 py-2.5 transition-all text-left group ${currentCategoryId === ''
                            ? 'bg-blue-50 text-blue-600 font-bold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <Package className={`w-4 h-4 ${currentCategoryId === '' ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`} />
                        <span className="text-xs">All Categories</span>
                    </div>
                    {currentCategoryId === '' && <ChevronRight className="w-3 h-3" />}
                </button>

                {categories.map((category) => {
                    const IconComp = categoryIconMap[category.slug] || Package;
                    const isActive = currentCategoryId === category.id.toString();

                    return (
                        <button
                            key={category.id}
                            onClick={() => handleCategoryClick(category.id.toString())}
                            className={`w-full flex items-center justify-between px-4 py-2.5 transition-all text-left group ${isActive
                                    ? 'bg-blue-50 text-blue-600 font-bold'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <IconComp className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`} />
                                <span className="text-xs truncate max-w-[140px]">{category.name}</span>
                            </div>
                            {isActive && <ChevronRight className="w-3 h-3 transition-transform" />}
                            {!isActive && <ChevronRight className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
