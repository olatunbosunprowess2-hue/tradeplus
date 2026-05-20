import { Metadata } from 'next';
import { Suspense } from 'react';
import DistressClient from './DistressClient';
import { ListingsGridSkeleton, SkeletonStyles } from '@/components/ui/Skeleton';

export const metadata: Metadata = {
  title: 'Urgent Distress Sales & Deals',
  description: 'Explore verified distress sales. Quality items priced for urgent cash outs. Safe transactions held in secure escrow.',
  keywords: [
    'distress sales',
    'quick cash deals',
    'cheap second hand items',
    'urgent sales Nigeria',
    'discounted electronics swap',
  ],
};

export default function DistressPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-6">
        <SkeletonStyles />
        <div className="container mx-auto px-4 max-w-7xl">
          <ListingsGridSkeleton count={12} />
        </div>
      </div>
    }>
      <DistressClient />
    </Suspense>
  );
}
