import { QueryClient, isServer } from '@tanstack/react-query';

/**
 * Centralized QueryClient factory for Next.js App Router.
 *
 * On the SERVER: creates a fresh QueryClient per request to prevent
 *   data leakage between users/requests.
 * On the CLIENT: reuses a singleton so React Query's cache persists
 *   across navigations (matching the previous useState pattern).
 *
 * Reference: https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
 */

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute — matches previous config in providers.tsx
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient(): QueryClient {
  if (isServer) {
    // Server: always make a new QueryClient
    return makeQueryClient();
  }

  // Browser: reuse the same QueryClient across the app
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
