'use client';

import Link from 'next/link';
import { sanitizeUrl } from '@/lib/utils';

interface CategoryCardProps {
    name: string;
    icon: string;
    href: string;
    count?: number;
    image?: string;
}

export default function CategoryCard({ name, icon, href, count, image }: CategoryCardProps) {
    return (
        <Link
            href={href}
            className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group"
            style={{ borderColor: 'var(--color-gray-200)' }}
        >
            <div
                className="w-16 h-16 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: 'var(--color-primary-pale)' }}
            >
                {image ? (
                    <img src={sanitizeUrl(image)} alt={name} className="w-10 h-10 object-contain" />
                ) : (
                    <span className="text-3xl">{icon}</span>
                )}
            </div>
            <span className="font-semibold text-sm text-center" style={{ color: 'var(--color-text-blue-600)' }}>
                {name}
            </span>
            {count !== undefined && (
                <span className="text-xs text-gray-500 mt-1">
                    {count} items
                </span>
            )}
        </Link>
    );
}
