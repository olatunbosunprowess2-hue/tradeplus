'use client';

import React from 'react';

// Skeleton base component with shimmer animation
function SkeletonBase({ className = '' }: { className?: string }) {
    return (
        <div
            className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded ${className}`}
            style={{
                animation: 'shimmer 1.5s infinite',
            }}
        />
    );
}

// Add shimmer animation via style tag (React 19 compatible)
export function SkeletonStyles() {
    return (
        <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes shimmer {
                0% {
                    background-position: 200% 0;
                    opacity: 0.8;
                }
                50% {
                    opacity: 1;
                }
                100% {
                    background-position: -200% 0;
                    opacity: 0.8;
                }
            }
        `}} />
    );
}

// Listing Card Skeleton
export function ListingCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
            {/* Image placeholder */}
            <SkeletonBase className="h-48 w-full" />

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Title */}
                <div className="space-y-1">
                    <SkeletonBase className="h-4 w-full" />
                    <SkeletonBase className="h-4 w-2/3" />
                </div>

                {/* Price (Blue themed placeholder) */}
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-blue-100 rounded-full animate-pulse" />
                    <SkeletonBase className="h-6 w-24 bg-blue-50/50" />
                </div>

                {/* Tags */}
                <div className="flex gap-2 mb-2">
                    <SkeletonBase className="h-6 w-16 rounded-full bg-gray-50" />
                    <SkeletonBase className="h-6 w-14 rounded-full bg-gray-50" />
                </div>

                {/* Location */}
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-100 animate-pulse" />
                    <SkeletonBase className="h-3 w-1/2" />
                </div>
            </div>
        </div>
    );
}

// Listings Grid Skeleton
export function ListingsGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <>
            <SkeletonStyles />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: count }).map((_, i) => (
                    <ListingCardSkeleton key={i} />
                ))}
            </div>
        </>
    );
}

// Listing Detail Skeleton
export function ListingDetailSkeleton() {
    return (
        <>
            <SkeletonStyles />
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-6 max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Image Gallery */}
                        <div className="space-y-4">
                            <SkeletonBase className="aspect-square w-full rounded-2xl" />
                            <div className="flex gap-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <SkeletonBase key={i} className="w-20 h-20 rounded-lg" />
                                ))}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-6">
                            {/* Badge & Date */}
                            <div className="flex gap-2">
                                <SkeletonBase className="h-6 w-24 rounded-full" />
                                <SkeletonBase className="h-6 w-20" />
                            </div>

                            {/* Title */}
                            <SkeletonBase className="h-8 w-full" />

                            {/* Price */}
                            <SkeletonBase className="h-10 w-1/3" />

                            {/* Tags */}
                            <div className="flex gap-3">
                                <SkeletonBase className="h-8 w-20 rounded-lg" />
                                <SkeletonBase className="h-8 w-24 rounded-lg" />
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <SkeletonBase className="h-14 w-full rounded-lg" />
                                <SkeletonBase className="h-14 w-full rounded-lg" />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <SkeletonBase className="h-5 w-32" />
                                <SkeletonBase className="h-4 w-full" />
                                <SkeletonBase className="h-4 w-full" />
                                <SkeletonBase className="h-4 w-3/4" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// Profile/User Card Skeleton
export function ProfileCardSkeleton() {
    return (
        <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-4">
                <SkeletonBase className="w-14 h-14 rounded-full" />
                <div className="flex-1 space-y-2">
                    <SkeletonBase className="h-5 w-32" />
                    <SkeletonBase className="h-4 w-24" />
                </div>
            </div>
        </div>
    );
}

// Message Skeleton
export function MessageSkeleton() {
    return (
        <div className="flex gap-3 p-4">
            <SkeletonBase className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <SkeletonBase className="h-4 w-24" />
                <SkeletonBase className="h-16 w-3/4 rounded-lg" />
            </div>
        </div>
    );
}

// Conversation List Skeleton
export function ConversationListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <>
            <SkeletonStyles />
            <div className="space-y-1">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 border-b border-gray-100">
                        <SkeletonBase className="w-12 h-12 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between">
                                <SkeletonBase className="h-4 w-32" />
                                <SkeletonBase className="h-3 w-12" />
                            </div>
                            <SkeletonBase className="h-4 w-2/3" />
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
    return (
        <tr className="border-b border-gray-100">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="py-4 px-4">
                    <SkeletonBase className="h-4 w-full" />
                </td>
            ))}
        </tr>
    );
}

// Notification Skeleton
export function NotificationSkeleton() {
    return (
        <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200">
            <SkeletonBase className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <SkeletonBase className="h-4 w-full" />
                <SkeletonBase className="h-3 w-24" />
            </div>
        </div>
    );
}

export function NotificationsListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <>
            <SkeletonStyles />
            <div className="space-y-3">
                {Array.from({ length: count }).map((_, i) => (
                    <NotificationSkeleton key={i} />
                ))}
            </div>
        </>
    );
}
