/**
 * Document Templates Page for Issuers
 * Provides downloadable templates for token issuance documentation
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Icon component for templates
const TemplateIcon = ({ name }: { name: string }) => {
  const icons: Record<string, React.ReactElement> = {
    chart: <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9l-5 5-5-5v8"/></svg>,
    scale: <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18M3 9l9-6 9 6M3 9l9 6 9-6M3 9v6l9 6 9-6V9"/></svg>,
    document: <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>,
    check: <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
    currency: <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    building: <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M9 8h1m-1 4h1m-1 4h1M15 8h1m-1 4h1m-1 4h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/></svg>,
    alert: <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>,
    coin: <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M15 9H9.5a2.5 2.5 0 000 5H15"/></svg>,
    file: <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M13 2v7h7"/></svg>,
    clipboard: <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
    lock: <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
    pen: <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  };
  return <div className="text-[var(--primary-color)]">{icons[name] || icons.file}</div>;
};

type Template = {
  id: string;
  name: string;
  description: string;
  category: string;
  required: boolean;
  format: string;
  icon: string;
};

const templates: Template[] = [
  {
    id: 'asset-valuation',
    name: 'Asset Valuation Report',
    description: 'Comprehensive valuation report by certified valuers. Includes methodology, assumptions, and fair market value assessment.',
    category: 'Financial',
    required: true,
    format: 'PDF/DOCX',
    icon: 'chart',
  },
  {
    id: 'legal-opinion',
    name: 'Legal Opinion Letter',
    description: 'Legal counsel opinion on asset ownership, title clarity, and regulatory compliance. Must be from registered law firm.',
    category: 'Legal',
    required: true,
    format: 'PDF',
    icon: 'scale',
  },
  {
    id: 'ownership-proof',
    name: 'Ownership Proof Documents',
    description: 'Title deeds, sale agreements, or other documents proving legal ownership of the underlying asset.',
    category: 'Legal',
    required: true,
    format: 'PDF',
    icon: 'document',
  },
  {
    id: 'compliance-certificate',
    name: 'Compliance Certificate',
    description: 'Certificate confirming compliance with applicable regulations (SEBI, RBI, IFSCA). Issued by compliance officer.',
    category: 'Compliance',
    required: true,
    format: 'PDF',
    icon: 'check',
  },
  {
    id: 'financial-statements',
    name: 'Financial Statements',
    description: 'Audited financial statements for the last 3 years. Required for equity and debt tokenization.',
    category: 'Financial',
    required: true,
    format: 'PDF/XLSX',
    icon: 'currency',
  },
  {
    id: 'kyc-documents',
    name: 'Issuer KYC Documents',
    description: 'Corporate KYC including Certificate of Incorporation, PAN, GST, Director IDs, and Board Resolution.',
    category: 'KYC',
    required: true,
    format: 'PDF',
    icon: 'building',
  },
  {
    id: 'risk-disclosure',
    name: 'Risk Disclosure Statement',
    description: 'Detailed disclosure of all material risks associated with the tokenized asset. Must be investor-friendly.',
    category: 'Compliance',
    required: true,
    format: 'PDF/DOCX',
    icon: 'alert',
  },
  {
    id: 'token-economics',
    name: 'Token Economics Document',
    description: 'Tokenomics including supply, distribution, vesting schedules, utility, and governance rights.',
    category: 'Technical',
    required: true,
    format: 'PDF/DOCX',
    icon: 'coin',
  },
  {
    id: 'whitepaper',
    name: 'Whitepaper Template',
    description: 'Comprehensive whitepaper template covering project overview, technology, team, roadmap, and use of proceeds.',
    category: 'Technical',
    required: false,
    format: 'PDF/DOCX',
    icon: 'file',
  },
  {
    id: 'due-diligence',
    name: 'Due Diligence Checklist',
    description: 'Complete checklist for internal due diligence before token issuance. Covers legal, financial, and technical aspects.',
    category: 'Compliance',
    required: false,
    format: 'XLSX',
    icon: 'clipboard',
  },
  {
    id: 'smart-contract-audit',
    name: 'Smart Contract Audit Report',
    description: 'Security audit report from certified blockchain auditors. Identifies vulnerabilities and recommendations.',
    category: 'Technical',
    required: false,
    format: 'PDF',
    icon: 'lock',
  },
  {
    id: 'investor-agreement',
    name: 'Investor Agreement Template',
    description: 'Standard agreement between issuer and token holders. Includes terms, conditions, and dispute resolution.',
    category: 'Legal',
    required: false,
    format: 'PDF/DOCX',
    icon: 'pen',
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'issuer' && parsedUser.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
  }, [router]);

  const handleDownload = (template: Template) => {
    // In production, this would download actual template files
    alert(`Downloading ${template.name}...\n\nIn production, this would download a ${template.format} template file.`);
  };

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];
  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--primary-color)]" />
          <p className="mt-4 text-sm text-[var(--muted-text)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <nav className="border-b border-[var(--border-subtle)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/issuer/dashboard">
              <h1 className="text-xl font-semibold text-[var(--primary-color)]">TokenPlatform</h1>
            </Link>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              Templates
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-[var(--neutral-500)]">
            <Link href="/issuer/dashboard" className="hover:text-[var(--primary-color)]">
              Dashboard
            </Link>
            <span>{user.fullName || user.full_name}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-[var(--neutral-200)] px-3 py-1.5 text-[var(--neutral-600)] transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--heading-color)]">Document Templates</h1>
          <p className="mt-2 text-[var(--subtle-text)]">
            Download standardized templates for token issuance documentation. All templates are compliant with IFSCA/RBI guidelines.
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-3">
            <svg className="h-5 w-5 flex-shrink-0 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-900">
              <p className="font-semibold">Important Notes</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>All <strong>required documents</strong> must be submitted for token approval</li>
                <li>Documents must be signed by authorized signatories</li>
                <li>Financial documents must be audited by certified auditors</li>
                <li>Legal opinions must be from registered law firms</li>
                <li>Templates are for sandbox testing - production versions may differ</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedCategory === category
                  ? 'bg-[var(--primary-color)] text-white'
                  : 'bg-white border border-[var(--border-subtle)] text-[var(--subtle-text)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]'
              }`}
            >
              {category === 'all' ? 'All Templates' : category}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="card-surface p-6 transition hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <TemplateIcon name={template.icon} />
                  <div>
                    <h3 className="font-semibold text-[var(--heading-color)]">{template.name}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {template.category}
                      </span>
                      {template.required && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                          Required
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm text-[var(--subtle-text)]">
                {template.description}
              </p>

              <div className="mt-4 flex items-center justify-between text-xs text-[var(--muted-text)]">
                <span>Format: {template.format}</span>
              </div>

              <button
                onClick={() => handleDownload(template)}
                className="mt-4 w-full rounded-lg bg-[var(--primary-color)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-color-hover)]"
              >
                Download Template
              </button>
            </div>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-12 rounded-2xl border border-[var(--border-subtle)] bg-white p-8">
          <h2 className="text-2xl font-semibold text-[var(--heading-color)]">Need Help?</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="font-semibold text-[var(--heading-color)]">Documentation</h3>
              <p className="mt-2 text-sm text-[var(--subtle-text)]">
                Detailed guides on filling each template
              </p>
              <Link
                href="/docs/issuer-guide"
                className="mt-3 inline-block text-sm font-medium text-[var(--primary-color)] hover:underline"
              >
                View Documentation →
              </Link>
            </div>

            <div>
              <h3 className="font-semibold text-[var(--heading-color)]">Support</h3>
              <p className="mt-2 text-sm text-[var(--subtle-text)]">
                Get help from our compliance team
              </p>
              <Link
                href="/support/grievance"
                className="mt-3 inline-block text-sm font-medium text-[var(--primary-color)] hover:underline"
              >
                Contact Support →
              </Link>
            </div>

            <div>
              <h3 className="font-semibold text-[var(--heading-color)]">Email</h3>
              <p className="mt-2 text-sm text-[var(--subtle-text)]">
                issuer-support@tokenplatform.test
              </p>
              <p className="mt-1 text-sm text-[var(--subtle-text)]">
                compliance@tokenplatform.test
              </p>
            </div>
          </div>
        </div>

        {/* Submission Process */}
        <div className="mt-12 rounded-2xl border-2 border-blue-200 bg-blue-50 p-8">
          <h2 className="text-2xl font-semibold text-blue-900">Token Issuance Process</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                1
              </div>
              <h3 className="mt-3 font-semibold text-blue-900">Download Templates</h3>
              <p className="mt-2 text-sm text-blue-700">
                Get all required document templates
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                2
              </div>
              <h3 className="mt-3 font-semibold text-blue-900">Fill & Sign</h3>
              <p className="mt-2 text-sm text-blue-700">
                Complete all documents with accurate information
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                3
              </div>
              <h3 className="mt-3 font-semibold text-blue-900">Submit for Review</h3>
              <p className="mt-2 text-sm text-blue-700">
                Upload documents via issuer dashboard
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                4
              </div>
              <h3 className="mt-3 font-semibold text-blue-900">Get Approved</h3>
              <p className="mt-2 text-sm text-blue-700">
                Admin reviews and deploys smart contract
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/issuer/dashboard"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Go to Issuer Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
