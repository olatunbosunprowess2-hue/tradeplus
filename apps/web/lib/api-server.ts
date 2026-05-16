/**
 * Server-side API fetcher for use in Server Components and Route Handlers.
 *
 * This bypasses the Axios-based apiClient (which relies on browser globals like
 * localStorage, document.cookie, and window) and uses native `fetch` instead.
 *
 * For the initial SSR data fetch, no auth token is needed because the homepage
 * listings endpoint is public. If you need authenticated server-side fetches
 * in the future, pass cookies from the incoming request headers.
 */

/**
 * Resolves the correct absolute backend URL for server-side fetching.
 *
 * During SSR, relative URLs like `/api/listings` don't work because there's no
 * browser origin. We must use an absolute URL pointing to the backend directly.
 *
 * Priority:
 * 1. INTERNAL_API_URL (server-only env var, e.g., internal Docker/K8s service URL)
 * 2. NEXT_PUBLIC_API_URL (the public-facing API URL)
 * 3. Fallback to localhost for local development
 */
function getServerApiBase(): string {
  // Server-only internal URL (never exposed to the browser)
  if (process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL;
  }

  // Public API URL (used in production when no internal URL is set)
  const publicUrl = process.env.NEXT_PUBLIC_API_URL;
  if (publicUrl && !publicUrl.startsWith('/')) {
    return publicUrl;
  }

  // Fallback for local development
  return 'http://localhost:3333/api';
}

/**
 * Fetches JSON data from the backend API during server-side rendering.
 *
 * @param path - API path relative to the base (e.g., '/listings', '/listings/featured')
 * @param params - Optional query parameters as a plain object
 * @returns The parsed JSON response body
 */
export async function serverFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const base = getServerApiBase();
  const url = new URL(path.startsWith('/') ? path : `/${path}`, base);

  // Append query parameters, skipping undefined values
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
    },
    // Use Next.js cache with revalidation to avoid hammering the backend
    // on every page request. Revalidates every 30 seconds.
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(
      `Server fetch failed: ${response.status} ${response.statusText} for ${url.pathname}`,
    );
  }

  return response.json();
}
