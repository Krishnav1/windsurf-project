/**
 * User Dashboard Page
 * 
 * Main dashboard for investors showing portfolio and available tokens
 */

"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import InvestorNav from '@/components/InvestorNav';

type StoredUser = {
  id: string;
  role: 'investor' | 'issuer' | 'admin' | 'auditor';
  fullName?: string;
  full_name?: string;
  kycStatus?: 'pending' | 'approved' | 'rejected';
  kyc_status?: 'pending' | 'approved' | 'rejected';
  demoBalance?: number;
  demo_balance?: number;
  investorCategory?: 'retail' | 'accredited' | 'institutional';
  investor_category?: 'retail' | 'accredited' | 'institutional';
  cbdcBalance?: number;
  cbdc_balance?: number;
};

type DashboardUser = {
  id: string;
  role: StoredUser['role'];
  fullName: string;
  kycStatus: 'pending' | 'approved' | 'rejected';
  demoBalance: number;
  investorCategory: 'retail' | 'accredited' | 'institutional';
  cbdcBalance: number;
};

type PortfolioToken = {
  id: string;
  token_symbol: string;
  token_name: string;
  asset_type: string;
};

type PortfolioHolding = {
  id: string;
  token_id: string;
  balance: number;
  tokens: PortfolioToken | null;
  marketPrice?: number;
  currentValue?: number;
};

type KycInfo = {
  status: 'pending' | 'approved' | 'rejected';
  lastUpdated: string | null;
  submission: Record<string, unknown> | null;
};

type PublicToken = {
  id: string;
  name: string;
  symbol: string;
  status: string;
  assetType: string | null;
  totalSupply: number;
  decimals?: number | null;
  issuer?: string | null;
  assetDescription?: string | null;
  valuation?: number | null;
};

type TradeRecord = {
  id: string;
  tokenId: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  totalAmount: number;
  settlementMethod: 'demo' | 'upi' | 'cbdc';
  createdAt: string;
  fallback?: boolean;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioHolding[]>([]);
  const [kycInfo, setKycInfo] = useState<KycInfo | null>(null);
  const [tokens, setTokens] = useState<PublicToken[]>([]);
  const [tokensFallback, setTokensFallback] = useState(false);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [tradesFallback, setTradesFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData) as StoredUser;
    const normalizedUser: DashboardUser = {
      id: parsedUser.id,
      role: parsedUser.role,
      fullName: parsedUser.fullName ?? parsedUser.full_name ?? 'User',
      kycStatus: parsedUser.kycStatus ?? parsedUser.kyc_status ?? 'pending',
      demoBalance: parsedUser.demoBalance ?? parsedUser.demo_balance ?? 0,
      investorCategory: parsedUser.investorCategory ?? parsedUser.investor_category ?? 'retail',
      cbdcBalance: parsedUser.cbdcBalance ?? parsedUser.cbdc_balance ?? 50000,
    };

    setUser(normalizedUser);
    fetchData(token);
  }, [router]);

  const fetchData = async (token: string) => {
    try {
      setLoading(true);

      const kycRes = await fetch('/api/compliance/kyc', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const kycPayload = await kycRes.json();
      if (kycRes.ok) {
        const submission = kycPayload && typeof kycPayload.submission === 'object' && kycPayload.submission !== null
          ? kycPayload.submission as Record<string, unknown>
          : null;
        const status = (kycPayload.kycStatus as KycInfo['status']) ?? 'pending';
        setKycInfo({
          status,
          lastUpdated: kycPayload.lastUpdated ?? null,
          submission,
        });
        setUser((prev) => prev ? { ...prev, kycStatus: status } : prev);
      } else {
        setKycInfo(null);
      }

      // Fetch portfolio
      const portfolioRes = await fetch('/api/portfolio', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const portfolioData = await portfolioRes.json();
      if (portfolioData.success && Array.isArray(portfolioData.portfolio)) {
        setPortfolio(portfolioData.portfolio as PortfolioHolding[]);
      } else {
        setPortfolio([]);
      }

      // Fetch available tokens
      const tokensRes = await fetch('/api/tokens/public');
      const tokensData = await tokensRes.json();
      if (tokensRes.ok && Array.isArray(tokensData.tokens)) {
        const activeTokens = (tokensData.tokens as PublicToken[]).filter((t) => t.status === 'active');
        setTokens(activeTokens);
        setTokensFallback(Boolean(tokensData.fallback));
      } else {
        setTokens([]);
        setTokensFallback(true);
      }

      const tradesRes = await fetch('/api/trades/mock', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const tradesData = await tradesRes.json();
      if (tradesRes.ok && Array.isArray(tradesData.trades)) {
        setTrades(tradesData.trades as TradeRecord[]);
        setTradesFallback(Boolean(tradesData.fallback));
      } else {
        setTrades([]);
        setTradesFallback(true);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const activePortfolio = useMemo(
    () => portfolio.filter((item) => item.balance > 0),
    [portfolio]
  );
  const effectiveKycStatus = useMemo(
    () => kycInfo?.status ?? user?.kycStatus ?? 'pending',
    [kycInfo, user]
  );
  const tokenMap = useMemo(() => {
    const map = new Map<string, PublicToken>();
    tokens.forEach((token) => {
      map.set(token.id, token);
    });
    return map;
  }, [tokens]);
  const recentTrades = useMemo(() => trades.slice(0, 5), [trades]);
  const isKycPending = effectiveKycStatus === 'pending';
  const isKycRejected = effectiveKycStatus === 'rejected';
  const statusClass = effectiveKycStatus === 'approved'
    ? 'text-green-600'
    : isKycRejected
    ? 'text-red-600'
    : 'text-yellow-600';
  const formatDateTime = (value: string | null | undefined) => {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  };
  const formatLabel = (key: string) => key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
  const formatSubmissionValue = (value: unknown) => {
    if (value === null || value === undefined) {
      return '—';
    }
    if (Array.isArray(value)) {
      return value
        .map((entry) => (typeof entry === 'object' ? JSON.stringify(entry) : String(entry)))
        .join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB]">
        <InvestorNav />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B67FF]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <InvestorNav />

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <h2 className="text-4xl font-semibold text-[var(--heading-color)] tracking-tight">
            Welcome back, {user?.fullName ?? 'Investor'}.
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--subtle-text)]">
            {effectiveKycStatus === 'approved'
              ? 'Your account is verified. You can start trading.'
              : effectiveKycStatus === 'rejected'
              ? 'Your KYC was rejected. Please review your submission and resubmit the required documents.'
              : 'Your KYC is pending approval. You can browse tokens but cannot trade yet.'}
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/settings/kyc"
            className="card-surface flex items-center gap-4 p-4 transition hover:shadow-lg hover:border-[var(--primary-color)]"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
              effectiveKycStatus === 'approved' ? 'bg-green-100' :
              effectiveKycStatus === 'rejected' ? 'bg-red-100' :
              'bg-blue-100'
            }`}>
              <svg className={`h-6 w-6 ${
                effectiveKycStatus === 'approved' ? 'text-green-600' :
                effectiveKycStatus === 'rejected' ? 'text-red-600' :
                'text-blue-600'
              }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                {effectiveKycStatus === 'approved' ? (
                  <path d="M22 11l-5 5-3-3"/>
                ) : effectiveKycStatus === 'rejected' ? (
                  <path d="M18 6L6 18M6 6l12 12"/>
                ) : (
                  <path d="M20 8v6M23 11h-6"/>
                )}
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0A1628]">
                {effectiveKycStatus === 'approved' ? 'KYC Verified' :
                 effectiveKycStatus === 'rejected' ? 'KYC Rejected' :
                 kycInfo?.submission ? 'KYC Status' : 'Complete KYC'}
              </p>
              <p className="text-xs text-[#64748b]">
                {effectiveKycStatus === 'approved' ? 'View details' :
                 effectiveKycStatus === 'rejected' ? 'Resubmit' :
                 kycInfo?.submission ? 'Under review' : 'Verify identity'}
              </p>
            </div>
          </Link>

          <Link
            href="/portfolio"
            className="card-surface flex items-center gap-4 p-4 transition hover:shadow-lg hover:border-[var(--primary-color)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0A1628]">My Portfolio</p>
              <p className="text-xs text-[#64748b]">View holdings</p>
            </div>
          </Link>

          <Link
            href="/support/grievance"
            className="card-surface flex items-center gap-4 p-4 transition hover:shadow-lg hover:border-[var(--primary-color)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <svg className="h-6 w-6 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0A1628]">Support</p>
              <p className="text-xs text-[#64748b]">Get help</p>
            </div>
          </Link>

          <Link
            href="/legal/risk-disclosure"
            className="card-surface flex items-center gap-4 p-4 transition hover:shadow-lg hover:border-[var(--primary-color)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-6 w-6 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0A1628]">Compliance</p>
              <p className="text-xs text-[#64748b]">View policies</p>
            </div>
          </Link>
        </div>

        {/* KYC Status Alert */}
        {isKycPending && (
          <div className="mb-6 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100 p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-200">
                  <svg className="h-6 w-6 text-amber-700" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-900">Action Required: Complete KYC Verification</h3>
                  <p className="mt-2 text-sm text-amber-800">
                    Your account is pending KYC verification. Submit your documents now to start trading tokenized assets.
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-amber-700">
                    <li className="flex items-center gap-2">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Upload ID proof, address proof, and photograph
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Typical approval time: 24-48 hours
                    </li>
                  </ul>
                </div>
              </div>
              <Link
                href="/compliance/kyc-submit"
                className="ml-4 flex-shrink-0 rounded-lg bg-amber-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-amber-700 hover:shadow-xl"
              >
                Submit KYC Now
              </Link>
            </div>
          </div>
        )}
        {isKycRejected && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-5 shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 7a1 1 0 012 0v4a1 1 0 01-2 0V7zm1 6a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-rose-700">KYC Requires Attention</h3>
                <p className="mt-1 text-sm text-rose-600">
                  Please review the remarks from compliance and submit updated documentation to proceed.
                </p>
              </div>
            </div>
          </div>
        )}
        {kycInfo && (
          <div className="mb-10 grid gap-6 md:grid-cols-2">
            <div className="card-surface p-6">
              <h3 className="text-lg font-semibold text-[var(--heading-color)]">Compliance Status</h3>
              <p className="mt-2 text-sm text-[var(--subtle-text)]">
                Current status
                <span className={`ml-2 font-semibold ${statusClass}`}>
                  {formatLabel(effectiveKycStatus)}
                </span>
              </p>
              <p className="mt-3 text-sm text-[var(--muted-text)]">
                Last updated {formatDateTime(kycInfo.lastUpdated)}
              </p>
            </div>
            <div className="card-surface p-6">
              <h3 className="text-lg font-semibold text-[var(--heading-color)]">Latest Submission</h3>
              {kycInfo.submission ? (
                <dl className="mt-4 grid gap-3 text-sm text-[var(--subtle-text)]">
                  {Object.entries(kycInfo.submission).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4">
                      <dt className="font-medium text-[var(--muted-text)]">{formatLabel(key)}</dt>
                      <dd className="max-w-[12rem] break-words text-right text-[var(--subtle-text)]">{formatSubmissionValue(value)}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-2 text-sm text-[var(--muted-text)]">Provide documents to complete verification.</p>
              )}
            </div>
          </div>
        )}

        {/* Investor Category Badge - Only for investors */}
        {user?.role === 'investor' && (
          <div className="mb-6 rounded-xl border-2 border-blue-200 bg-blue-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-900">Investor Category</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
                    user.investorCategory === 'retail' ? 'bg-green-100 text-green-800 border-2 border-green-300' :
                    user.investorCategory === 'accredited' ? 'bg-amber-100 text-amber-800 border-2 border-amber-300' :
                    'bg-blue-100 text-blue-800 border-2 border-blue-300'
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${
                      user.investorCategory === 'retail' ? 'bg-green-600' :
                      user.investorCategory === 'accredited' ? 'bg-amber-600' :
                      'bg-blue-600'
                    }`} />
                    {user.investorCategory.charAt(0).toUpperCase() + user.investorCategory.slice(1)}
                  </span>
                  <span className="text-sm text-blue-700">
                    Max Limit: ₹{
                      user.investorCategory === 'retail' ? '1,00,000' :
                      user.investorCategory === 'accredited' ? '10,00,000' :
                      '1,00,00,000'
                    }
                  </span>
                </div>
              </div>
              <Link
                href="/legal/risk-disclosure"
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                View Limits
              </Link>
            </div>
          </div>
        )}

        {/* Balance Cards */}
        <div className="mb-10 grid gap-6 md:grid-cols-2">
          <div className="card-surface p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--heading-color)]">Demo Balance</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Test Credits
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-[var(--primary-color)]">
                ₹{user?.demoBalance.toLocaleString() ?? '0'}
              </span>
            </div>
            <p className="mt-2 text-xs text-[var(--muted-text)]">
              Simulated balance for testing trades
            </p>
          </div>

          <div className="card-surface p-6 border-2 border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-emerald-900">Mock e₹ Balance</h3>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                CBDC Simulation
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-emerald-600">
                ₹{user?.cbdcBalance.toLocaleString() ?? '0'}
              </span>
            </div>
            <p className="mt-2 text-xs text-emerald-700">
              Simulated digital rupee for settlement testing
            </p>
          </div>
        </div>

        {/* Portfolio Section */}
        <div className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-[var(--heading-color)]">My Portfolio</h3>
            <Link
              href="/portfolio"
              className="text-sm font-medium text-[var(--primary-color)] hover:text-[var(--primary-color-hover)]"
            >
              View All →
            </Link>
          </div>
          {activePortfolio.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activePortfolio.map((item) => (
                <Link key={item.id} href={`/asset/${item.token_id}`} className="card-surface p-5 hover:shadow-lg transition-shadow cursor-pointer">
                  <h4 className="text-lg font-semibold text-[var(--heading-color)] hover:text-[var(--primary-color)]">{item.tokens?.token_name ?? 'Token'}</h4>
                  <p className="text-sm text-[var(--muted-text)]">{item.tokens?.token_symbol ?? '—'}</p>
                  <div className="mt-5">
                    <p className="text-3xl font-bold text-[var(--primary-color)]">{item.balance}</p>
                    <p className="text-xs uppercase text-[var(--muted-text)]">Tokens held</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-10 text-center">
              <p className="text-sm font-medium text-[var(--subtle-text)]">You don't have any tokens yet.</p>
              <p className="mt-2 text-xs text-[var(--muted-text)]">Submit KYC and place a trade to populate this view.</p>
            </div>
          )}
        </div>

        {/* Available Tokens */}
        <div>
          <h3 className="text-2xl font-semibold text-[var(--heading-color)] mb-4">Available Tokens</h3>
          {tokensFallback && (
            <p className="text-xs text-[var(--muted-text)] mb-3">Showing prototype sample tokens while live data loads.</p>
          )}
          {tokens.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tokens.map((token) => {
                const badgeClass = token.status === 'active'
                  ? 'badge-success'
                  : 'badge-soft text-[var(--muted-text)] border-[var(--border-subtle)]';
                return (
                  <div key={token.id} className="card-surface p-6 hover:shadow-lg transition-shadow">
                    <Link href={`/asset/${token.id}`}>
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-[var(--heading-color)] hover:text-[var(--primary-color)] cursor-pointer">{token.name}</h4>
                          <p className="text-sm text-[var(--muted-text)]">{token.symbol}</p>
                        </div>
                        <span className={`pill text-xs ${badgeClass}`}>
                          {formatLabel(token.status)}
                        </span>
                      </div>
                    </Link>
                    <p className="mb-4 text-sm text-[var(--subtle-text)]">{token.assetType ?? '—'}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[var(--muted-text)]">Total Supply</p>
                        <p className="text-lg font-semibold text-[var(--heading-color)]">{token.totalSupply.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/asset/${token.id}`}
                          className="px-4 py-2 text-sm font-medium text-[var(--primary-color)] hover:bg-blue-50 rounded-lg"
                        >
                          View
                        </Link>
                        <Link
                          href={`/trading/${token.id}`}
                          className="button-primary px-4 py-2 text-sm"
                        >
                          Trade
                        </Link>
                      </div>
                    </div>
                    {token.valuation ? (
                      <p className="mt-4 text-xs text-[var(--muted-text)]">Valuation: ₹{token.valuation.toLocaleString()}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel p-10 text-center">
              <p className="text-sm font-medium text-[var(--subtle-text)]">No tokens available for trading yet.</p>
            </div>
          )}
        </div>

        <div className="mt-12">
          <h3 className="text-2xl font-semibold text-[var(--heading-color)] mb-4">Recent Trades</h3>
          {tradesFallback && (
            <p className="text-xs text-[var(--muted-text)] mb-3">Showing simulated trades captured in the sandbox.</p>
          )}
          {recentTrades.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-white/95 shadow-sm">
              <ul className="divide-y divide-[var(--border-subtle)]">
                {recentTrades.map((trade) => {
                  const relatedToken = tokenMap.get(trade.tokenId);
                  return (
                    <li key={trade.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[var(--heading-color)]">
                          {relatedToken?.name ?? 'Token'} ({relatedToken?.symbol ?? trade.tokenId})
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted-text)]">
                          {trade.side === 'buy' ? 'Bought' : 'Sold'} {trade.quantity} @ ₹{trade.price.toLocaleString()} •
                          ₹{trade.totalAmount.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right text-xs text-[var(--muted-text)] sm:text-left">
                        <p className="font-medium text-[var(--subtle-text)] capitalize">{trade.settlementMethod} settlement</p>
                        <p>{formatDateTime(trade.createdAt)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="glass-panel p-10 text-center">
              <p className="text-sm font-medium text-[var(--subtle-text)]">No trades recorded yet.</p>
              <p className="mt-2 text-xs text-[var(--muted-text)]">Place a mock trade to populate this view.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
