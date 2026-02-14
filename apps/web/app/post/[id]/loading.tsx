import { SkeletonStyles } from '@/components/ui/Skeleton';

export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-50">
            <SkeletonStyles />
            {/* Header Skeleton */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-full animate-pulse" />
                    <div className="w-20 h-5 bg-gray-100 rounded animate-pulse" />
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="max-w-xl mx-auto p-4 pb-20">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-4">
                    {/* Header */}
                    <div className="flex gap-3 mb-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="w-32 h-4 bg-gray-100 rounded animate-pulse" />
                            <div className="w-20 h-3 bg-gray-100 rounded animate-pulse" />
                        </div>
                    </div>
                    {/* Content Lines */}
                    <div className="space-y-2 mb-4">
                        <div className="w-full h-4 bg-gray-100 rounded animate-pulse" />
                        <div className="w-full h-4 bg-gray-100 rounded animate-pulse" />
                        <div className="w-3/4 h-4 bg-gray-100 rounded animate-pulse" />
                    </div>
                    {/* Image Placeholder */}
                    <div className="w-full h-64 bg-gray-100 rounded-lg animate-pulse" />
                </div>
            </div>
        </div>
    );
}
