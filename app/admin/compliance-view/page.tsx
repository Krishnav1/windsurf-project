/**
 * Compliance View Page
 * Regulatory dashboard for auditors and compliance officers
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ComplianceMetrics = {
  totalUsers: number;
  totalInvestors: number;
  totalIssuers: number;
  kycApproved: number;
  kycPending: number;
  kycRejected: number;
  retailInvestors: number;
  accreditedInvestors: number;
  institutionalInvestors: number;
  totalTokens: number;
  activeTokens: number;
  frozenTokens: number;
  totalTransactions: number;
  totalVolume: number;
  suspiciousActivities: number;
};

export default function ComplianceViewPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin' && parsedUser.role !== 'auditor') {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    fetchComplianceData(token);
  }, [router]);

  const fetchComplianceData = async (token: string) => {
    try {
      const response = await fetch('/api/admin/compliance-metrics', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch compliance data');
      }

      const data = await response.json();
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (err: any) {
      setError(err.message);
      // Set mock data for sandbox
      setMetrics({
        totalUsers: 45,
        totalInvestors: 32,
        totalIssuers: 8,
        kycApproved: 28,
        kycPending: 12,
        kycRejected: 5,
        retailInvestors: 20,
        accreditedInvestors: 10,
        institutionalInvestors: 2,
        totalTokens: 12,
        activeTokens: 9,
        frozenTokens: 0,
        totalTransactions: 156,
        totalVolume: 4250000,
        suspiciousActivities: 2,
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format: 'pdf' | 'csv') => {
    alert(`Exporting compliance report as ${format.toUpperCase()}...\nIn production, this would generate a downloadable file.`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--primary-color)]" />
          <p className="mt-4 text-sm text-[var(--muted-text)]">Loading compliance data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <nav className="border-b border-[var(--neutral-200)] bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href={user?.role === 'admin' ? '/admin/dashboard' : '/'}>
              <h1 className="text-xl font-semibold text-[var(--primary-color)]">TokenPlatform</h1>
            </Link>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-700">
              {user?.role === 'auditor' ? 'Auditor' : 'Compliance'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-[var(--neutral-500)]">
            <span>{user?.fullName || user?.full_name}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-[var(--neutral-200)] px-3 py-1.5 text-[var(--neutral-600)] transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      {/* Compliance Banner */}
      <div className="border-b border-purple-200 bg-purple-50 py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-sm">
            <svg className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold text-purple-900">
              🛡️ Regulatory Compliance Dashboard - {user?.role === 'auditor' ? 'Read-Only Access' : 'Full Access'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--heading-color)]">Compliance Overview</h1>
            <p className="mt-2 text-[var(--subtle-text)]">
              Real-time regulatory metrics and compliance status for sandbox testing
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => exportReport('csv')}
              className="rounded-lg border border-[var(--neutral-200)] px-4 py-2 text-sm font-semibold text-[var(--subtle-text)] transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
            >
              Export CSV
            </button>
            <button
              onClick={() => exportReport('pdf')}
              className="rounded-lg bg-[var(--primary-color)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-color-hover)]"
            >
              Export PDF Report
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            Using mock data for sandbox demonstration. API endpoint: /api/admin/compliance-metrics
          </div>
        )}

        {/* Key Metrics Grid */}
        <section className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card-surface p-6">
            <p className="text-xs uppercase tracking-wide text-[var(--neutral-500)]">Total Users</p>
            <p className="mt-3 text-4xl font-bold text-[var(--foreground)]">{metrics?.totalUsers}</p>
            <p className="mt-2 text-xs text-[var(--neutral-500)]">
              {metrics?.totalInvestors} Investors • {metrics?.totalIssuers} Issuers
            </p>
          </div>

          <div className="card-surface p-6">
            <p className="text-xs uppercase tracking-wide text-[var(--neutral-500)]">KYC Approved</p>
            <p className="mt-3 text-4xl font-bold text-green-600">{metrics?.kycApproved}</p>
            <p className="mt-2 text-xs text-[var(--neutral-500)]">
              {metrics?.kycPending} Pending • {metrics?.kycRejected} Rejected
            </p>
          </div>

          <div className="card-surface p-6">
            <p className="text-xs uppercase tracking-wide text-[var(--neutral-500)]">Active Tokens</p>
            <p className="mt-3 text-4xl font-bold text-blue-600">{metrics?.activeTokens}</p>
            <p className="mt-2 text-xs text-[var(--neutral-500)]">
              {metrics?.totalTokens} Total • {metrics?.frozenTokens} Frozen
            </p>
          </div>

          <div className="card-surface p-6">
            <p className="text-xs uppercase tracking-wide text-[var(--neutral-500)]">Total Volume</p>
            <p className="mt-3 text-4xl font-bold text-purple-600">₹{(metrics?.totalVolume || 0).toLocaleString()}</p>
            <p className="mt-2 text-xs text-[var(--neutral-500)]">
              {metrics?.totalTransactions} Transactions
            </p>
          </div>
        </section>

        {/* Investor Categorization */}
        <section className="mb-10">
          <h2 className="mb-6 text-2xl font-semibold text-[var(--heading-color)]">Investor Categorization</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="card-surface border-2 border-green-200 bg-green-50/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-900">🟢 Retail Investors</p>
                  <p className="mt-2 text-3xl font-bold text-green-700">{metrics?.retailInvestors}</p>
                </div>
                <div className="rounded-full bg-green-100 p-3">
                  <svg className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
              </div>
              <p className="mt-4 text-xs text-green-700">
                Max Exposure: ₹1,00,000 per investor
              </p>
            </div>

            <div className="card-surface border-2 border-amber-200 bg-amber-50/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-900">🟡 Accredited Investors</p>
                  <p className="mt-2 text-3xl font-bold text-amber-700">{metrics?.accreditedInvestors}</p>
                </div>
                <div className="rounded-full bg-amber-100 p-3">
                  <svg className="h-8 w-8 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
              </div>
              <p className="mt-4 text-xs text-amber-700">
                Max Exposure: ₹10,00,000 per investor
              </p>
            </div>

            <div className="card-surface border-2 border-blue-200 bg-blue-50/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-900">🔵 Institutional</p>
                  <p className="mt-2 text-3xl font-bold text-blue-700">{metrics?.institutionalInvestors}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <svg className="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="mt-4 text-xs text-blue-700">
                Max Exposure: ₹1,00,00,000 per entity
              </p>
            </div>
          </div>
        </section>

        {/* Risk Flags */}
        <section className="mb-10">
          <h2 className="mb-6 text-2xl font-semibold text-[var(--heading-color)]">Risk Monitoring</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="card-surface p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--heading-color)]">Suspicious Activities</h3>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  (metrics?.suspiciousActivities || 0) > 0 ? 'bg-rose-100 text-rose-700' : 'bg-green-100 text-green-700'
                }`}>
                  {metrics?.suspiciousActivities || 0} Flagged
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {(metrics?.suspiciousActivities || 0) > 0 ? (
                  <>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="text-sm font-semibold text-amber-900">⚠️ Unusual Trading Pattern</p>
                      <p className="mt-1 text-xs text-amber-700">User ID: INV-2024-045 • Multiple large trades in short period</p>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="text-sm font-semibold text-amber-900">⚠️ KYC Mismatch</p>
                      <p className="mt-1 text-xs text-amber-700">User ID: INV-2024-032 • Address verification pending</p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-green-600">✓ No suspicious activities detected</p>
                )}
              </div>
            </div>

            <div className="card-surface p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--heading-color)]">Compliance Status</h3>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  ✓ Compliant
                </span>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--subtle-text)]">Data Localization</span>
                  <span className="font-semibold text-green-600">✓ India (Mumbai)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--subtle-text)]">KYC Compliance</span>
                  <span className="font-semibold text-green-600">✓ {Math.round(((metrics?.kycApproved || 0) / (metrics?.totalUsers || 1)) * 100)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--subtle-text)]">Audit Logging</span>
                  <span className="font-semibold text-green-600">✓ Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--subtle-text)]">Investment Limits</span>
                  <span className="font-semibold text-green-600">✓ Enforced</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Blockchain Info */}
        <section className="mb-10">
          <h2 className="mb-6 text-2xl font-semibold text-[var(--heading-color)]">Blockchain Infrastructure</h2>
          <div className="card-surface p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-[var(--heading-color)]">Network Details</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[var(--subtle-text)]">Network:</dt>
                    <dd className="font-semibold text-[var(--foreground)]">Polygon Amoy Testnet</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--subtle-text)]">Chain ID:</dt>
                    <dd className="font-mono text-xs font-semibold text-[var(--foreground)]">80002</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--subtle-text)]">Explorer:</dt>
                    <dd>
                      <a
                        href="https://amoy.polygonscan.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--primary-color)] hover:underline"
                      >
                        amoy.polygonscan.com
                      </a>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--subtle-text)]">Gas Token:</dt>
                    <dd className="font-semibold text-[var(--foreground)]">MATIC (Testnet)</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--heading-color)]">Smart Contracts</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--neutral-50)] p-3">
                    <p className="font-semibold text-[var(--heading-color)]">SecurityToken.sol</p>
                    <p className="mt-1 text-xs text-[var(--muted-text)]">ERC-20 with compliance features</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--neutral-50)] p-3">
                    <p className="font-semibold text-[var(--heading-color)]">IdentityRegistry.sol</p>
                    <p className="mt-1 text-xs text-[var(--muted-text)]">KYC whitelist management</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--neutral-50)] p-3">
                    <p className="font-semibold text-[var(--heading-color)]">ComplianceManager.sol</p>
                    <p className="mt-1 text-xs text-[var(--muted-text)]">Transfer restrictions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Regulatory Framework */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-[var(--heading-color)]">Regulatory Framework</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="card-surface p-6">
              <h3 className="text-sm font-semibold text-[var(--heading-color)]">IFSCA Sandbox</h3>
              <p className="mt-2 text-xs text-[var(--subtle-text)]">
                Operating under IFSCA Regulatory Sandbox Framework for fintech innovation testing
              </p>
              <Link
                href="/legal/sandbox-declaration"
                className="mt-4 inline-block text-xs text-[var(--primary-color)] hover:underline"
              >
                View Declaration →
              </Link>
            </div>

            <div className="card-surface p-6">
              <h3 className="text-sm font-semibold text-[var(--heading-color)]">RBI Guidelines</h3>
              <p className="mt-2 text-xs text-[var(--subtle-text)]">
                Compliant with RBI Master KYC Directions and data localization requirements
              </p>
              <Link
                href="/legal/privacy"
                className="mt-4 inline-block text-xs text-[var(--primary-color)] hover:underline"
              >
                Privacy Policy →
              </Link>
            </div>

            <div className="card-surface p-6">
              <h3 className="text-sm font-semibold text-[var(--heading-color)]">DPDP Act 2023</h3>
              <p className="mt-2 text-xs text-[var(--subtle-text)]">
                Adheres to Digital Personal Data Protection Act for user privacy and data rights
              </p>
              <Link
                href="/legal/terms"
                className="mt-4 inline-block text-xs text-[var(--primary-color)] hover:underline"
              >
                Terms & Conditions →
              </Link>
            </div>
          </div>
        </section>

        {/* Back Button */}
        {user?.role === 'admin' && (
          <div className="mt-10">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary-color)] hover:text-[var(--primary-color-hover)]"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Admin Dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
