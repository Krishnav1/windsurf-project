/**
 * User Registration Page
 * 
 * Allows new users to create accounts with role selection
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    mobile: '',
    country: 'India',
    role: 'investor',
    investorCategory: 'retail',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedSandbox, setAcceptedSandbox] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate terms acceptance
    if (!acceptedTerms) {
      setError('You must accept the Terms & Conditions to continue');
      return;
    }

    if (!acceptedSandbox) {
      setError('You must acknowledge this is a sandbox testing environment');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          mobile: formData.mobile,
          country: formData.country,
          role: formData.role,
          investorCategory: formData.role === 'investor' ? formData.investorCategory : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store user data and redirect to login
      alert('Registration successful! Please login.');
      router.push('/auth/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.12),_transparent_55%)]" />
      <div className="relative z-10 mx-auto w-full max-w-xl space-y-8">
        {/* Header */}
        <div className="glass-panel px-8 py-10 text-center shadow-xl">
          <Link href="/" className="inline-flex items-center justify-center gap-2">
            <span className="pill badge-soft">Prototype</span>
            <h1 className="text-3xl font-bold text-[var(--heading-color)]">TokenPlatform</h1>
          </Link>
          <h2 className="mt-6 text-3xl font-semibold text-[var(--heading-color)]">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-text)]">
            Join the future of compliant asset tokenization.
          </p>
        </div>

        {/* Registration Form */}
        <form className="glass-panel space-y-6 px-8 py-10" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-[var(--muted-text)]">
                Full Name *
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="mt-2 block w-full rounded-lg border border-[var(--border-subtle)] bg-white/90 px-3 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--muted-text)]">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-2 block w-full rounded-lg border border-[var(--border-subtle)] bg-white/90 px-3 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
              />
            </div>

            {/* Mobile */}
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-[var(--muted-text)]">
                Mobile Number
              </label>
              <input
                id="mobile"
                name="mobile"
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="mt-2 block w-full rounded-lg border border-[var(--border-subtle)] bg-white/90 px-3 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
              />
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-[var(--muted-text)]">
                Account Type *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="mt-2 block w-full rounded-lg border border-[var(--border-subtle)] bg-white/90 px-3 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
              >
                <option value="investor">Investor - Trade tokenized assets</option>
                <option value="issuer">Issuer - Create token issuance requests</option>
                <option value="admin">Admin - Platform management</option>
              </select>
            </div>

            {/* Investor Category - Only show for investors */}
            {formData.role === 'investor' && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <label htmlFor="investorCategory" className="block text-sm font-semibold text-blue-900">
                  Investor Category * <span className="text-xs font-normal">(RBI Compliance)</span>
                </label>
                <select
                  id="investorCategory"
                  name="investorCategory"
                  value={formData.investorCategory}
                  onChange={(e) => setFormData({ ...formData, investorCategory: e.target.value })}
                  className="mt-2 block w-full rounded-lg border border-blue-300 bg-white px-3 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="retail">🟢 Retail - Max ₹1,00,000 (Sandbox Limit)</option>
                  <option value="accredited">🟡 Accredited - Max ₹10,00,000 (Sandbox Limit)</option>
                  <option value="institutional">🔵 Institutional - Max ₹1,00,00,000 (Sandbox Limit)</option>
                </select>
                <p className="mt-2 text-xs text-blue-700">
                  Investment limits are enforced for regulatory compliance testing. <Link href="/legal/risk-disclosure" className="underline hover:text-blue-900">Learn more</Link>
                </p>
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--muted-text)]">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-2 block w-full rounded-lg border border-[var(--border-subtle)] bg-white/90 px-3 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
              />
              <p className="mt-2 text-xs text-[var(--muted-text)]">
                Must contain uppercase, lowercase, and number
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--muted-text)]">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="mt-2 block w-full rounded-lg border border-[var(--border-subtle)] bg-white/90 px-3 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
              />
            </div>
          </div>

          {/* Terms & Conditions Acceptance */}
          <div className="space-y-4 rounded-lg border-2 border-amber-200 bg-amber-50 p-5">
            <h3 className="text-sm font-semibold text-amber-900">Legal Agreements Required</h3>
            
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-amber-300 text-[var(--primary-color)] focus:ring-2 focus:ring-[var(--primary-color)]"
              />
              <span className="text-sm text-amber-900">
                I have read and agree to the{' '}
                <Link href="/legal/terms" target="_blank" className="font-semibold underline hover:text-amber-950">
                  Terms & Conditions
                </Link>
                ,{' '}
                <Link href="/legal/privacy" target="_blank" className="font-semibold underline hover:text-amber-950">
                  Privacy Policy
                </Link>
                , and{' '}
                <Link href="/legal/risk-disclosure" target="_blank" className="font-semibold underline hover:text-amber-950">
                  Risk Disclosure
                </Link>
                . *
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedSandbox}
                onChange={(e) => setAcceptedSandbox(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-amber-300 text-[var(--primary-color)] focus:ring-2 focus:ring-[var(--primary-color)]"
              />
              <span className="text-sm text-amber-900">
                I understand this is a{' '}
                <Link href="/legal/sandbox-declaration" target="_blank" className="font-semibold underline hover:text-amber-950">
                  SANDBOX TESTING ENVIRONMENT
                </Link>
                {' '}with NO real money or investments. All transactions are simulated for regulatory evaluation only. *
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading || !acceptedTerms || !acceptedSandbox}
              className="button-primary w-full justify-center text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-[var(--muted-text)]">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium text-[var(--primary-color)] hover:text-[var(--primary-color-hover)]">
                Sign in
              </Link>
            </p>
          </div>
        </form>

        {/* Disclaimer */}
        <div className="text-center">
          <p className="text-xs text-[var(--muted-text)]">⚠️ PROTOTYPE • Test Environment Only</p>
        </div>
      </div>
    </div>
  );
}
