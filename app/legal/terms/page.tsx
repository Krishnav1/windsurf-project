/**
 * Terms & Conditions Page
 * Legal terms for platform usage
 */

"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="pill badge-soft">Legal</span>
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

      {/* Sandbox Warning Banner */}
      <div className="border-b border-amber-200 bg-amber-50 py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-sm">
            <svg className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold text-amber-900">
              🚧 SANDBOX TESTING ENVIRONMENT - These terms apply to prototype testing only
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="card-surface p-8 lg:p-12">
          <h1 className="text-4xl font-bold text-[var(--heading-color)]">Terms & Conditions</h1>
          <p className="mt-4 text-sm text-[var(--muted-text)]">
            Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="mt-8 space-y-8 text-[var(--subtle-text)]">
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">1. Acceptance of Terms</h2>
              <div className="mt-4 space-y-4">
                <p>
                  By accessing and using TokenPlatform ("Platform", "Service", "we", "us"), you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use this Platform.
                </p>
                <p className="rounded-lg border border-rose-200 bg-rose-50 p-4 font-semibold text-rose-900">
                  ⚠️ IMPORTANT: This is a PROTOTYPE platform operating under regulatory sandbox testing for IFSCA/RBI evaluation. This is NOT a production platform and does NOT involve real money or investments.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">2. Sandbox Testing Environment</h2>
              <div className="mt-4 space-y-4">
                <p><strong>2.1 Purpose:</strong> This Platform is designed exclusively for:</p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Regulatory sandbox testing and evaluation</li>
                  <li>Demonstration of tokenization technology</li>
                  <li>Proof-of-concept for asset digitization</li>
                  <li>Compliance framework validation</li>
                </ul>
                <p><strong>2.2 No Real Transactions:</strong> All transactions on this Platform are simulated. No real money, securities, or assets are exchanged.</p>
                <p><strong>2.3 Test Data:</strong> All balances, tokens, and transactions are for testing purposes only and hold no real-world value.</p>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">3. Eligibility</h2>
              <div className="mt-4 space-y-4">
                <p><strong>3.1 Authorized Users:</strong> Access to this Platform is restricted to:</p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Regulatory authorities (IFSCA, RBI, SEBI)</li>
                  <li>Approved sandbox participants</li>
                  <li>Authorized testers and evaluators</li>
                  <li>Platform development team</li>
                </ul>
                <p><strong>3.2 Age Requirement:</strong> Users must be at least 18 years old.</p>
                <p><strong>3.3 Jurisdiction:</strong> This Platform is designed for testing within Indian regulatory frameworks.</p>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">4. User Accounts & KYC</h2>
              <div className="mt-4 space-y-4">
                <p><strong>4.1 Registration:</strong> Users must provide accurate information during registration.</p>
                <p><strong>4.2 KYC Compliance:</strong> Know Your Customer (KYC) verification is required for testing purposes and follows RBI Master KYC Directions.</p>
                <p><strong>4.3 Account Security:</strong> Users are responsible for maintaining the confidentiality of their credentials.</p>
                <p><strong>4.4 Test Credentials:</strong> All KYC documents submitted are for sandbox testing only.</p>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">5. Platform Usage</h2>
              <div className="mt-4 space-y-4">
                <p><strong>5.1 Permitted Use:</strong> The Platform may only be used for:</p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Testing tokenization workflows</li>
                  <li>Evaluating compliance features</li>
                  <li>Demonstrating blockchain integration</li>
                  <li>Regulatory assessment purposes</li>
                </ul>
                <p><strong>5.2 Prohibited Activities:</strong></p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Attempting to conduct real financial transactions</li>
                  <li>Unauthorized access or hacking attempts</li>
                  <li>Misrepresenting the Platform as production-ready</li>
                  <li>Using test data for fraudulent purposes</li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">6. Intellectual Property</h2>
              <div className="mt-4 space-y-4">
                <p><strong>6.1 Ownership:</strong> All content, code, designs, and materials on this Platform are proprietary.</p>
                <p><strong>6.2 License:</strong> Users are granted a limited, non-exclusive license to access the Platform for testing purposes only.</p>
                <p><strong>6.3 Restrictions:</strong> Users may not copy, modify, distribute, or reverse-engineer any part of the Platform.</p>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">7. Data & Privacy</h2>
              <div className="mt-4 space-y-4">
                <p><strong>7.1 Data Collection:</strong> We collect and process data as described in our <Link href="/legal/privacy" className="text-[var(--primary-color)] hover:underline">Privacy Policy</Link>.</p>
                <p><strong>7.2 Data Localization:</strong> All data is stored in India (Mumbai region) in compliance with RBI data localization requirements.</p>
                <p><strong>7.3 Test Data Handling:</strong> Test data may be reset or deleted without notice during sandbox testing.</p>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">8. Disclaimers</h2>
              <div className="mt-4 space-y-4">
                <p><strong>8.1 No Warranties:</strong> The Platform is provided "AS IS" without warranties of any kind.</p>
                <p><strong>8.2 No Financial Advice:</strong> Nothing on this Platform constitutes financial, investment, or legal advice.</p>
                <p><strong>8.3 No Liability:</strong> We are not liable for any losses, damages, or issues arising from Platform use during testing.</p>
                <p><strong>8.4 Prototype Status:</strong> This Platform is a prototype and may contain bugs, errors, or incomplete features.</p>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">9. Regulatory Compliance</h2>
              <div className="mt-4 space-y-4">
                <p><strong>9.1 Sandbox Framework:</strong> This Platform operates under:</p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>IFSCA (International Financial Services Centres Authority) Sandbox Framework</li>
                  <li>RBI (Reserve Bank of India) Enabling Framework for Regulatory Sandbox</li>
                  <li>Applicable Indian fintech regulations</li>
                </ul>
                <p><strong>9.2 Audit Rights:</strong> Regulators have full access to audit logs, transaction records, and compliance data.</p>
              </div>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">10. Termination</h2>
              <div className="mt-4 space-y-4">
                <p><strong>10.1 Right to Terminate:</strong> We may suspend or terminate access at any time without notice.</p>
                <p><strong>10.2 Sandbox Conclusion:</strong> Access will be terminated upon conclusion of sandbox testing period.</p>
                <p><strong>10.3 Data Deletion:</strong> All test data may be permanently deleted after sandbox completion.</p>
              </div>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">11. Governing Law</h2>
              <div className="mt-4 space-y-4">
                <p><strong>11.1 Jurisdiction:</strong> These Terms are governed by the laws of India.</p>
                <p><strong>11.2 Dispute Resolution:</strong> Any disputes shall be subject to the exclusive jurisdiction of courts in Mumbai, India.</p>
              </div>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">12. Changes to Terms</h2>
              <div className="mt-4 space-y-4">
                <p><strong>12.1 Modifications:</strong> We reserve the right to modify these Terms at any time during sandbox testing.</p>
                <p><strong>12.2 Notification:</strong> Users will be notified of material changes via email or Platform notification.</p>
              </div>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">13. Contact Information</h2>
              <div className="mt-4 space-y-4">
                <p>For questions about these Terms, please contact:</p>
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--neutral-50)] p-4">
                  <p><strong>Email:</strong> legal@tokenplatform.test</p>
                  <p><strong>Support:</strong> sandbox@tokenplatform.test</p>
                  <p><strong>Compliance:</strong> compliance@tokenplatform.test</p>
                </div>
              </div>
            </section>

            {/* Final Notice */}
            <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-6">
              <h3 className="text-lg font-semibold text-amber-900">📋 Sandbox Testing Acknowledgment</h3>
              <p className="mt-2 text-sm text-amber-800">
                By using this Platform, you acknowledge that:
              </p>
              <ul className="ml-6 mt-2 list-disc space-y-1 text-sm text-amber-800">
                <li>This is a PROTOTYPE for regulatory sandbox testing ONLY</li>
                <li>No real money, investments, or securities are involved</li>
                <li>All transactions are simulated for testing purposes</li>
                <li>Data may be reset or deleted without notice</li>
                <li>The Platform is NOT approved for production use</li>
              </ul>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-12 flex flex-wrap gap-4 border-t border-[var(--border-subtle)] pt-8">
            <Link
              href="/legal/privacy"
              className="rounded-lg border border-[var(--border-subtle)] px-6 py-3 text-sm font-semibold text-[var(--subtle-text)] transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
            >
              Privacy Policy →
            </Link>
            <Link
              href="/legal/sandbox-declaration"
              className="rounded-lg border border-[var(--border-subtle)] px-6 py-3 text-sm font-semibold text-[var(--subtle-text)] transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
            >
              Sandbox Declaration →
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
