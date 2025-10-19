/**
 * User Login Page
 *
 * Handles user authentication with optional 2FA
 */

"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type AuthSuccessResponse = {
  success: true;
  token: string;
  user: {
    id: string;
    role: 'investor' | 'issuer' | 'admin' | 'auditor';
    fullName?: string | null;
    kycStatus?: 'pending' | 'approved' | 'rejected' | null;
    demoBalance?: number | null;
    twoFAEnabled?: boolean;
  };
};

type AuthErrorResponse = {
  success?: false;
  error: string;
  requires2FA?: boolean;
};

type StoredUser = {
  id: string;
  role: 'investor' | 'issuer' | 'admin' | 'auditor';
  fullName: string;
  kycStatus: 'pending' | 'approved' | 'rejected';
  demoBalance: number;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const existingToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!existingToken || !storedUser) {
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser) as StoredUser;
      redirectByRole(parsedUser.role);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [router]);

  const redirectByRole = (role: StoredUser['role']) => {
    if (role === 'admin') {
      router.push('/admin/dashboard');
    } else if (role === 'issuer') {
      router.push('/issuer/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  const normalizeUser = (user: AuthSuccessResponse['user']): StoredUser => ({
    id: user.id,
    role: user.role,
    fullName: user.fullName ?? 'User',
    kycStatus: user.kycStatus ?? 'pending',
    demoBalance: user.demoBalance ?? 0,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          twoFactorToken: requires2FA ? twoFactorToken : undefined,
        }),
      });

      const result: AuthSuccessResponse | AuthErrorResponse = await response.json();

      if (!response.ok) {
        const errorResponse = result as AuthErrorResponse;

        if (errorResponse.requires2FA) {
          setRequires2FA(true);
          setError('Enter the 2FA code from your authenticator app.');
          return;
        }

        setError(errorResponse.error || 'Login failed');
        return;
      }

      const successResponse = result as AuthSuccessResponse;
      const normalizedUser = normalizeUser(successResponse.user);
      localStorage.setItem('token', successResponse.token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));

      redirectByRole(normalizedUser.role);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Login failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.12),_transparent_55%)]" />
      <div className="relative z-10 mx-auto w-full max-w-lg space-y-8">
        <div className="glass-panel px-8 py-10 text-center shadow-xl">
          <Link href="/" className="inline-flex items-center justify-center gap-2">
            <span className="pill badge-soft">Prototype</span>
            <h1 className="text-3xl font-bold text-[var(--heading-color)]">TokenPlatform</h1>
          </Link>
          <h2 className="mt-6 text-3xl font-semibold text-[var(--heading-color)]">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-text)]">
            Sign in with your sandbox credentials to continue.
          </p>
        </div>

        <form className="glass-panel space-y-6 px-8 py-10" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--muted-text)]">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 block w-full rounded-lg border border-[var(--border-subtle)] bg-white/90 px-3 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--muted-text)]">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 block w-full rounded-lg border border-[var(--border-subtle)] bg-white/90 px-3 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
                placeholder="••••••••"
              />
            </div>
            {requires2FA && (
              <div>
                <label htmlFor="twoFactorToken" className="block text-sm font-medium text-[var(--muted-text)]">
                  2FA Code
                </label>
                <input
                  id="twoFactorToken"
                  name="twoFactorToken"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={twoFactorToken}
                  onChange={(event) => setTwoFactorToken(event.target.value)}
                  className="mt-2 block w-full rounded-lg border border-[var(--border-subtle)] bg-white/90 px-3 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
                  placeholder="123456"
                  aria-describedby="twoFactorHelp"
                />
                <p id="twoFactorHelp" className="mt-2 text-xs text-[var(--muted-text)]">
                  Enter the 6-digit code from your authenticator app.
                </p>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="button-primary w-full justify-center text-sm disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-[var(--muted-text)]">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="font-medium text-[var(--primary-color)] hover:text-[var(--primary-color-hover)]">
                Create account
              </Link>
            </p>
          </div>
        </form>

        <div className="text-center">
          <p className="text-xs text-[var(--muted-text)]">⚠️ PROTOTYPE • Test Environment Only</p>
        </div>
      </div>
    </div>
  );
}
