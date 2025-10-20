/**
 * Authentication Hook
 * SSR-safe authentication utilities
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  mobile?: string;
  kyc_status?: string;
  wallet_address?: string;
  created_at?: string;
}

export function useAuth(requiredRole?: string) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // SSR check
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (!storedToken) {
        router.push('/auth/login');
        return;
      }

      setToken(storedToken);

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          // Check role if required
          if (requiredRole && parsedUser.role !== requiredRole) {
            router.push('/auth/unauthorized');
            return;
          }
        } catch (parseError) {
          console.error('Failed to parse user data');
          localStorage.removeItem('user');
          router.push('/auth/login');
          return;
        }
      }
    } catch (error) {
      console.error('Authentication check failed');
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }, [router, requiredRole]);

  return { token, user, loading };
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
