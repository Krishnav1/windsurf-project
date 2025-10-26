"use client";

/**
 * Landing Page - Tokenization Platform
 * 
 * Main entry point showcasing platform features and value proposition
 * Light theme: Blue (#0B67FF) and White (#FFFFFF)
 */

import Link from "next/link";
import { useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { Tooltip } from "@/components/ui/Tooltip";

const heroHighlights = [
  { label: "Launch sandbox-ready issuances in minutes" },
  { label: "Monitor compliance, trades, and settlements in real time" },
  { label: "Deliver transparent returns with blockchain proof" },
  { label: "Collaborate with regulators and auditors from day one" },
];

const metrics = [
  {
    label: "Platform Status",
    value: "Live",
    description: "Prototype testing environment",
  },
  {
    label: "Blockchain Network",
    value: "Polygon",
    description: "Amoy testnet deployment",
  },
  {
    label: "Compliance",
    value: "IFSCA",
    description: "Sandbox framework compliant",
  },
];

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Real Estate Investor",
    quote: "Fractional ownership made simple. I can now invest in premium properties with just ₹10,000."
  },
  {
    name: "Priya Sharma",
    role: "First-time Investor",
    quote: "The platform is transparent and easy to use. I love seeing my investments grow in real-time."
  },
  {
    name: "Amit Patel",
    role: "Portfolio Manager",
    quote: "Finally, a compliant tokenization platform for Indian markets. The IFSCA sandbox approval gives confidence."
  }
];

const trustBadges = [
  {
    title: "IFSCA Sandbox",
    description: "Operating under regulator oversight in GIFT City",
  },
  {
    title: "Polygon Amoy",
    description: "Secure, low-fee settlement rails with public proofs",
  },
  {
    title: "Audit ready",
    description: "Immutable logs and exportable evidence bundles",
  },
];

const trustLogos = [
  { name: "IFSCA", detail: "Regulatory sandbox participation" },
  { name: "Polygon", detail: "Token contracts on Amoy test network" },
  { name: "Cert-In Advisors", detail: "Security assessments and playbooks" },
  { name: "Alchemy", detail: "High-uptime blockchain infrastructure" },
];

const features = [
  {
    title: "Blockchain Verified",
    description: "Every transaction recorded on Polygon blockchain with immutable proof",
  },
  {
    title: "Regulatory Compliant",
    description: "Built following IFSCA sandbox guidelines for tokenized securities",
  },
  {
    title: "Secure & Transparent",
    description: "End-to-end encryption with complete audit trail for all operations",
  },
];

const featureCards = [
  { title: "Curated deals", description: "Screened issuances with sandbox-ready dossiers." },
  { title: "Blockchain transparency", description: "Every workflow anchored with verifiable proofs." },
  { title: "Secondary liquidity", description: "Peer-to-peer matching for compliant transfers." },
  { title: "Guided compliance", description: "Role-based checklists keep teams audit ready." },
  { title: "Live analytics", description: "Portfolio telemetry spans assets, trades, SLAs." },
  { title: "Extensible APIs", description: "Plug in custody, payments, and reporting stacks." },
];

const journeySteps = {
  investor: [
    {
      title: "Create investor profile",
      detail: "Complete sandbox KYC with guided document uploads.",
    },
    {
      title: "Review curated assets",
      detail: "Compare tokenized offerings with transparent metrics.",
    },
    {
      title: "Execute trades",
      detail: "Place simulated or live orders with instant settlement updates.",
    },
    {
      title: "Track performance",
      detail: "Monitor holdings, income, and blockchain proofs in one console.",
    },
  ],
  issuer: [
    {
      title: "Submit issuance dossier",
      detail: "Upload valuations, custody proof, and compliance attestations.",
    },
    {
      title: "Collaborate with admins",
      detail: "Respond to review notes and finalize metadata hashes.",
    },
    {
      title: "Deploy token contract",
      detail: "Trigger automated deployment to Polygon Amoy with receipts.",
    },
    {
      title: "Manage lifecycle",
      detail: "Freeze, mint, and settle with full audit trail visibility.",
    },
  ],
};

const roleCtas = [
  {
    title: "Start as investor",
    description: "Experience compliant trading with demo settlement rails.",
    href: "/dashboard",
    label: "Book investor demo",
  },
  {
    title: "Launch as issuer",
    description: "Tokenize your asset with regulator-aligned workflows.",
    href: "/issuer/dashboard",
    label: "Request issuer onboarding",
  },
  {
    title: "Oversee as admin",
    description: "Unify approvals, monitoring, and audit evidence.",
    href: "/admin/dashboard",
    label: "Explore admin console",
  },
];

const faqItems = [
  {
    question: "How does TokenPlatform fit within regulatory sandboxes?",
    answer: "We operate under IFSCA's sandbox with localization for Indian issuers, providing templated documentation and regulator access.",
  },
  {
    question: "Can we simulate real settlement flows?",
    answer: "Yes. The platform supports mock CBDC and UPI rails alongside demo balances so teams can rehearse production flows.",
  },
  {
    question: "What investor protections are in place?",
    answer: "Transfer restrictions, whitelist enforcement, and pause controls are built into the token contracts for safe market operations.",
  },
  {
    question: "Can we export compliance evidence?",
    answer: "Admins can download hashed document bundles, audit logs, and transaction receipts for regulatory submissions.",
  },
];

function JourneyTabs() {
  "use client";

  const [activeTab, setActiveTab] = useState<"investor" | "issuer">("investor");

  return (
    <div className="space-y-8">
      <div className="inline-flex rounded-full border border-[var(--neutral-200)] bg-white/80 p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("investor")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
            activeTab === "investor"
              ? "bg-[var(--primary-color)] text-white shadow"
              : "text-[var(--neutral-500)] hover:text-[var(--primary-color)]"
          }`}
        >
          Investors
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("issuer")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
            activeTab === "issuer"
              ? "bg-[var(--primary-color)] text-white shadow"
              : "text-[var(--neutral-500)] hover:text-[var(--primary-color)]"
          }`}
        >
          Issuers
        </button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {journeySteps[activeTab].map((step, index) => (
          <Card key={step.title} padding="lg" className="relative border border-[var(--neutral-200)] bg-white/90">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-surface)] text-base font-semibold text-[var(--primary-color)]">
                {index + 1}
              </span>
              <div>
                <h4 className="text-lg font-semibold text-[var(--foreground)]">{step.title}</h4>
                <p className="mt-2 text-sm text-[var(--neutral-500)]">{step.detail}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        {activeTab === "investor" ? (
          <Link
            href="/dashboard"
            className="rounded-lg bg-[var(--primary-color)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--primary-color-hover)]"
          >
            Create investor account
          </Link>
        ) : (
          <Link
            href="/issuer/dashboard"
            className="rounded-lg bg-[var(--primary-color)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--primary-color-hover)]"
          >
            Begin issuer onboarding
          </Link>
        )}
        <Link
          href="/docs"
          className="rounded-lg border border-[var(--neutral-200)] px-6 py-3 text-sm font-semibold text-[var(--neutral-600)] transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
        >
          View sandbox playbook
        </Link>
      </div>
    </div>
  );
}

type CallToActionProps = {
  title: string;
  description: string;
  href: string;
  label: string;
};

function CallToAction({ title, description, href, label }: CallToActionProps) {
  return (
    <Card padding="lg" className="flex flex-col justify-between gap-6 border border-[var(--neutral-200)] bg-white/90 p-8">
      <div className="space-y-2">
        <h3 className="text-2xl font-semibold text-[var(--foreground)]">{title}</h3>
        <p className="text-sm text-[var(--neutral-500)]">{description}</p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary-color)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--primary-color-hover)]"
      >
        {label}
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3h8m0 0v8m0-8L4 12" />
        </svg>
      </Link>
    </Card>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Sandbox Warning Banner */}
      <div className="border-b-2 border-amber-300 bg-amber-50 py-2">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 text-sm">
            <svg className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold text-amber-900">
              SANDBOX TESTING ENVIRONMENT - No Real Money or Investments
            </span>
            <Link href="/legal/sandbox-declaration" className="text-amber-700 underline hover:text-amber-900">
              Learn More
            </Link>
          </div>
        </div>
      </div>

      <main className="space-y-24 pb-24 pt-16">
        <section className="mx-auto w-full max-w-7xl px-4">
          <div className="grid items-center gap-10 rounded-[32px] border border-[var(--neutral-200)] bg-white p-10 shadow-lg lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-surface)] px-4 py-2 text-xs font-semibold text-[var(--primary-color)]">
                <span>Prototype launch</span>
                <span className="h-1 w-1 rounded-full bg-[var(--primary-color)]" />
                <span>Polygon Amoy</span>
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-[#0A1628] sm:text-5xl">
                Tokenize regulated assets with confidence
              </h2>
              <p className="text-lg text-[#475569] leading-relaxed">
                TokenPlatform brings issuers, investors, and administrators together in a sandbox-compliant environment regulated by IFSCA.
              </p>
              <ul className="grid gap-4 sm:grid-cols-2">
                {heroHighlights.map((item) => (
                  <li key={item.label} className="flex items-start gap-3 rounded-2xl border border-[var(--neutral-200)] bg-white p-4">
                    <svg className="h-5 w-5 flex-shrink-0 text-[var(--primary-color)] mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-semibold text-[#0A1628]">{item.label}</p>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/register"
                  className="rounded-lg bg-[var(--primary-color)] px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_-20px_rgba(11,103,255,0.6)] transition hover:bg-[var(--primary-color-hover)]"
                >
                  Book a sandbox walkthrough
                </Link>
                <Link
                  href="/explorer"
                  className="rounded-lg border border-[var(--neutral-200)] px-6 py-3 text-sm font-semibold text-[var(--neutral-600)] transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
                >
                  Watch 2-minute product demo
                </Link>
              </div>
            </div>
            <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top,_rgba(11,103,255,0.12),_transparent_70%)] p-8">
              <div className="absolute inset-0 bg-[var(--primary-surface)]/30 backdrop-blur-sm" />
              <div className="relative flex h-full flex-col justify-between gap-6">
                <div className="space-y-3 rounded-2xl bg-white p-5 shadow-lg border border-[var(--neutral-200)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#64748b]">Live compliance pulse</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-sm text-[#64748b]">Tokens active</p>
                      <p className="text-2xl font-bold text-[#0A1628]">18</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#64748b]">KYC approved</p>
                      <p className="text-2xl font-bold text-[#0A1628]">312</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#64748b]">Audit logs</p>
                      <p className="text-2xl font-bold text-[#0A1628]">4.6k</p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 rounded-2xl border border-[var(--neutral-200)] bg-white p-5 shadow-lg">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#64748b]">Settlement snapshot</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#64748b]">CBDC channel</p>
                      <p className="text-lg font-bold text-[var(--primary-color)]">₹28,40,000</p>
                    </div>
                    <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">Instant</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#64748b]">UPI rail</p>
                      <p className="text-lg font-bold text-[#0A1628]">₹6,75,000</p>
                    </div>
                    <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Cleared</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3 rounded-full border border-[var(--neutral-200)] bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--neutral-500)] shadow-sm">
            <span>Regulated under IFSCA Sandbox</span>
            <span className="hidden h-1 w-1 rounded-full bg-[var(--neutral-300)] sm:block" />
            <span>Audited security controls</span>
            <span className="hidden h-1 w-1 rounded-full bg-[var(--neutral-300)] lg:block" />
            <span>Transparent blockchain proofs</span>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4">
          <div className="grid gap-6 rounded-3xl border border-[var(--neutral-200)] bg-white p-6 shadow-sm sm:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="space-y-2 text-center sm:text-left">
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--neutral-500)]">{metric.label}</p>
                <p className="text-3xl font-semibold text-[var(--foreground)]">{metric.value}</p>
                <p className="text-xs text-[var(--neutral-500)]">{metric.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4">
          <SectionHeading
            eyebrow="Trusted by innovators"
            title="Built with regulators, advisors, and institutions"
            description="TokenPlatform combines governance rigor with investor-grade experiences."
            align="center"
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {trustBadges.map((badge) => (
                  <Card key={badge.title} padding="lg" className="border border-[var(--neutral-200)] bg-white">
                    <h3 className="text-base font-semibold text-[var(--foreground)]">{badge.title}</h3>
                    <p className="mt-2 text-sm text-[var(--neutral-500)]">{badge.description}</p>
                  </Card>
                ))}
              </div>
              <div className="rounded-3xl border border-[var(--neutral-200)] bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--neutral-500)]">Regulatory & infrastructure partners</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {trustLogos.map((logo) => (
                    <div key={logo.name} className="rounded-2xl border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4 text-center">
                      <p className="text-sm font-semibold text-[var(--foreground)]">{logo.name}</p>
                      <p className="mt-2 text-xs text-[var(--neutral-600)]">{logo.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl border border-[var(--neutral-200)] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[var(--foreground)]">What partners say</h3>
                <Tooltip label="Testimonials from sandbox participants">
                  <svg className="h-5 w-5 text-[var(--neutral-300)]" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 3.5 3.5 7v6l6.5 3.5 6.5-3.5V7L10 3.5Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 10.5V7m0 3.5 2 2" />
                  </svg>
                </Tooltip>
              </div>
              <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
                {testimonials.map((testimonial) => (
                  <Card key={testimonial.name} padding="lg" className="min-w-[260px] flex-1 border border-[var(--neutral-200)] bg-[var(--neutral-50)]">
                    <p className="text-sm text-[var(--neutral-700)]">“{testimonial.quote}”</p>
                    <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">{testimonial.name}</p>
                    <p className="text-xs text-[var(--neutral-500)]">{testimonial.role}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4">
          <SectionHeading
            eyebrow="Platform capabilities"
            title="Everything you need to prove trust from day one"
            description="Each feature is crafted to balance compliance, experience, and speed."
            align="center"
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature, index) => {
              const icons = [
                <svg className="h-8 w-8 text-[var(--primary-color)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
                <svg className="h-8 w-8 text-[var(--primary-color)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>,
                <svg className="h-8 w-8 text-[var(--primary-color)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
                <svg className="h-8 w-8 text-[var(--primary-color)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
                <svg className="h-8 w-8 text-[var(--primary-color)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9l-5 5-5-5v8"/></svg>,
                <svg className="h-8 w-8 text-[var(--primary-color)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"/></svg>
              ];
              return (
                <Card key={feature.title} padding="lg" className="border border-[var(--neutral-200)] bg-white transition hover:-translate-y-1 hover:border-[var(--primary-color)] hover:shadow-lg">
                  <div className="mb-4">{icons[index]}</div>
                  <h3 className="text-lg font-semibold text-[#0A1628]">{feature.title}</h3>
                  <p className="mt-2 text-sm text-[#475569]">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4">
          <SectionHeading
            eyebrow="How TokenPlatform works"
            title="Role-based journeys designed for clarity"
            description="Follow guided steps built for sandbox pilots and production rollouts."
            align="center"
          />
          <div className="mt-12 rounded-3xl border border-[var(--neutral-200)] bg-white p-10 shadow-sm">
            <JourneyTabs />
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4">
          <div className="grid gap-8 rounded-[32px] border border-[var(--neutral-200)] bg-white p-10 shadow-sm lg:grid-cols-[1fr_0.9fr]">
            <div className="space-y-5">
              <SectionHeading
                eyebrow="See it in motion"
                title="Walk through the platform in under three minutes"
                description="Preview the investor console, issuer workflow, and admin oversight experience before you onboard."
              />
              <div className="flex flex-wrap gap-3">
                <Link
                  href="https://tokenplatform.test/demo"
                  className="rounded-lg bg-[var(--primary-color)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--primary-color-hover)]"
                >
                  Play full demo video
                </Link>
                <Link
                  href="/docs"
                  className="rounded-lg border border-[var(--neutral-200)] px-6 py-3 text-sm font-semibold text-[var(--neutral-600)] transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
                >
                  Download product brief
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4 text-sm text-[var(--neutral-600)]">
                  <p className="font-semibold text-[var(--foreground)]">Investors</p>
                  <p className="mt-1 text-xs">Explore curated deals, demo balances, and instant statements.</p>
                </div>
                <div className="rounded-2xl border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4 text-sm text-[var(--neutral-600)]">
                  <p className="font-semibold text-[var(--foreground)]">Issuers</p>
                  <p className="mt-1 text-xs">Complete compliance checklists with automated document hashing.</p>
                </div>
                <div className="rounded-2xl border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4 text-sm text-[var(--neutral-600)]">
                  <p className="font-semibold text-[var(--foreground)]">Admins</p>
                  <p className="mt-1 text-xs">Approve KYC, deploy tokens, and export audit-ready evidence.</p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[28px] border border-[var(--neutral-200)] bg-[radial-gradient(circle_at_top,_rgba(11,103,255,0.12),_transparent_65%)] p-6">
              <div className="absolute inset-0 bg-[var(--primary-surface)]/40" />
              <div className="relative flex h-full flex-col justify-between gap-4">
                <div className="rounded-2xl bg-white p-5 shadow">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--neutral-500)]">Interactive preview</p>
                  <p className="mt-2 text-sm text-[var(--neutral-600)]">Toggle between investor, issuer, and admin dashboards to explore layouts before logging in.</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white p-5 shadow">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--neutral-500)]">Dashboard mockup</p>
                  <p className="mt-2 text-sm text-[var(--neutral-600)]">Highlights: live settlements, whitelist actions, token analytics, and compliance alerts.</p>
                </div>
                <Link
                  href="/explorer"
                  className="relative flex items-center justify-between rounded-2xl bg-[var(--primary-color)] px-5 py-4 text-sm font-semibold text-white shadow-lg transition hover:bg-[var(--primary-color-hover)]"
                >
                  Launch interactive mockup
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3h8m0 0v8m0-8L4 12" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4">
          <SectionHeading
            eyebrow="Choose your journey"
            title="Next steps for every stakeholder"
            description="Secure onboarding tailored for investors, issuers, and administrators."
            align="center"
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {roleCtas.map((cta) => (
              <CallToAction key={cta.title} {...cta} />
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4">
          <SectionHeading
            eyebrow="FAQ"
            title="Your sandbox questions, answered"
            description="Everything you need to brief internal teams and regulators."
            align="center"
          />
          <div className="mt-10 space-y-4">
            {faqItems.map((item) => (
              <details key={item.question} className="group rounded-2xl border border-[var(--neutral-200)] bg-white p-6 shadow-sm">
                <summary className="flex cursor-pointer items-center justify-between text-base font-semibold text-[var(--foreground)]">
                  {item.question}
                  <span className="ml-4 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--neutral-200)] text-sm text-[var(--neutral-500)] transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-[var(--neutral-500)]">{item.answer}</p>
              </details>
            ))}
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--neutral-500)]">Need a deeper dive? Book a research session with our product team or access the documentation hub.</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/docs"
                className="rounded-lg border border-[var(--neutral-200)] px-5 py-3 text-sm font-semibold text-[var(--neutral-600)] transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
              >
                View full documentation
              </Link>
              <Link
                href="mailto:research@tokenplatform.test"
                className="rounded-lg bg-[var(--primary-color)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--primary-color-hover)]"
              >
                Schedule research session
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4">
          <div className="grid gap-6 rounded-3xl border border-[var(--neutral-200)] bg-white p-10 shadow-lg lg:grid-cols-2">
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--neutral-500)]">Get in touch</p>
              <h3 className="text-3xl font-semibold text-[var(--foreground)]">Ready to orchestrate your next pilot?</h3>
              <p className="text-sm text-[var(--neutral-500)]">
                Share your use case and regulatory requirements. We'll tailor sandbox access, documentation packs, and walkthrough sessions for your team.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="mailto:sandbox@tokenplatform.test"
                  className="rounded-lg bg-[var(--primary-color)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--primary-color-hover)]"
                >
                  Email the sandbox team
                </Link>
                <Link
                  href="/docs"
                  className="rounded-lg border border-[var(--neutral-200)] px-6 py-3 text-sm font-semibold text-[var(--neutral-600)] transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
                >
                  Download compliance brief
                </Link>
              </div>
              <div className="grid gap-3 text-sm text-[var(--neutral-500)] sm:grid-cols-2">
                <div>
                  <p className="font-semibold text-[var(--foreground)]">Support hours</p>
                  <p>09:00–21:00 IST · Monday–Saturday</p>
                </div>
                <div>
                  <p className="font-semibold text-[var(--foreground)]">Upcoming webinars</p>
                  <p>Real estate tokenization, supply chain receivables, green bonds</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--neutral-200)] bg-[var(--primary-surface)]/50 p-8">
              <div className="flex items-center gap-3 text-sm text-[var(--neutral-600)]">
                <Tooltip label="Direct link to on-chain registry">
                  <svg className="h-5 w-5 text-[var(--primary-color)]" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 3.5 3.5 7v6l6.5 3.5 6.5-3.5V7L10 3.5Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 10.5V7m0 3.5 2 2" />
                  </svg>
                </Tooltip>
                <span className="font-semibold">Live explorer:</span>
                <Link href="/explorer" className="text-[var(--primary-color)] hover:text-[var(--primary-color-hover)]">
                  tokenplatform.test/explorer
                </Link>
              </div>
              <div className="mt-6 space-y-3 text-sm text-[var(--neutral-600)]">
                <p><strong>Compliance playbooks:</strong> Sandbox KYC/AML, valuation templates, audit packs</p>
                <p><strong>Advisory desk:</strong> compliance@tokenplatform.test</p>
                <p><strong>Office:</strong> GIFT City, Gandhinagar · Mumbai Innovation Center</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
