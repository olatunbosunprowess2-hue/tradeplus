import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Toaster } from 'react-hot-toast';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'TradePlus - Buy, Sell & Barter',
  description: 'The modern marketplace for cash and barter trading.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
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
