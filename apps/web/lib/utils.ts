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
  // This helps when accessing the app via local IP, local hostname, or production URL.
  // This works both in production (via Next.config rewrites) and development (via proxy)

  // Identify absolute URLs that point to our backend paths
  const hasBackendPath = url.includes('/uploads/') ||
    url.includes('/private-uploads/') ||
    url.includes('/api/');

  if (url.startsWith('http') && hasBackendPath) {
    try {
      const parsed = new URL(url);
      const relative = parsed.pathname + parsed.search;

      // Ensure it's actually one of our proxied paths
      if (relative.startsWith('/uploads/') ||
        relative.startsWith('/api/')) {
        return relative;
      }
      // Route private uploads through the authenticated API endpoint
      if (relative.startsWith('/private-uploads/')) {
        const filename = relative.split('/private-uploads/')[1];
        return `/api/uploads/private/${filename}`;
      }
    } catch {
      // Fallback for malformed URLs
      if (url.includes('/uploads/')) return `/uploads/${url.split('/uploads/')[1]}`;
      if (url.includes('/private-uploads/')) return `/api/uploads/private/${url.split('/private-uploads/')[1]}`;
      if (url.includes('/api/')) return `/api/${url.split('/api/')[1]}`;
    }
  }

  // Ensure relative paths (like 'uploads/...') have a leading slash for proxy matching
  if (!url.startsWith('http') && !url.startsWith('/')) {
    return `/${url}`;
  }

  return url;
}
