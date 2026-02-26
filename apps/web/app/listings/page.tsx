'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ListingsGridSkeleton, SkeletonStyles } from '@/components/ui/Skeleton';
import HomeTabs from '@/components/home/HomeTabs';
import MarketFeed from '@/components/home/MarketFeed';
import CommunityFeed from '@/components/home/CommunityFeed';

// Rotating tips/taglines for the hero
const heroSlides = [
    { emoji: '🛒', text: 'Discover unique items for cash or barter' },
    { emoji: '🔒', text: 'Trade safely with verified sellers' },
    { emoji: '🔥', text: 'Check out urgent Distress Deals for big savings' },
    { emoji: '💬', text: 'Chat directly with verified sellers' },
    { emoji: '🤝', text: 'Swap items you have for items you need' },
];

function ListingsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Derive tab directly from URL — single source of truth, no race condition
    const activeTab: 'market' | 'community' = searchParams.get('tab') === 'community' ? 'community' : 'market';

    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto-rotate hero slides
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const handleTabChange = (tab: 'market' | 'community') => {
        const params = new URLSearchParams(searchParams.toString());
        if (tab === 'community') {
            params.set('tab', 'community');
            // Clear market-specific params when switching to community
            params.delete('search');
            params.delete('type');
            params.delete('condition');
            params.delete('paymentMode');
            params.delete('minPrice');
            params.delete('maxPrice');
            params.delete('categoryId');
            params.delete('isDistressSale');
            params.delete('countryId');
            params.delete('regionId');
        } else {
            params.delete('tab');
        }
        // Use replace instead of push to prevent back-button issues and scroll jumps
        router.replace(`/listings?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Compact Hero with Rotating Slides */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-4 md:py-5">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex items-center justify-center gap-3 text-center">
                        <span className="text-2xl transition-all duration-500" key={currentSlide}>
                            {heroSlides[currentSlide].emoji}
                        </span>
                        <p className="text-sm md:text-base font-medium text-blue-100 transition-all duration-500">
                            {heroSlides[currentSlide].text}
                        </p>
                    </div>
                    {/* Slide indicators */}
                    <div className="flex justify-center gap-1.5 mt-2">
                        {heroSlides.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentSlide(idx)}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-4' : 'bg-white/40'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="container mx-auto px-4 max-w-7xl pt-4">
                <HomeTabs activeTab={activeTab} onTabChange={handleTabChange} />
            </div>

            {/* Tab Content */}
            <div className="container mx-auto px-4 py-4 max-w-7xl">
                {activeTab === 'market' ? (
                    <MarketFeed />
                ) : (
                    <CommunityFeed />
                )}
            </div>
        </div>
    );
}

export default function ListingsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 py-4">
                <SkeletonStyles />
                <div className="container mx-auto px-4 max-w-7xl">
                    <ListingsGridSkeleton count={6} />
                </div>
            </div>
        }>
            <ListingsContent />
        </Suspense>
    );
}
