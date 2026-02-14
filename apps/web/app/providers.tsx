'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { AuthSyncer } from '@/components/AuthSyncer';
import { ThemeProvider } from '@/lib/theme-context';

interface ProvidersProps {
  children: ReactNode;
}

import dynamic from 'next/dynamic';

const ProfileCompletionModal = dynamic(() => import('@/components/ProfileCompletionModal'), { ssr: false });

export function Providers({ children }: ProvidersProps): ReactNode {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthSyncer />
        <ProfileCompletionModal />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}




