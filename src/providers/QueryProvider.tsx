'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

interface Props {
    children: React.ReactNode;
}

export function QueryProvider({ children }: Props) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5000, // Consider data fresh for 5 seconds
                        refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
                        refetchOnWindowFocus: true,
                        retry: 2,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
