import { useQuery } from '@tanstack/react-query';

export function useHasPassword() {
  return useQuery({
    queryKey: ['has-password'],
    queryFn: async () => {
      const response = await fetch('/api/auth/password');
      if (!response.ok) {
        throw new Error('Failed to check password status');
      }
      const data = await response.json();
      return data.hasPassword as boolean;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
