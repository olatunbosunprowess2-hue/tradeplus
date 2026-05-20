import { Metadata } from 'next';
import DiscoverClient from './DiscoverClient';

export const metadata: Metadata = {
  title: 'Discover Deals, Products & Swap Offers',
  description: 'Browse categories and discover incredible cash deals or swap offers on BarterWave. Nigeria\'s premier barter and distress-sale marketplace.',
  keywords: [
    'swap products',
    'barter marketplace Nigeria',
    'buy and sell electronics',
    'fashion swap',
    'distress sales list',
    'local bartering deals',
  ],
};

export default function DiscoverPage() {
  return <DiscoverClient />;
}
