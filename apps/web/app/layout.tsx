import { Outfit } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Toaster } from 'react-hot-toast';
import { Providers } from './providers';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://barterwave.com'),
  title: {
    default: 'BarterWave | Global Marketplace to Buy, Sell & Barter Trade',
    template: '%s | BarterWave Marketplace',
  },
  description: 'The trusted global marketplace for buying, selling, and trading goods value-for-value. Discover local and international deals, secure payments, and verified sellers.',
  keywords: [
    'global marketplace',
    'barter trading platform',
    'buy and sell online',
    'secure online trading',
    'sell used items',
    'buy secondhand goods',
    'trade items online',
    'verified sellers marketplace',
    'distress sales',
    'international marketplace',
    'peer to peer trading'
  ],
  authors: [{ name: 'BarterWave' }],
  creator: 'BarterWave',
  publisher: 'BarterWave',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'BarterWave',
    title: 'BarterWave | Global Marketplace to Buy, Sell & Barter Trade',
    description: 'The trusted global marketplace for buying, selling, and trading goods value-for-value. Discover deals, secure payments, and verified sellers worldwide.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BarterWave Global Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BarterWave | Buy, Sell & Barter Trade Globally',
    description: 'The trusted global marketplace for buying, selling, and trading goods value-for-value.',
    images: ['/og-image.png'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  category: 'marketplace',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#2563eb" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${outfit.className} bg-slate-50`} suppressHydrationWarning>
        <Providers>
          <script
            dangerouslySetInnerHTML={{
              __html: `console.log("BarterWave v0.2.1 loaded - Status: Active");`,
            }}
          />
          <Navbar />
          <main className="pb-20 lg:pb-0">
            {children}
          </main>
          <MobileBottomNav />
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
