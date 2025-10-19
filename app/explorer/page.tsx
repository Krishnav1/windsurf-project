/**
 * Token Explorer Page
 * 
 * Public page to explore all active tokens with hash verification
 */

"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { Tooltip } from "@/components/ui/Tooltip";
import { layout, palette, typography } from "@/lib/design/tokens";

type ExplorerToken = {
  id: string;
  name: string;
  symbol: string;
  status: string;
  assetType: string;
  totalSupply: number;
  decimals: number;
  issuer?: string | null;
  issuerRegistration?: string | null;
  assetDescription?: string | null;
  valuation?: number | null;
  valuationDate?: string | null;
  custodianName?: string | null;
  documentHashes: {
    custodyProof?: string | null;
    legalDocument?: string | null;
    valuationReport?: string | null;
  };
  metadataHash: string;
  contractAddress?: string | null;
  mintTxHash?: string | null;
  chainId?: number | null;
  isFrozen?: boolean | null;
  freezeReason?: string | null;
  approvedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Approved", value: "approved" },
  { label: "Pending", value: "pending" },
  { label: "Rejected", value: "rejected" },
  { label: "Frozen", value: "frozen" },
] as const;

type StatusFilter = (typeof statusOptions)[number]["value"];

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  approved: "bg-sky-50 text-sky-700 border border-sky-200",
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  rejected: "bg-rose-50 text-rose-600 border border-rose-200",
  frozen: "bg-slate-100 text-slate-600 border border-slate-200",
};

const truncate = (value?: string | null, size = 10) => {
  if (!value) return "—";
  if (value.length <= size * 2) return value;
  return `${value.slice(0, size)}…${value.slice(-size)}`;
};

const formatNumber = (value?: number | null) => {
  if (value === undefined || value === null) return "—";
  return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const styles = statusStyles[normalized] ?? "bg-slate-100 text-slate-600 border border-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${styles}`}>
      {status}
    </span>
  );
}

function SummaryTile({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <Card padding="lg" className="relative overflow-hidden">
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--neutral-500)]">{label}</p>
        <p className="text-3xl font-semibold text-[var(--foreground)]">{value}</p>
        {helper && <p className="text-xs text-[var(--neutral-500)]">{helper}</p>}
      </div>
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[var(--primary-surface)]" />
    </Card>
  );
}

function TokenModal({ token, onClose }: { token: ExplorerToken; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8 backdrop-blur">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--neutral-200)] bg-white p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className={typography.headings.eyebrow} style={{ color: palette.primary.base }}>
              On-chain record
            </p>
            <h3 className={`${typography.headings.h3} text-[var(--foreground)]`}>{token.name}</h3>
            <p className="text-sm text-[var(--neutral-500)]">{token.symbol}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-[var(--neutral-200)] p-2 text-[var(--neutral-500)] hover:text-[var(--foreground)]"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeWidth={1.5} d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card padding="lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[var(--neutral-500)]">Asset overview</h4>
                <StatusBadge status={token.status} />
              </div>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--neutral-500)]">Asset type</dt>
                  <dd className="font-medium text-[var(--foreground)] capitalize">{token.assetType}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--neutral-500)]">Total supply</dt>
                  <dd className="font-medium text-[var(--foreground)]">{formatNumber(token.totalSupply)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--neutral-500)]">Decimals</dt>
                  <dd className="font-medium text-[var(--foreground)]">{token.decimals}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--neutral-500)]">Issuer</dt>
                  <dd className="text-right font-medium text-[var(--foreground)]">
                    {token.issuer ?? "—"}
                    {token.issuerRegistration && (
                      <p className="text-xs text-[var(--neutral-500)]">{token.issuerRegistration}</p>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--neutral-500)]">Custodian</dt>
                  <dd className="font-medium text-[var(--foreground)]">{token.custodianName ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--neutral-500)]">Valuation</dt>
                  <dd className="text-right font-medium text-[var(--foreground)]">
                    {token.valuation ? `₹${formatNumber(token.valuation)}` : "—"}
                    {token.valuationDate && (
                      <p className="text-xs text-[var(--neutral-500)]">as of {formatDate(token.valuationDate)}</p>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </Card>

          <Card padding="lg">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-[var(--neutral-500)]">Blockchain evidence</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[var(--neutral-500)]">Metadata hash</p>
                  <code className="mt-1 block break-all rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-100)] px-3 py-2 text-xs text-[var(--neutral-600)]">
                    {token.metadataHash}
                  </code>
                </div>
                <div>
                  <p className="text-[var(--neutral-500)]">Contract address</p>
                  {token.contractAddress ? (
                    <a
                      href={`https://amoy.polygonscan.com/address/${token.contractAddress}`}
                      className="mt-1 inline-flex items-center gap-2 text-xs text-[var(--primary-color)] hover:text-[var(--primary-color-hover)]"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {token.contractAddress}
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l6-6M5 3h4v4" />
                      </svg>
                    </a>
                  ) : (
                    <span className="mt-1 block text-xs text-[var(--neutral-500)]">Pending deployment</span>
                  )}
                </div>
                {token.mintTxHash && (
                  <div>
                    <p className="text-[var(--neutral-500)]">Mint transaction</p>
                    <a
                      href={`https://amoy.polygonscan.com/tx/${token.mintTxHash}`}
                      className="mt-1 inline-flex items-center gap-2 text-xs text-[var(--primary-color)] hover:text-[var(--primary-color-hover)]"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {token.mintTxHash}
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l6-6M5 3h4v4" />
                      </svg>
                    </a>
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-[var(--neutral-500)]">Document hashes</p>
                  <dl className="space-y-2">
                    {[
                      ["Legal documentation", token.documentHashes.legalDocument],
                      ["Valuation report", token.documentHashes.valuationReport],
                      ["Custody proof", token.documentHashes.custodyProof],
                    ].map(([label, value]) => (
                      <div key={label as string}>
                        <dt className="text-xs text-[var(--neutral-500)]">{label}</dt>
                        <dd>
                          {value ? (
                            <code className="mt-1 block break-all rounded border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-[11px] text-[var(--neutral-600)]">
                              {value}
                            </code>
                          ) : (
                            <span className="mt-1 block text-xs text-[var(--neutral-500)]">Not provided</span>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-[var(--neutral-500)]">
            Added {token.createdAt ? formatDate(token.createdAt) : "—"}
            {token.approvedAt && ` • Approved ${formatDate(token.approvedAt)}`}
          </div>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary-color)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--primary-color-hover)]"
          >
            Register to request allocation
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3h8m0 0v8m0-8L4 12" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ExplorerPage() {
  const [tokens, setTokens] = useState<ExplorerToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedToken, setSelectedToken] = useState<ExplorerToken | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch("/api/tokens/public");
        if (!response.ok) {
          throw new Error("Failed to fetch tokens");
        }

        const data = await response.json();

        if (data.success) {
          setTokens(data.tokens as ExplorerToken[]);
          setError(null);
        } else {
          throw new Error("Failed to fetch tokens");
        }
      } catch (fetchError) {
        console.error("Error fetching tokens:", fetchError);
        setError("Unable to load tokens right now. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  const summary = useMemo(() => {
    const totalTokens = tokens.length;
    const activeTokens = tokens.filter((token) => token.status === "active").length;
    const pendingTokens = tokens.filter((token) => token.status === "pending").length;
    const totalSupplyActive = tokens
      .filter((token) => token.status === "active" || token.status === "approved")
      .reduce((acc, token) => acc + (token.totalSupply ?? 0), 0);

    const uniqueIssuers = new Set(tokens.map((token) => token.issuer).filter(Boolean)).size;

    return {
      totalTokens,
      activeTokens,
      pendingTokens,
      totalSupplyActive,
      uniqueIssuers,
    };
  }, [tokens]);

  const filteredTokens = useMemo(() => {
    return tokens.filter((token) => {
      const matchesStatus = statusFilter === "all" || token.status.toLowerCase() === statusFilter;
      const query = searchTerm.trim().toLowerCase();
      const matchesQuery =
        query.length === 0 ||
        token.name.toLowerCase().includes(query) ||
        token.symbol.toLowerCase().includes(query) ||
        token.metadataHash.toLowerCase().includes(query) ||
        token.contractAddress?.toLowerCase().includes(query);

      return matchesStatus && matchesQuery;
    });
  }, [tokens, statusFilter, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
          <SectionHeading
            eyebrow="Explorer"
            title="Discover tokenized real-world assets"
            description="Load the latest assets issued, verified, and deployed on-chain."
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-56 animate-pulse rounded-2xl border border-[var(--neutral-200)] bg-white/70 p-6"
              >
                <div className="mb-8 h-6 w-32 rounded bg-[var(--neutral-200)]" />
                <div className="space-y-3">
                  <div className="h-4 w-full rounded bg-[var(--neutral-100)]" />
                  <div className="h-4 w-5/6 rounded bg-[var(--neutral-100)]" />
                  <div className="h-4 w-2/3 rounded bg-[var(--neutral-100)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center space-y-6">
          <SectionHeading
            eyebrow="Explorer"
            title="Token registry temporarily unavailable"
            description={
              <span>
                {error} If the issue persists, contact the platform administrator or check the status
                page.
              </span>
            }
            align="center"
          />
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--primary-color)] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--primary-color-hover)]"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--background)] pb-20">
      <div className={`${layout.container} ${layout.sectionSpacing} space-y-16`}>
        <header className="space-y-12">
          <SectionHeading
            eyebrow="Explorer"
            title="Transparent registry of tokenized assets"
            description={
              <span>
                Review the lifecycle of every asset token submitted to the sandbox. Track statuses,
                hashes, and deployment evidence directly from Polygon Amoy.
              </span>
            }
            align="center"
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <SummaryTile
              label="Total tokens"
              value={summary.totalTokens.toString()}
              helper="All issuance attempts irrespective of status"
            />
            <SummaryTile
              label="Active tokens"
              value={summary.activeTokens.toString()}
              helper="Live and available for investor allocation"
            />
            <SummaryTile
              label="Pending review"
              value={summary.pendingTokens.toString()}
              helper="Awaiting admin approval or documentation"
            />
            <SummaryTile
              label="Total supply (active/approved)"
              value={formatNumber(summary.totalSupplyActive)}
              helper={`${summary.uniqueIssuers} unique issuers`}
            />
          </div>
        </header>

        <section className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    statusFilter === option.value
                      ? "bg-[var(--primary-color)] text-white shadow-sm"
                      : "border border-[var(--neutral-200)] bg-white text-[var(--neutral-500)] hover:border-[var(--neutral-300)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, symbol, hash"
                className="w-full rounded-xl border border-[var(--neutral-200)] bg-white px-4 py-3 text-sm text-[var(--neutral-600)] shadow-sm focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
              />
              <svg
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--neutral-400)]"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.5 15a6.5 6.5 0 1 1 4.596-11.096A6.5 6.5 0 0 1 8.5 15Zm5.5-.5 3.5 3.5 6.5-3.5V7m0 3.5 2 2" />
              </svg>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--neutral-200)] bg-white/90 p-6 shadow-sm">
            <div className="hidden lg:grid lg:grid-cols-12 lg:gap-4 lg:text-xs lg:uppercase lg:tracking-wide lg:text-[var(--neutral-400)]">
              <span className="col-span-3">Token</span>
              <span className="col-span-2">Issuer</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-2">Supply</span>
              <span className="col-span-3">Metadata hash</span>
            </div>
            <div className="mt-4 space-y-4">
              {filteredTokens.length > 0 ? (
                filteredTokens.map((token) => (
                  <button
                    key={token.id}
                    onClick={() => setSelectedToken(token)}
                    className="w-full rounded-xl border border-[var(--neutral-200)] bg-white p-4 text-left transition hover:border-[var(--primary-color)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
                  >
                    <div className="grid gap-4 lg:grid-cols-12 lg:items-center">
                      <div className="lg:col-span-3">
                        <p className="text-sm font-semibold text-[var(--foreground)]">{token.name}</p>
                        <p className="text-xs uppercase text-[var(--neutral-500)]">{token.symbol}</p>
                      </div>
                      <div className="lg:col-span-2">
                        <p className="text-sm text-[var(--neutral-600)]">{token.issuer ?? "—"}</p>
                        {token.issuerRegistration && (
                          <p className="text-xs text-[var(--neutral-400)]">{token.issuerRegistration}</p>
                        )}
                      </div>
                      <div className="lg:col-span-2">
                        <StatusBadge status={token.status} />
                        {token.isFrozen && token.freezeReason && (
                          <p className="mt-1 text-xs text-rose-500">Frozen: {token.freezeReason}</p>
                        )}
                      </div>
                      <div className="lg:col-span-2">
                        <p className="text-sm font-medium text-[var(--foreground)]">{formatNumber(token.totalSupply)}</p>
                        <p className="text-xs text-[var(--neutral-500)] capitalize">{token.assetType}</p>
                      </div>
                      <div className="lg:col-span-3">
                        <div className="flex items-center gap-2">
                          <Tooltip label="SHA-256 metadata fingerprint stored on-chain">
                            <svg className="h-4 w-4 text-[var(--neutral-400)]" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 3.5 3.5 7v6l6.5 3.5 6.5-3.5V7L10 3.5Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 10.5V7m0 3.5 2 2" />
                            </svg>
                          </Tooltip>
                          <p className="break-all text-xs font-medium text-[var(--neutral-600)]">
                            {truncate(token.metadataHash, 12)}
                          </p>
                        </div>
                        {token.contractAddress && (
                          <a
                            href={`https://amoy.polygonscan.com/address/${token.contractAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--primary-color)] hover:text-[var(--primary-color-hover)]"
                          >
                            View contract
                            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l6-6M5 3h4v4" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                    {token.assetDescription && (
                      <p className="mt-4 text-sm text-[var(--neutral-500)]">{token.assetDescription}</p>
                    )}
                  </button>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--neutral-200)] bg-[var(--neutral-100)]/60 p-12 text-center">
                  <p className="text-sm font-medium text-[var(--neutral-500)]">No tokens matched your filters</p>
                  <p className="mt-2 text-xs text-[var(--neutral-400)]">
                    Adjust the status filter or search different keywords.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {selectedToken && <TokenModal token={selectedToken} onClose={() => setSelectedToken(null)} />}
    </div>
  );
}
