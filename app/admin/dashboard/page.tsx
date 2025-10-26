/**
 * Admin Dashboard Page
 * 
 * Central control panel for platform administrators
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { Tooltip } from "@/components/ui/Tooltip";

// Quick action cards for admin
const ADMIN_QUICK_ACTIONS = [
  {
    title: 'Valuation Review',
    description: 'Review and approve quarterly valuations',
    href: '/admin/valuations',
    icon: '💰',
    color: 'bg-emerald-500'
  },
  {
    title: 'KYC Verification',
    description: 'Review and verify user KYC documents',
    href: '/admin/kyc',
    icon: '📋',
    color: 'bg-blue-500'
  },
  {
    title: 'Token Approvals',
    description: 'Approve or reject token listings',
    href: '/admin/tokens',
    icon: '🪙',
    color: 'bg-green-500'
  },
  {
    title: 'User Management',
    description: 'Manage platform users',
    href: '/admin/users',
    icon: '👥',
    color: 'bg-purple-500'
  },
  {
    title: 'Audit Logs',
    description: 'View system audit trails',
    href: '/admin/audit',
    icon: '📊',
    color: 'bg-orange-500'
  }
];

type StoredUser = {
  id: string;
  role: "investor" | "issuer" | "admin" | "auditor";
  fullName?: string;
  full_name?: string;
};

type DashboardUser = {
  id: string;
  role: StoredUser["role"];
  fullName: string;
};

type KycUser = {
  id: string;
  full_name: string;
  email: string;
  role: StoredUser["role"];
  kyc_status: "pending" | "approved" | "rejected";
  created_at: string;
};

type TokenRecord = {
  id: string;
  token_name: string;
  token_symbol: string;
  asset_type: string;
  total_supply: number;
  issuer_legal_name: string | null;
  metadata_hash: string;
  status: "pending" | "approved" | "rejected" | "active" | "frozen";
  contract_address: string | null;
  created_at: string;
};

type DisplayToken = {
  id: string;
  name: string;
  symbol: string;
  status: TokenRecord["status"];
  metadataHash: string;
  contractAddress: string | null;
  assetType: string;
  createdAt: string;
};

type OverviewMetrics = {
  totalTokens: number;
  activeTokens: number;
  pendingTokens: number;
  totalSupplyActive: number;
  uniqueIssuers: number;
};

type OverviewUserStats = {
  totalInvestors: number;
  totalIssuers: number;
  pendingKYC: number;
  approvedKYC: number;
};

type OverviewToken = {
  id: string;
  name: string;
  symbol: string;
  status: string;
  metadataHash: string;
  contractAddress?: string | null;
  createdAt: string;
  assetType: string;
};

type OverviewTransaction = {
  id: string;
  type: string;
  quantity: number | null;
  price: number | null;
  totalAmount: number | null;
  settlementStatus: string;
  blockchainTxHash?: string | null;
  createdAt: string;
  token: {
    id: string;
    name: string;
    symbol: string;
  } | null;
};

type OverviewAuditLog = {
  id: string;
  action: string;
  resource_type?: string | null;
  severity: "info" | "warning" | "critical";
  details?: Record<string, unknown> | null;
  created_at: string;
};

type AdminOverview = {
  success: true;
  metrics: OverviewMetrics;
  userStats: OverviewUserStats;
  recentTokens: OverviewToken[];
  recentTransactions: OverviewTransaction[];
  auditLogs: OverviewAuditLog[];
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [users, setUsers] = useState<KycUser[]>([]);
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [displayTokens, setDisplayTokens] = useState<DisplayToken[]>([]);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(userData) as StoredUser;
    if (parsedUser.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    const normalizedUser: DashboardUser = {
      id: parsedUser.id,
      role: parsedUser.role,
      fullName: parsedUser.fullName ?? parsedUser.full_name ?? "Admin",
    };

    setUser(normalizedUser);
    fetchData(token);
  }, [router]);

  const fetchData = async (token: string) => {
    try {
      const [overviewRes, tokensRes] = await Promise.all([
        fetch("/api/admin/overview", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/tokens/issue", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!overviewRes.ok) {
        throw new Error("Failed to load admin overview");
      }

      const overviewData: AdminOverview = await overviewRes.json();
      if (overviewData.success) {
        setOverview(overviewData);
        setError(null);
      }

      const tokensData = await tokensRes.json();
      if (tokensData.success && Array.isArray(tokensData.tokens)) {
        const tokenRecords = tokensData.tokens as TokenRecord[];
        setTokens(tokenRecords);
        const normalized: DisplayToken[] = tokenRecords.map((token) => ({
          id: token.id,
          name: token.token_name,
          symbol: token.token_symbol,
          status: token.status,
          metadataHash: token.metadata_hash,
          contractAddress: token.contract_address,
          assetType: token.asset_type,
          createdAt: token.created_at,
        }));
        setDisplayTokens(normalized);
      }
    } catch (fetchError) {
      console.error("Error fetching admin data:", fetchError);
      setError("Unable to load latest analytics. Please refresh or check system status.");
    } finally {
      setLoading(false);
    }
  };


  const handleTokenApproval = async (tokenId: string, action: 'approve' | 'reject') => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (action === 'approve' && !confirm('This will deploy the token to blockchain. Continue?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/approve-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId,
          action,
          rejectionReason: action === 'reject' ? 'Documentation insufficient' : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Token ${action}d successfully${action === 'approve' ? '\nContract: ' + data.deployment?.contractAddress : ''}`);
        fetchData(token);
      } else {
        alert(data.error || data.details);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update token status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const pendingTokens = useMemo(() => tokens.filter((t) => t.status === "pending"), [tokens]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--primary-color)]" />
          <p className="mt-4 text-sm text-[var(--neutral-500)]">Loading admin dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <nav className="border-b border-[var(--neutral-200)] bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/">
              <h1 className="text-xl font-semibold text-[var(--primary-color)]">TokenPlatform</h1>
            </Link>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-700">Admin</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-[var(--neutral-500)]">
            <Link
              href="/admin/valuations"
              className="rounded-lg border border-[var(--neutral-200)] px-3 py-1.5 text-[var(--neutral-600)] transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
            >
              Valuations
            </Link>
            <span>{user?.fullName}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-[var(--neutral-200)] px-3 py-1.5 text-[var(--neutral-600)] transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between">
          <SectionHeading
            eyebrow="Operational command center"
            title="Monitor issuance, compliance, and on-chain actions"
            description="Track sandbox activity in real time, approve participants, and deploy contracts with full auditability."
          />
          <Link
            href="/admin/compliance-view"
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
          >
            📊 Compliance Dashboard
          </Link>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
            {error}
          </div>
        )}

        {/* Quick Actions */}
        <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ADMIN_QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card padding="lg" className="border border-[var(--neutral-200)] bg-white hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-start gap-3">
                  <div className={`${action.color} text-white p-3 rounded-lg text-2xl`}>
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--foreground)]">{action.title}</h3>
                    <p className="text-xs text-[var(--neutral-500)] mt-1">{action.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-4">
          <Card padding="lg" className="border border-[var(--neutral-200)] bg-white">
            <p className="text-xs uppercase tracking-wide text-[var(--neutral-500)]">Total tokens</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">{overview?.metrics.totalTokens ?? tokens.length}</p>
            <p className="text-xs text-[var(--neutral-500)]">{overview?.metrics.uniqueIssuers ?? 0} unique issuers</p>
          </Card>
          <Card padding="lg" className="border border-[var(--neutral-200)] bg-white">
            <p className="text-xs uppercase tracking-wide text-[var(--neutral-500)]">Active supply</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">{overview ? overview.metrics.totalSupplyActive.toLocaleString() : "—"}</p>
            <p className="text-xs text-[var(--neutral-500)]">Includes approved deployments</p>
          </Card>
          <Card padding="lg" className="border border-[var(--neutral-200)] bg-white">
            <p className="text-xs uppercase tracking-wide text-[var(--neutral-500)]">Pending KYC</p>
            <p className="mt-3 text-3xl font-semibold text-amber-600">{overview?.userStats.pendingKYC ?? 0}</p>
            <p className="text-xs text-[var(--neutral-500)]">
              <Link href="/admin/kyc" className="text-[#0B67FF] hover:underline">
                View KYC Dashboard →
              </Link>
            </p>
          </Card>
          <Card padding="lg" className="border border-[var(--neutral-200)] bg-white">
            <p className="text-xs uppercase tracking-wide text-[var(--neutral-500)]">Pending tokens</p>
            <p className="mt-3 text-3xl font-semibold text-amber-600">{pendingTokens.length}</p>
            <p className="text-xs text-[var(--neutral-500)]">Requires final approval & deployment</p>
          </Card>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <Card padding="lg" className="lg:col-span-2 border border-[var(--neutral-200)] bg-white">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Participant pipeline</h3>
              <Tooltip label="KYC progression across issuer and investor cohorts">
                <svg className="h-5 w-5 text-[var(--neutral-400)]" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 3.5 3.5 7v6l6.5 3.5 6.5-3.5V7L10 3.5Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 10.5V7m0 3.5 2 2" />
                </svg>
              </Tooltip>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--neutral-200)] bg-[var(--neutral-100)]/60 p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--neutral-500)]">Issuers</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{overview?.userStats.totalIssuers ?? "—"}</p>
                <p className="text-xs text-[var(--neutral-500)]">Approved: {overview?.userStats.approvedKYC ?? "—"}</p>
              </div>
              <div className="rounded-2xl border border-[var(--neutral-200)] bg-[var(--neutral-100)]/60 p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--neutral-500)]">Investors</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{overview?.userStats.totalInvestors ?? "—"}</p>
                <p className="text-xs text-[var(--neutral-500)]">Pending KYC: {overview?.userStats.pendingKYC ?? 0}</p>
              </div>
            </div>
          </Card>

          <Card padding="lg" className="border border-[var(--neutral-200)] bg-white">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Recent tokens</h3>
            <div className="mt-4 space-y-4 text-sm text-[var(--neutral-600)]">
              {(overview?.recentTokens ?? displayTokens.slice(0, 5)).map((token) => (
                <div key={token.id} className="rounded-xl border border-[var(--neutral-200)] bg-[var(--neutral-100)]/60 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">{token.name}</p>
                      <p className="text-xs uppercase text-[var(--neutral-500)]">{token.symbol}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600">{token.status}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <Tooltip label="Metadata hash anchored on-chain">
                      <svg className="h-4 w-4 text-[var(--neutral-400)]" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 3.5 3.5 7v6l6.5 3.5 6.5-3.5V7L10 3.5Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 10.5V7m0 3.5 2 2" />
                      </svg>
                    </Tooltip>
                    <code className="truncate text-[var(--neutral-500)]">{token.metadataHash.slice(0, 10)}…</code>
                  </div>
                  {token.contractAddress && (
                    <a
                      href={`https://amoy.polygonscan.com/address/${token.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--primary-color)] hover:text-[var(--primary-color-hover)]"
                    >
                      View contract
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l6-6M5 3h4v4" />
                      </svg>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card padding="lg" className="border border-[var(--neutral-200)] bg-white">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Recent activity</h3>
              <Tooltip label="Transactions across deployments, mints, transfers, and settlements">
                <svg className="h-5 w-5 text-[var(--neutral-400)]" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3h3l2 3h5" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10h12V7" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 11h12" />
                </svg>
              </Tooltip>
            </div>
            <div className="mt-4 space-y-4 text-sm text-[var(--neutral-600)]">
              {(overview?.recentTransactions ?? []).length > 0 ? (
                overview!.recentTransactions.map((tx) => (
                  <div key={tx.id} className="rounded-xl border border-[var(--neutral-200)] bg-[var(--neutral-100)]/60 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-[var(--primary-surface)] px-2 py-0.5 text-xs font-semibold capitalize text-[var(--primary-color)]">
                          {tx.type}
                        </span>
                        {tx.token && <span className="text-xs text-[var(--neutral-500)]">{tx.token.symbol}</span>}
                      </div>
                      <span className="text-xs text-[var(--neutral-400)]">{new Date(tx.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                      {tx.quantity !== null && <span>Qty: {tx.quantity}</span>}
                      {tx.totalAmount !== null && <span>Amount: {tx.totalAmount}</span>}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[var(--neutral-500)]">{tx.settlementStatus}</span>
                    </div>
                    {tx.blockchainTxHash && (
                      <a
                        href={`https://amoy.polygonscan.com/tx/${tx.blockchainTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--primary-color)] hover:text-[var(--primary-color-hover)]"
                      >
                        View on explorer
                        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l6-6M5 3h4v4" />
                        </svg>
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--neutral-400)]">No recent transactions recorded.</p>
              )}
            </div>
          </Card>

          <Card padding="lg" className="border border-[var(--neutral-200)] bg-white">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Audit log highlights</h3>
            <div className="mt-4 space-y-4 text-sm text-[var(--neutral-600)]">
              {(overview?.auditLogs ?? []).length > 0 ? (
                overview!.auditLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-[var(--neutral-200)] bg-[var(--neutral-100)]/60 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--neutral-500)]">{log.action.replace(/_/g, " ")}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          log.severity === "critical"
                            ? "bg-rose-100 text-rose-700"
                            : log.severity === "warning"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {log.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[var(--neutral-500)]">{log.resource_type ?? "general"}</p>
                    <p className="mt-1 text-xs text-[var(--neutral-400)]">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--neutral-400)]">No audit log entries available.</p>
              )}
            </div>
          </Card>
        </section>

        <section className="mt-12 space-y-8">
          <SectionHeading
            eyebrow="Quick Actions"
            title="Approval Center"
            description="Access all pending approvals and verification workflows from one place."
          />
          <div className="grid gap-6 md:grid-cols-3">
            <Link href="/admin/kyc">
              <Card padding="lg" className="border border-[var(--neutral-200)] bg-white hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">{overview?.userStats.pendingKYC ?? 0}</span>
                </div>
                <h4 className="text-lg font-semibold text-[var(--foreground)]">KYC Verification</h4>
                <p className="text-sm text-[var(--neutral-500)] mt-2">Review pending KYC documents</p>
              </Card>
            </Link>
            
            <Link href="/admin/approvals">
              <Card padding="lg" className="border border-[var(--neutral-200)] bg-white hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{pendingTokens.length}</span>
                </div>
                <h4 className="text-lg font-semibold text-[var(--foreground)]">Approval Center</h4>
                <p className="text-sm text-[var(--neutral-500)] mt-2">All pending approvals</p>
              </Card>
            </Link>
            
            <Link href="/admin/audit">
              <Card padding="lg" className="border border-[var(--neutral-200)] bg-white hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-[var(--foreground)]">Audit Logs</h4>
                <p className="text-sm text-[var(--neutral-500)] mt-2">View system activity</p>
              </Card>
            </Link>
          </div>
        </section>

        <section className="mt-12 space-y-8">
          <SectionHeading
            eyebrow="Issuance approvals"
            title="Pending token deployments"
            description="Validate documentation hashes and issuer credentials before approving deployments."
          />
          {pendingTokens.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {pendingTokens.map((token) => (
                <Card key={token.id} padding="lg" className="border border-[var(--neutral-200)] bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-[var(--foreground)]">{token.token_name}</h4>
                      <p className="text-xs uppercase text-[var(--neutral-500)]">{token.token_symbol}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Pending</span>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-[var(--neutral-600)]">
                    <p><strong>Asset type:</strong> {token.asset_type}</p>
                    <p><strong>Total supply:</strong> {token.total_supply}</p>
                    <p><strong>Issuer:</strong> {token.issuer_legal_name}</p>
                    <div className="flex items-center gap-2">
                      <strong className="text-xs text-[var(--neutral-500)]">Metadata hash:</strong>
                      <Tooltip label="Verify hash against issuer-submitted documents before approval">
                        <svg className="h-4 w-4 text-[var(--neutral-400)]" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 3.5 3.5 7v6l6.5 3.5 6.5-3.5V7L10 3.5Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 10.5V7m0 3.5 2 2" />
                        </svg>
                      </Tooltip>
                      <code className="truncate text-xs text-[var(--neutral-500)]">{token.metadata_hash}</code>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3 text-sm font-semibold">
                    <button
                      onClick={() => handleTokenApproval(token.id, "approve")}
                      className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-700"
                    >
                      Approve & deploy
                    </button>
                    <button
                      onClick={() => handleTokenApproval(token.id, "reject")}
                      className="flex-1 rounded-lg border border-rose-200 px-4 py-2 text-rose-600 transition hover:bg-rose-50"
                    >
                      Reject
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card padding="lg" className="border border-[var(--neutral-200)] bg-white text-sm text-[var(--neutral-500)]">
              No token issuance requests require action.
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
