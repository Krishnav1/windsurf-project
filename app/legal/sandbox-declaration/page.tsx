/**
 * Sandbox Declaration Page
 * Clear disclosure about prototype testing status
 */

"use client";

import Link from "next/link";

export default function SandboxDeclarationPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="pill badge-warning">Sandbox</span>
            <h1 className="text-xl font-semibold text-[var(--heading-color)]">TokenPlatform</h1>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-[var(--primary-color)] hover:text-[var(--primary-color-hover)]"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Critical Warning Banner */}
      <div className="border-b-4 border-rose-300 bg-rose-100 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4">
            <svg className="h-8 w-8 flex-shrink-0 text-rose-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h2 className="text-xl font-bold text-rose-900">⚠️ CRITICAL NOTICE: PROTOTYPE TESTING ENVIRONMENT</h2>
              <p className="mt-2 text-sm font-semibold text-rose-800">
                This platform is a PROTOTYPE for regulatory sandbox testing ONLY. This is NOT a production system. No real investments or financial transactions occur here.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="card-surface p-8 lg:p-12">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-12 w-12 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="mt-6 text-4xl font-bold text-[var(--heading-color)]">Sandbox Declaration</h1>
            <p className="mt-4 text-lg text-[var(--subtle-text)]">
              Regulatory Testing Environment Disclosure
            </p>
            <p className="mt-2 text-sm text-[var(--muted-text)]">
              Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="mt-12 space-y-8 text-[var(--subtle-text)]">
            {/* Primary Declaration */}
            <section className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-8">
              <h2 className="text-2xl font-bold text-rose-900">🚧 Primary Declaration</h2>
              <div className="mt-4 space-y-4 text-rose-800">
                <p className="text-lg font-semibold">
                  TokenPlatform is a PROTOTYPE platform developed exclusively for regulatory sandbox testing and evaluation under:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li><strong>IFSCA (International Financial Services Centres Authority) Regulatory Sandbox Framework</strong></li>
                  <li><strong>RBI (Reserve Bank of India) Enabling Framework for Regulatory Sandbox</strong></li>
                  <li><strong>Applicable Indian fintech innovation guidelines</strong></li>
                </ul>
                <p className="text-lg font-semibold">
                  This platform is NOT approved for production use and does NOT facilitate real financial transactions.
                </p>
              </div>
            </section>

            {/* What This Means */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">What This Means for Users</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-rose-900">
                    <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                    </svg>
                    NO Real Money
                  </h3>
                  <p className="mt-3 text-sm text-rose-800">
                    All balances, transactions, and settlements are SIMULATED. No actual money, securities, or assets are exchanged.
                  </p>
                </div>

                <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-rose-900">
                    <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                    </svg>
                    NO Real Investments
                  </h3>
                  <p className="mt-3 text-sm text-rose-800">
                    Tokens represent TEST ASSETS only. They have no real-world value and cannot be redeemed for actual assets.
                  </p>
                </div>

                <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-rose-900">
                    <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                    </svg>
                    NO Legal Obligations
                  </h3>
                  <p className="mt-3 text-sm text-rose-800">
                    No legally binding contracts or obligations are created. This is purely for testing and demonstration purposes.
                  </p>
                </div>

                <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-rose-900">
                    <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                    </svg>
                    NO Production Readiness
                  </h3>
                  <p className="mt-3 text-sm text-rose-800">
                    This platform has NOT received production approval from any regulatory authority. It is a work-in-progress prototype.
                  </p>
                </div>
              </div>
            </section>

            {/* Sandbox Objectives */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">Sandbox Testing Objectives</h2>
              <div className="mt-4 space-y-4">
                <p>This prototype is designed to demonstrate and test:</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-[var(--border-subtle)] bg-white p-5">
                    <h3 className="font-semibold text-[var(--heading-color)]">✅ Technology Validation</h3>
                    <ul className="mt-3 space-y-2 text-sm">
                      <li>• Blockchain integration (Polygon Mumbai testnet)</li>
                      <li>• Smart contract functionality</li>
                      <li>• Token issuance workflows</li>
                      <li>• Settlement simulation</li>
                    </ul>
                  </div>

                  <div className="rounded-lg border border-[var(--border-subtle)] bg-white p-5">
                    <h3 className="font-semibold text-[var(--heading-color)]">✅ Compliance Framework</h3>
                    <ul className="mt-3 space-y-2 text-sm">
                      <li>• KYC/AML procedures</li>
                      <li>• Audit trail generation</li>
                      <li>• Data localization (India)</li>
                      <li>• Regulatory reporting</li>
                    </ul>
                  </div>

                  <div className="rounded-lg border border-[var(--border-subtle)] bg-white p-5">
                    <h3 className="font-semibold text-[var(--heading-color)]">✅ User Experience</h3>
                    <ul className="mt-3 space-y-2 text-sm">
                      <li>• Investor onboarding flow</li>
                      <li>• Issuer submission process</li>
                      <li>• Admin approval workflows</li>
                      <li>• Dashboard usability</li>
                    </ul>
                  </div>

                  <div className="rounded-lg border border-[var(--border-subtle)] bg-white p-5">
                    <h3 className="font-semibold text-[var(--heading-color)]">✅ Security Measures</h3>
                    <ul className="mt-3 space-y-2 text-sm">
                      <li>• Authentication mechanisms</li>
                      <li>• Data encryption</li>
                      <li>• Access controls</li>
                      <li>• Vulnerability assessment</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Test Environment Characteristics */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">Test Environment Characteristics</h2>
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
                  <h3 className="text-lg font-semibold text-amber-900">⚠️ Important Limitations</h3>
                  <ul className="mt-4 space-y-3 text-sm text-amber-800">
                    <li className="flex items-start gap-3">
                      <span className="text-lg">🔄</span>
                      <div>
                        <strong>Data May Be Reset:</strong> All test data, including accounts, tokens, and transactions, may be reset or deleted without notice during sandbox testing.
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-lg">🐛</span>
                      <div>
                        <strong>Bugs & Errors Expected:</strong> As a prototype, the platform may contain bugs, incomplete features, or unexpected behavior.
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-lg">⏰</span>
                      <div>
                        <strong>Limited Availability:</strong> The platform may experience downtime for maintenance, updates, or testing without advance notice.
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-lg">🔧</span>
                      <div>
                        <strong>Features May Change:</strong> Functionality, UI/UX, and features are subject to change based on testing feedback and regulatory requirements.
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-lg">📊</span>
                      <div>
                        <strong>Test Blockchain Only:</strong> All blockchain transactions occur on Polygon Mumbai TESTNET, not mainnet. Testnet tokens have no value.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Authorized Users */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">Authorized Users</h2>
              <div className="mt-4 space-y-4">
                <p>Access to this sandbox environment is restricted to:</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
                    <h3 className="font-semibold text-blue-900">🏛️ Regulatory Authorities</h3>
                    <ul className="mt-3 space-y-1 text-sm text-blue-800">
                      <li>• IFSCA officials</li>
                      <li>• RBI representatives</li>
                      <li>• SEBI evaluators</li>
                      <li>• Government auditors</li>
                    </ul>
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
                    <h3 className="font-semibold text-blue-900">👥 Approved Participants</h3>
                    <ul className="mt-3 space-y-1 text-sm text-blue-800">
                      <li>• Sandbox test users</li>
                      <li>• Development team</li>
                      <li>• Security auditors</li>
                      <li>• Compliance consultants</li>
                    </ul>
                  </div>
                </div>
                <p className="text-sm text-[var(--muted-text)]">
                  Unauthorized access or use of this platform for purposes other than sandbox testing is strictly prohibited.
                </p>
              </div>
            </section>

            {/* Regulatory Framework */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">Regulatory Framework Alignment</h2>
              <div className="mt-4 space-y-4">
                <p>This sandbox prototype aligns with the following regulatory frameworks:</p>
                <div className="space-y-4">
                  <div className="rounded-lg border border-[var(--border-subtle)] bg-white p-6">
                    <h3 className="font-semibold text-[var(--heading-color)]">🇮🇳 IFSCA Regulatory Sandbox</h3>
                    <p className="mt-2 text-sm">
                      Operating under the IFSCA (International Financial Services Centres Authority) sandbox framework for testing innovative fintech solutions in GIFT City.
                    </p>
                    <p className="mt-2 text-xs text-[var(--muted-text)]">
                      Reference: IFSCA Sandbox Framework 2025
                    </p>
                  </div>

                  <div className="rounded-lg border border-[var(--border-subtle)] bg-white p-6">
                    <h3 className="font-semibold text-[var(--heading-color)]">🏦 RBI Enabling Framework</h3>
                    <p className="mt-2 text-sm">
                      Compliant with RBI's Enabling Framework for Regulatory Sandbox, designed to test innovative financial products and services.
                    </p>
                    <p className="mt-2 text-xs text-[var(--muted-text)]">
                      Reference: RBI Master Direction on Regulatory Sandbox
                    </p>
                  </div>

                  <div className="rounded-lg border border-[var(--border-subtle)] bg-white p-6">
                    <h3 className="font-semibold text-[var(--heading-color)]">🔐 Data Protection Compliance</h3>
                    <p className="mt-2 text-sm">
                      Adheres to Digital Personal Data Protection Act, 2023 and RBI data localization requirements (all data stored in India).
                    </p>
                    <p className="mt-2 text-xs text-[var(--muted-text)]">
                      Reference: DPDP Act 2023, RBI Data Localization Norms
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* User Acknowledgment */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">User Acknowledgment Required</h2>
              <div className="mt-4 rounded-xl border-2 border-blue-300 bg-blue-50 p-8">
                <h3 className="text-lg font-semibold text-blue-900">By using this platform, you acknowledge and agree that:</h3>
                <div className="mt-4 space-y-3 text-sm text-blue-800">
                  <label className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" disabled checked />
                    <span>I understand this is a PROTOTYPE for regulatory sandbox testing ONLY</span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" disabled checked />
                    <span>I acknowledge that NO real money, investments, or securities are involved</span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" disabled checked />
                    <span>I understand all transactions are SIMULATED for testing purposes</span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" disabled checked />
                    <span>I accept that test data may be reset or deleted without notice</span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" disabled checked />
                    <span>I understand this platform is NOT approved for production use</span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" disabled checked />
                    <span>I will use this platform ONLY for authorized sandbox testing purposes</span>
                  </label>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">Questions or Concerns?</h2>
              <div className="mt-4 space-y-4">
                <p>For questions about sandbox testing, regulatory compliance, or platform usage:</p>
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--neutral-50)] p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="font-semibold text-[var(--heading-color)]">Sandbox Support</p>
                      <p className="text-sm text-[var(--subtle-text)]">sandbox@tokenplatform.test</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--heading-color)]">Compliance Team</p>
                      <p className="text-sm text-[var(--subtle-text)]">compliance@tokenplatform.test</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--heading-color)]">Regulatory Liaison</p>
                      <p className="text-sm text-[var(--subtle-text)]">regulatory@tokenplatform.test</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--heading-color)]">Technical Support</p>
                      <p className="text-sm text-[var(--subtle-text)]">support@tokenplatform.test</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Final Disclaimer */}
            <div className="rounded-2xl border-4 border-rose-400 bg-rose-100 p-8 text-center">
              <h3 className="text-2xl font-bold text-rose-900">⚠️ FINAL DISCLAIMER</h3>
              <p className="mt-4 text-lg font-semibold text-rose-800">
                THIS IS A PROTOTYPE PLATFORM FOR REGULATORY SANDBOX TESTING ONLY
              </p>
              <p className="mt-3 text-sm text-rose-700">
                No real money • No real investments • No production approval • Testing purposes only
              </p>
              <p className="mt-4 text-xs text-rose-600">
                Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-12 flex flex-wrap gap-4 border-t border-[var(--border-subtle)] pt-8">
            <Link
              href="/legal/terms"
              className="rounded-lg border border-[var(--border-subtle)] px-6 py-3 text-sm font-semibold text-[var(--subtle-text)] transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
            >
              Terms & Conditions →
            </Link>
            <Link
              href="/legal/privacy"
              className="rounded-lg border border-[var(--border-subtle)] px-6 py-3 text-sm font-semibold text-[var(--subtle-text)] transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
            >
              Privacy Policy →
            </Link>
            <Link
              href="/legal/risk-disclosure"
              className="rounded-lg border border-[var(--border-subtle)] px-6 py-3 text-sm font-semibold text-[var(--subtle-text)] transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
            >
              Risk Disclosure →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
