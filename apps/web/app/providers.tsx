'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { AuthSyncer } from '@/components/AuthSyncer';
import { ThemeProvider } from '@/lib/theme-context';
import { getQueryClient } from '@/lib/query-client';

interface ProvidersProps {
  children: ReactNode;
}

import dynamic from 'next/dynamic';

const ProfileCompletionModal = dynamic(() => import('@/components/ProfileCompletionModal'), { ssr: false });

export function Providers({ children }: ProvidersProps): ReactNode {
  const queryClient = getQueryClient();

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




