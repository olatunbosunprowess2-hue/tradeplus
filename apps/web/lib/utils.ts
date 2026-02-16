import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(cents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
} export function sanitizeUrl(url?: string): string {
  if (!url) return '';

  // Handle Cloudinary URLs - Upgrade to HTTPS
  if (url.includes('cloudinary.com')) {
    return url.replace('http:', 'https:');
  }

  // PROXY MODE: In production, rewrite localhost absolute URLs to relative paths
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && (url.includes('localhost:3333') || url.includes('127.0.0.1:3333'))) {
    if (url.includes('/uploads/')) return `/uploads/${url.split('/uploads/')[1]}`;
    if (url.includes('/private-uploads/')) return `/private-uploads/${url.split('/private-uploads/')[1]}`;
    if (url.includes('/api/')) return `/api/${url.split('/api/')[1]}`;

    // Generic fallback for other localhost paths
    const relative = url.replace(/https?:\/\/(localhost|127\.0\.0\.1):3333/, '');
    return relative.startsWith('/') ? relative : `/${relative}`;
  }

  // Ensure relative paths (like 'uploads/...') have a leading slash for proxy matching
  if (!url.startsWith('http') && !url.startsWith('/')) {
    return `/${url}`;
  }

  return url;
}
