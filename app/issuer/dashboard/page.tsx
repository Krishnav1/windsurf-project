/**
 * Issuer Dashboard Page
 * 
 * Token issuance interface for asset issuers
 */

"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { Tooltip } from '@/components/ui/Tooltip';

type StoredUser = {
  id: string;
  role: 'investor' | 'issuer' | 'admin' | 'auditor';
  fullName?: string;
  full_name?: string;
};

type DashboardUser = {
  id: string;
  role: StoredUser['role'];
  fullName: string;
};

type TokenRecord = {
  id: string;
  token_name: string;
  token_symbol: string;
  asset_type: string;
  total_supply: number;
  issuer_legal_name: string | null;
  metadata_hash: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'frozen';
  contract_address: string | null;
  created_at: string;
};

type TokensResponse = {
  success: boolean;
  tokens: TokenRecord[];
};

type KycInfo = {
  status: 'pending' | 'approved' | 'rejected';
  lastUpdated: string | null;
  submission: Record<string, unknown> | null;
};

type IssuanceFormState = {
  tokenName: string;
  tokenSymbol: string;
  assetType: string;
  totalSupply: string;
  assetDescription: string;
  assetValuation: string;
  valuationDate: string;
  custodianName: string;
  issuerLegalName: string;
  issuerRegistrationNumber: string;
};

type UploadDocuments = {
  legalDocument: File | null;
  valuationReport: File | null;
  custodyProof: File | null;
};

export default function IssuerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [kycInfo, setKycInfo] = useState<KycInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<IssuanceFormState>({
    tokenName: '',
    tokenSymbol: '',
    assetType: 'real-estate',
    totalSupply: '',
    assetDescription: '',
    assetValuation: '',
    valuationDate: '',
    custodianName: '',
    issuerLegalName: '',
    issuerRegistrationNumber: '',
  });
  const [documents, setDocuments] = useState<UploadDocuments>({
    legalDocument: null,
    valuationReport: null,
    custodyProof: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const pendingTokens = useMemo(() => tokens.filter((token) => token.status === 'pending'), [tokens]);
  const approvedTokens = useMemo(() => tokens.filter((token) => token.status === 'approved' || token.status === 'active'), [tokens]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    let parsedUser: StoredUser;
    try {
      parsedUser = JSON.parse(userData) as StoredUser;
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/auth/login');
      return;
    }

    if (parsedUser.role !== 'issuer' && parsedUser.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const normalizedUser: DashboardUser = {
      id: parsedUser.id,
      role: parsedUser.role,
      fullName: parsedUser.fullName ?? parsedUser.full_name ?? 'Issuer',
    };

    setUser(normalizedUser);
    fetchDashboardData(token);
  }, [router]);

  const fetchDashboardData = async (token: string) => {
    try {
      setLoading(true);

      const compliancePromise = fetch('/api/compliance/kyc', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const tokensPromise = fetch('/api/tokens/issue', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const [kycRes, tokensRes] = await Promise.all([compliancePromise, tokensPromise]);

      if (kycRes.ok) {
        const kycPayload = await kycRes.json();
        const submission = kycPayload && typeof kycPayload.submission === 'object' && kycPayload.submission !== null
          ? kycPayload.submission as Record<string, unknown>
          : null;
        const status = (kycPayload.kycStatus as KycInfo['status']) ?? 'pending';
        setKycInfo({
          status,
          lastUpdated: kycPayload.lastUpdated ?? null,
          submission,
        });
      } else {
        setKycInfo(null);
      }

      const tokensData: TokensResponse = await tokensRes.json();
      if (tokensRes.ok && tokensData.success) {
        setTokens(tokensData.tokens);
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, field: keyof UploadDocuments) => {
    if (event.target.files && event.target.files[0]) {
      setDocuments((current) => ({ ...current, [field]: event.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const formDataToSend = new FormData();
      
      // Add all form fields
      (Object.entries(formData) as [keyof IssuanceFormState, string][]).forEach(([key, value]) => {
        formDataToSend.append(key, value ?? '');
      });

      // Add documents
      if (documents.legalDocument) {
        formDataToSend.append('legalDocument', documents.legalDocument);
      }
      if (documents.valuationReport) {
        formDataToSend.append('valuationReport', documents.valuationReport);
      }
      if (documents.custodyProof) {
        formDataToSend.append('custodyProof', documents.custodyProof);
      }

      const response = await fetch('/api/tokens/issue', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        const message = typeof data?.error === 'string' ? data.error : 'Failed to submit token issuance';
        throw new Error(message);
      }

      alert('Token issuance request submitted successfully! Awaiting admin approval.');
      setShowForm(false);
      fetchDashboardData(token);
      
      // Reset form
      setFormData({
        tokenName: '',
        tokenSymbol: '',
        assetType: 'real-estate',
        totalSupply: '',
        assetDescription: '',
        assetValuation: '',
        valuationDate: '',
        custodianName: '',
        issuerLegalName: '',
        issuerRegistrationNumber: '',
      });
      setDocuments({
        legalDocument: null,
        valuationReport: null,
        custodyProof: null,
      });
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : 'Failed to submit token issuance';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-color)] mx-auto"></div>
          <p className="mt-4 text-sm text-[var(--neutral-500)]">Loading issuer dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <nav className="bg-white/80 border-b border-[var(--neutral-200)] backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/">
                <h1 className="text-2xl font-semibold text-[var(--primary-color)]">TokenPlatform</h1>
              </Link>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">ISSUER</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-[var(--neutral-500)]">
              <Link
                href="/issuer/valuations"
                className="px-4 py-2 text-sm text-[var(--neutral-600)] border border-[var(--neutral-200)] rounded-lg transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
              >
                Valuations
              </Link>
              <Link
                href="/issuer/templates"
                className="px-4 py-2 text-sm text-[var(--neutral-600)] border border-[var(--neutral-200)] rounded-lg transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
              >
                Templates
              </Link>
              <Link
                href="/support/grievance"
                className="px-4 py-2 text-sm text-[var(--neutral-600)] border border-[var(--neutral-200)] rounded-lg transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
              >
                Support
              </Link>
              <span>{user?.fullName}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-[var(--neutral-600)] border border-[var(--neutral-200)] rounded-lg transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="flex items-center justify-between">
          <SectionHeading
            eyebrow="Issuer cockpit"
            title="Submit assets, track approvals, and deploy with confidence"
            description="Document hashing, compliance guidance, and blockchain visibility ensure a transparent issuance experience."
          />
          <Link
            href="/issuer/assets/create"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-sm flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Asset
          </Link>
        </div>

        {kycInfo && (
          <Card padding="lg" className="border border-[var(--neutral-200)] bg-white/95">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--neutral-500)]">Compliance status</p>
                <p className={`mt-2 text-2xl font-semibold capitalize ${kycInfo.status === 'approved' ? 'text-emerald-600' : kycInfo.status === 'rejected' ? 'text-rose-600' : 'text-amber-600'}`}>
                  {kycInfo.status}
                </p>
                <p className="text-xs text-[var(--neutral-500)]">Last updated {kycInfo.lastUpdated ? new Date(kycInfo.lastUpdated).toLocaleString() : '—'}</p>
              </div>
              <div className="rounded-xl border border-[var(--neutral-200)] bg-[var(--neutral-100)]/60 p-4 text-sm text-[var(--neutral-600)] max-w-lg">
                <p className="font-semibold text-[var(--neutral-700)]">Latest submission snapshot</p>
                {kycInfo.submission ? (
                  <ul className="mt-2 space-y-1">
                    {Object.entries(kycInfo.submission).slice(0, 4).map(([key, value]) => (
                      <li key={key} className="flex justify-between gap-4 text-xs">
                        <span className="font-medium text-[var(--neutral-500)]">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</span>
                        <span className="text-right text-[var(--neutral-700)]">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                      </li>
                    ))}
                    {Object.keys(kycInfo.submission).length > 4 && (
                      <li className="text-xs text-[var(--neutral-400)]">Additional fields captured…</li>
                    )}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-[var(--neutral-500)]">Upload documents to accelerate approval.</p>
                )}
                {kycInfo.status !== 'approved' && (
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <Link href="/docs/kyc-guidelines" className="rounded-lg bg-[var(--primary-surface)] px-3 py-1 text-[var(--primary-color)] hover:bg-[var(--primary-surface-hover)]">
                      View guidelines
                    </Link>
                    <Link href="mailto:compliance@tokenplatform.test" className="rounded-lg border border-[var(--neutral-200)] px-3 py-1 text-[var(--neutral-600)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]">
                      Contact compliance
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <Card padding="lg" className="border border-[var(--neutral-200)] bg-white/90">
            <p className="text-xs uppercase tracking-wide text-[var(--neutral-500)]">Total submissions</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{tokens.length}</p>
            <p className="text-xs text-[var(--neutral-500)]">Approved: {approvedTokens.length}</p>
          </Card>
          <Card padding="lg" className="border border-[var(--neutral-200)] bg-white/90">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-[var(--neutral-500)]">Awaiting review</p>
              <Tooltip label="Admin is reviewing documents and metadata hashes">
                <svg className="h-4 w-4 text-[var(--neutral-400)]" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 3.5 3.5 7v6l6.5 3.5 6.5-3.5V7L10 3.5Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 10.5V7m0 3.5 2 2" />
                </svg>
              </Tooltip>
            </div>
            <p className="mt-2 text-3xl font-semibold text-amber-600">{pendingTokens.length}</p>
            <p className="text-xs text-[var(--neutral-500)]">We will notify you once approval is complete.</p>
          </Card>
          <Card padding="lg" className="border border-[var(--neutral-200)] bg-white/90">
            <p className="text-xs uppercase tracking-wide text-[var(--neutral-500)]">Need help?</p>
            <p className="mt-2 text-sm text-[var(--neutral-500)]">Download sample templates and follow the compliance checklist before submitting.</p>
            <div className="mt-3 flex gap-2 text-xs font-semibold">
              <Link href="/docs" className="text-[var(--primary-color)] hover:text-[var(--primary-color-hover)]">Templates →</Link>
              <Link href="mailto:support@tokenplatform.test" className="text-[var(--neutral-500)] hover:text-[var(--primary-color)]">Contact support →</Link>
            </div>
          </Card>
        </div>

        <div className="flex justify-between items-center">
          <SectionHeading
            eyebrow="Issuance timeline"
            title="End-to-end status tracking"
            description="Each submission moves through review, approval, and deployment with on-chain evidence."
          />
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-[var(--primary-color)] text-white rounded-lg hover:bg-[var(--primary-color-hover)] transition-colors"
          >
            {showForm ? 'Cancel issuance' : '+ New Token Issuance'}
          </button>
        </div>

        {/* Token Issuance Form */}
        {showForm && (
          <Card padding="lg" className="border border-[var(--neutral-200)] bg-white/95">
            <h3 className="text-2xl font-semibold text-[var(--foreground)] mb-6">Token Issuance Request</h3>
            
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Token Information */}
              <div className="border-b border-[var(--neutral-200)] pb-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-[var(--foreground)]">Token Information</h4>
                  <Tooltip label="Provide clarity for investors and regulators. Symbols should be 3-10 uppercase characters.">
                    <svg className="h-5 w-5 text-[var(--neutral-400)]" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 3.5 3.5 7v6l6.5 3.5 6.5-3.5V7L10 3.5Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 10.5V7m0 3.5 2 2" />
                    </svg>
                  </Tooltip>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Token Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.tokenName}
                      onChange={(e) => setFormData({ ...formData, tokenName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                      placeholder="e.g., Mumbai Office Tower Token"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Token Symbol * (3-10 uppercase letters)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.tokenSymbol}
                      onChange={(e) => setFormData({ ...formData, tokenSymbol: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                      placeholder="e.g., MBOFF"
                      pattern="[A-Z0-9]{3,10}"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--neutral-600)] mb-1 flex items-center gap-2">
                      Asset Type *
                      <Tooltip label="Select the primary classification aligned with regulatory filings">
                        <span className="text-[var(--neutral-400)]">ℹ︎</span>
                      </Tooltip>
                    </label>
                    <select
                      value={formData.assetType}
                      onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                    >
                      <option value="real-estate">Real Estate</option>
                      <option value="gold">Gold</option>
                      <option value="bonds">Bonds</option>
                      <option value="equity">Equity</option>
                      <option value="commodities">Commodities</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Supply *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.totalSupply}
                      onChange={(e) => setFormData({ ...formData, totalSupply: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                      placeholder="e.g., 1000000"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Asset Details */}
              <div className="border-b border-[var(--neutral-200)] pb-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-[var(--foreground)]">Asset Details</h4>
                  <Tooltip label="Valuation data should align with submitted reports (PDF/Doc).">
                    <span className="text-[var(--neutral-400)]">ℹ︎</span>
                  </Tooltip>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asset Description
                    </label>
                    <textarea
                      value={formData.assetDescription}
                      onChange={(e) => setFormData({ ...formData, assetDescription: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                      rows={4}
                      placeholder="Describe the underlying asset..."
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Asset Valuation (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.assetValuation}
                        onChange={(e) => setFormData({ ...formData, assetValuation: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                        placeholder="e.g., 50000000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valuation Date
                      </label>
                      <input
                        type="date"
                        value={formData.valuationDate}
                        onChange={(e) => setFormData({ ...formData, valuationDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custodian Name
                    </label>
                    <input
                      type="text"
                      value={formData.custodianName}
                      onChange={(e) => setFormData({ ...formData, custodianName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                      placeholder="e.g., HDFC Bank Custody Services"
                    />
                  </div>
                </div>
              </div>

              {/* Issuer Information */}
              <div className="border-b border-[var(--neutral-200)] pb-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-[var(--foreground)]">Issuer Information</h4>
                  <Tooltip label="Legal entity names should match corporate filings to ensure compliance">
                    <span className="text-[var(--neutral-400)]">ℹ︎</span>
                  </Tooltip>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Legal Entity Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.issuerLegalName}
                      onChange={(e) => setFormData({ ...formData, issuerLegalName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                      placeholder="e.g., ABC Properties Pvt Ltd"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registration Number (CIN/LLPIN)
                    </label>
                    <input
                      type="text"
                      value={formData.issuerRegistrationNumber}
                      onChange={(e) => setFormData({ ...formData, issuerRegistrationNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                      placeholder="e.g., U12345MH2020PTC123456"
                    />
                  </div>
                </div>
              </div>

              {/* Document Upload */}
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-[var(--foreground)]">Supporting Documents</h4>
                  <Tooltip label="Hashes are derived automatically. Upload clean, signed PDFs for faster approvals.">
                    <span className="text-[var(--neutral-400)]">ℹ︎</span>
                  </Tooltip>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Legal Documentation (PDF)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(e, 'legalDocument')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      SHA-256 hash will be computed and anchored on blockchain
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valuation Report (PDF)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(e, 'valuationReport')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custody Proof (PDF)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.png"
                      onChange={(e) => handleFileChange(e, 'custodyProof')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-[#0B67FF] text-white rounded-lg hover:bg-[#2D9CDB] transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Token Issuance Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        )}
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Submission history"
            title="My token issuances"
            description="Track each asset from submission to on-chain deployment."
          />
          {tokens.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {tokens.map((token) => (
                <Card key={token.id} padding="lg" className="border border-[var(--neutral-200)] bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-[var(--foreground)]">{token.token_name}</h4>
                      <p className="text-sm text-[var(--neutral-500)]">{token.token_symbol}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded ${
                      token.status === 'active' ? 'bg-green-100 text-green-800' :
                      token.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      token.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {token.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-[var(--neutral-600)]">
                    <p><span className="font-semibold">Asset Type:</span> {token.asset_type}</p>
                    <p><span className="font-semibold">Total Supply:</span> {token.total_supply.toLocaleString()}</p>
                    <p><span className="font-semibold">Created:</span> {new Date(token.created_at).toLocaleDateString()}</p>
                    {token.contract_address && (
                      <p className="text-xs">
                        <span className="font-semibold">Contract:</span>{' '}
                        <a
                          href={`https://amoy.polygonscan.com/address/${token.contract_address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--primary-color)] hover:text-[var(--primary-color-hover)]"
                        >
                          View on Explorer ↗
                        </a>
                      </p>
                    )}
                  </div>
                  <div className="mt-4 text-xs text-[var(--neutral-500)]">
                    <p><strong>Next milestone:</strong> {token.status === 'pending' ? 'Awaiting admin approval' : token.status === 'approved' ? 'Deployment in process' : token.status === 'active' ? 'Token live on-chain' : 'Review feedback available'}</p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card padding="lg" className="border border-[var(--neutral-200)] bg-white text-center">
              <p className="text-[var(--neutral-500)]">No token issuances yet.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-[var(--primary-color)] hover:text-[var(--primary-color-hover)] text-sm font-semibold"
              >
                Create your first token →
              </button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
