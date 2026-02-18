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

  // PROXY MODE: Rewrite absolute backend URLs to relative paths to avoid CORS/IP mismatch issues
  // This works both in production (via Next.config rewrites) and development (via proxy)

  // Broad match for any localhost or private network IP with any port (or no port)
  const isLocalHost = url.includes('localhost') || url.includes('127.0.0.1') || url.includes('0.0.0.0');
  const isNetworkIP = url.match(/https?:\/\/192\.168\.\d+\.\d+/) ||
    url.match(/https?:\/\/172\.\d+\.\d+\.\d+/) ||
    url.match(/https?:\/\/10\.\d+\.\d+\.\d+/) ||
    url.match(/https?:\/\/169\.254\.\d+\.\d+/); // APIPA addresses

  if (isLocalHost || isNetworkIP) {
    // Extract the path after the origin (e.g., http://192.168.1.5:3333/uploads/1.jpg -> /uploads/1.jpg)
    try {
      const parsed = new URL(url);
      const relative = parsed.pathname + parsed.search;

      // Ensure it's one of our proxied paths
      if (relative.startsWith('/uploads/') ||
        relative.startsWith('/private-uploads/') ||
        relative.startsWith('/api/')) {
        return relative;
      }
    } catch {
      // Fallback for malformed URLs that still match our patterns
      if (url.includes('/uploads/')) return `/uploads/${url.split('/uploads/')[1]}`;
      if (url.includes('/private-uploads/')) return `/private-uploads/${url.split('/private-uploads/')[1]}`;
      if (url.includes('/api/')) return `/api/${url.split('/api/')[1]}`;
    }
  }

  // Ensure relative paths (like 'uploads/...') have a leading slash for proxy matching
  if (!url.startsWith('http') && !url.startsWith('/')) {
    return `/${url}`;
  }

  return url;
}
