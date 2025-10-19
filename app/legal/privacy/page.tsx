/**
 * Privacy Policy Page
 * Data handling and privacy practices
 */

"use client";

import Link from "next/link";

export default function PrivacyPage() {
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

      {/* Data Localization Banner */}
      <div className="border-b border-emerald-200 bg-emerald-50 py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-sm">
            <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold text-emerald-900">
              🇮🇳 All data stored in India (Mumbai) - RBI Data Localization Compliant
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="card-surface p-8 lg:p-12">
          <h1 className="text-4xl font-bold text-[var(--heading-color)]">Privacy Policy</h1>
          <p className="mt-4 text-sm text-[var(--muted-text)]">
            Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="mt-8 space-y-8 text-[var(--subtle-text)]">
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">1. Introduction</h2>
              <div className="mt-4 space-y-4">
                <p>
                  TokenPlatform ("we", "us", "our") is committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, store, and protect your information during sandbox testing.
                </p>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="font-semibold text-blue-900">
                    🔒 This is a SANDBOX ENVIRONMENT: All data collected is for testing purposes only and complies with RBI data localization requirements.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">2. Data We Collect</h2>
              <div className="mt-4 space-y-4">
                <p><strong>2.1 Personal Information:</strong></p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Full name, email address, mobile number</li>
                  <li>Date of birth, nationality, country of residence</li>
                  <li>Government ID details (for KYC testing)</li>
                  <li>Wallet addresses (blockchain testing)</li>
                </ul>
                
                <p><strong>2.2 KYC Documents (Test Data):</strong></p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Identity proof (Aadhaar, PAN, Passport)</li>
                  <li>Address proof</li>
                  <li>Photograph</li>
                  <li>Document hashes (SHA-256)</li>
                </ul>

                <p><strong>2.3 Transaction Data:</strong></p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Simulated trades and orders</li>
                  <li>Mock settlement records</li>
                  <li>Demo balance transactions</li>
                  <li>Blockchain transaction hashes</li>
                </ul>

                <p><strong>2.4 Technical Data:</strong></p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>IP address, browser type, device information</li>
                  <li>Login timestamps and session data</li>
                  <li>Audit logs and activity records</li>
                  <li>Error logs and performance metrics</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">3. How We Use Your Data</h2>
              <div className="mt-4 space-y-4">
                <p><strong>3.1 Sandbox Testing:</strong></p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Demonstrate KYC verification workflows</li>
                  <li>Test tokenization and trading features</li>
                  <li>Validate compliance mechanisms</li>
                  <li>Evaluate blockchain integration</li>
                </ul>

                <p><strong>3.2 Regulatory Compliance:</strong></p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Meet IFSCA/RBI sandbox requirements</li>
                  <li>Generate audit trails for regulators</li>
                  <li>Demonstrate data localization compliance</li>
                  <li>Provide compliance reports</li>
                </ul>

                <p><strong>3.3 Platform Improvement:</strong></p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Identify and fix bugs</li>
                  <li>Optimize user experience</li>
                  <li>Enhance security measures</li>
                  <li>Improve performance</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">4. Data Storage & Localization</h2>
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50 p-6">
                  <h3 className="text-lg font-semibold text-emerald-900">🇮🇳 RBI Data Localization Compliance</h3>
                  <div className="mt-3 space-y-2 text-sm text-emerald-800">
                    <p><strong>Storage Location:</strong> All data is stored exclusively in India (Mumbai region)</p>
                    <p><strong>Database Provider:</strong> Supabase (ap-south-1 region)</p>
                    <p><strong>Blockchain Network:</strong> Polygon Mumbai Testnet (India-accessible)</p>
                    <p><strong>Backup Location:</strong> India-based servers only</p>
                  </div>
                </div>

                <p><strong>4.2 Data Security:</strong></p>
                <ul className="ml-6 list-disc space-y-2">
                  <li><strong>Encryption:</strong> All sensitive data encrypted at rest and in transit (TLS 1.3)</li>
                  <li><strong>Password Hashing:</strong> bcrypt with salt (10 rounds)</li>
                  <li><strong>Document Hashing:</strong> SHA-256 for integrity verification</li>
                  <li><strong>Access Control:</strong> Role-based access control (RBAC)</li>
                  <li><strong>2FA Support:</strong> Two-factor authentication available</li>
                </ul>

                <p><strong>4.3 Data Retention:</strong></p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Test data retained only during sandbox period</li>
                  <li>Audit logs preserved for regulatory review</li>
                  <li>Data may be deleted after sandbox conclusion</li>
                  <li>Users will be notified before data deletion</li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">5. Data Sharing & Disclosure</h2>
              <div className="mt-4 space-y-4">
                <p><strong>5.1 Regulatory Authorities:</strong></p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>IFSCA (International Financial Services Centres Authority)</li>
                  <li>RBI (Reserve Bank of India)</li>
                  <li>SEBI (Securities and Exchange Board of India)</li>
                  <li>Other authorized regulatory bodies</li>
                </ul>

                <p><strong>5.2 Service Providers:</strong></p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Supabase (database hosting - India region)</li>
                  <li>Alchemy (blockchain RPC provider)</li>
                  <li>Vercel (hosting infrastructure)</li>
                </ul>

                <p><strong>5.3 We DO NOT:</strong></p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Sell your data to third parties</li>
                  <li>Share data for marketing purposes</li>
                  <li>Transfer data outside India</li>
                  <li>Use data for purposes beyond sandbox testing</li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">6. Your Rights (DPDP Act 2023)</h2>
              <div className="mt-4 space-y-4">
                <p>Under India's Digital Personal Data Protection Act, 2023, you have the right to:</p>
                <ul className="ml-6 list-disc space-y-2">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your test data</li>
                  <li><strong>Portability:</strong> Export your data in machine-readable format</li>
                  <li><strong>Grievance:</strong> File complaints about data handling</li>
                  <li><strong>Consent Withdrawal:</strong> Withdraw consent for data processing</li>
                </ul>

                <p className="mt-4">
                  <strong>To exercise your rights, contact:</strong>
                </p>
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--neutral-50)] p-4">
                  <p><strong>Data Protection Officer:</strong> dpo@tokenplatform.test</p>
                  <p><strong>Privacy Team:</strong> privacy@tokenplatform.test</p>
                  <p><strong>Response Time:</strong> Within 7 business days</p>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">7. Cookies & Tracking</h2>
              <div className="mt-4 space-y-4">
                <p><strong>7.1 Essential Cookies:</strong></p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Authentication tokens (JWT)</li>
                  <li>Session management</li>
                  <li>Security preferences</li>
                </ul>

                <p><strong>7.2 Analytics (Optional):</strong></p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Usage patterns for platform improvement</li>
                  <li>Error tracking for debugging</li>
                  <li>Performance monitoring</li>
                </ul>

                <p><strong>7.3 No Third-Party Tracking:</strong> We do not use advertising cookies or third-party trackers.</p>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">8. Blockchain & Public Data</h2>
              <div className="mt-4 space-y-4">
                <p><strong>8.1 Public Blockchain Data:</strong></p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Transaction hashes are publicly visible on Polygon Mumbai testnet</li>
                  <li>Wallet addresses may be visible on blockchain explorers</li>
                  <li>Smart contract interactions are transparent and immutable</li>
                </ul>

                <p><strong>8.2 Privacy Measures:</strong></p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Personal data is NOT stored on blockchain</li>
                  <li>Only document hashes (not documents) are anchored on-chain</li>
                  <li>Wallet addresses are pseudonymous</li>
                </ul>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">9. Security Measures</h2>
              <div className="mt-4 space-y-4">
                <p><strong>9.1 Technical Safeguards:</strong></p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>TLS 1.3 encryption for data in transit</li>
                  <li>AES-256 encryption for data at rest</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>Automated vulnerability scanning</li>
                  <li>Firewall and DDoS protection</li>
                </ul>

                <p><strong>9.2 Organizational Safeguards:</strong></p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Access limited to authorized personnel only</li>
                  <li>Comprehensive audit logging</li>
                  <li>Regular security training for team</li>
                  <li>Incident response procedures</li>
                </ul>

                <p><strong>9.3 Data Breach Protocol:</strong></p>
                <p>In the event of a data breach, we will:</p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Notify affected users within 72 hours</li>
                  <li>Report to relevant regulatory authorities</li>
                  <li>Take immediate remedial action</li>
                  <li>Provide guidance on protective measures</li>
                </ul>
              </div>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">10. Children's Privacy</h2>
              <div className="mt-4 space-y-4">
                <p>
                  This Platform is not intended for users under 18 years of age. We do not knowingly collect data from minors. If we discover that a minor has provided personal information, we will delete it immediately.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">11. Changes to Privacy Policy</h2>
              <div className="mt-4 space-y-4">
                <p>
                  We may update this Privacy Policy during sandbox testing. Material changes will be communicated via:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Email notification to registered users</li>
                  <li>Prominent notice on Platform dashboard</li>
                  <li>Updated "Last Modified" date at top of this page</li>
                </ul>
              </div>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">12. Contact Us</h2>
              <div className="mt-4 space-y-4">
                <p>For privacy-related questions or concerns:</p>
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--neutral-50)] p-4">
                  <p><strong>Privacy Team:</strong> privacy@tokenplatform.test</p>
                  <p><strong>Data Protection Officer:</strong> dpo@tokenplatform.test</p>
                  <p><strong>Compliance Team:</strong> compliance@tokenplatform.test</p>
                  <p><strong>Support:</strong> sandbox@tokenplatform.test</p>
                </div>
              </div>
            </section>

            {/* Final Notice */}
            <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-6">
              <h3 className="text-lg font-semibold text-blue-900">🔒 Sandbox Data Notice</h3>
              <p className="mt-2 text-sm text-blue-800">
                Remember: This is a SANDBOX TESTING ENVIRONMENT. All data collected is for demonstration and regulatory evaluation purposes only. No real financial transactions occur on this Platform.
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
