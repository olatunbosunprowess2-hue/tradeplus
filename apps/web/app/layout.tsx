import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Toaster } from 'react-hot-toast';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'BarterWave - Buy, Sell & Trade Across Africa',
    template: '%s | BarterWave',
  },
  description: 'Africa\'s trusted marketplace for buying, selling, and trading goods. Verified sellers and easy barter trading.',
  keywords: [
    'buy and sell Africa',
    'online marketplace Africa',
    'barter trading',
    'secure payment',
    'sell items online',
    'buy used items',
    'trade goods Africa',
    'secure marketplace',
    'verified sellers',
    'distress sales',
    'African marketplace',
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
    title: 'BarterWave - Buy, Sell & Trade Across Africa',
    description: 'Africa\'s trusted marketplace for buying, selling, and trading goods. Verified sellers and secure transactions.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BarterWave Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BarterWave - Buy, Sell & Trade Across Africa',
    description: 'Africa\'s trusted marketplace for buying, selling, and trading goods.',
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
      <body className={`${inter.className} bg-slate-50`} suppressHydrationWarning>
        <Providers>
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
