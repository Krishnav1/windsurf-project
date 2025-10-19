/**
 * Risk Disclosure Page
 * Investment risks and disclaimers
 */

"use client";

import Link from "next/link";

export default function RiskDisclosurePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="pill badge-danger">Risk</span>
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

      {/* Warning Banner */}
      <div className="border-b border-rose-200 bg-rose-50 py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-sm">
            <svg className="h-5 w-5 text-rose-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold text-rose-900">
              SANDBOX TESTING - These risks apply to hypothetical scenarios for regulatory evaluation only
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="card-surface p-8 lg:p-12">
          <h1 className="text-4xl font-bold text-[var(--heading-color)]">Risk Disclosure Statement</h1>
          <p className="mt-4 text-sm text-[var(--muted-text)]">
            Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="mt-8 space-y-8 text-[var(--subtle-text)]">
            {/* Critical Notice */}
            <section className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-8">
              <h2 className="text-2xl font-bold text-rose-900">CRITICAL NOTICE FOR SANDBOX TESTING</h2>
              <div className="mt-4 space-y-3 text-rose-800">
                <p className="text-lg font-semibold">
                  This Risk Disclosure is provided for EDUCATIONAL and REGULATORY EVALUATION purposes only.
                </p>
                <p className="font-semibold">
                  Since this is a PROTOTYPE platform with NO REAL INVESTMENTS:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>No actual financial risks exist for users</li>
                  <li>No real money can be lost</li>
                  <li>All scenarios described are hypothetical</li>
                  <li>This disclosure demonstrates compliance framework only</li>
                </ul>
                <p className="mt-4 text-sm">
                  <strong>However,</strong> if this platform were to operate in production, the following risks would apply to real users and investments.
                </p>
              </div>
            </section>

            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">1. Introduction</h2>
              <div className="mt-4 space-y-4">
                <p>
                  This Risk Disclosure Statement outlines the potential risks associated with tokenized asset investments and blockchain-based financial products. While this platform is currently a sandbox prototype, understanding these risks is essential for regulatory compliance and future production deployment.
                </p>
                <p className="font-semibold">
                  By using this platform (even in test mode), you acknowledge that you have read, understood, and accepted these risk disclosures.
                </p>
              </div>
            </section>

            {/* Market Risks */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">2. Market & Investment Risks</h2>
              <div className="mt-4 space-y-6">
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
                  <h3 className="text-lg font-semibold text-rose-900">
                    Loss of Capital
                  </h3>
                  <p className="mt-3 text-sm text-rose-800">
                    <strong>Risk:</strong> Tokenized assets may lose value, potentially resulting in partial or total loss of invested capital.
                  </p>
                  <p className="mt-2 text-sm text-rose-800">
                    <strong>Factors:</strong> Market volatility, asset devaluation, issuer default, economic downturns, regulatory changes.
                  </p>
                  <p className="mt-2 text-sm text-rose-800">
                    <strong>Mitigation (Production):</strong> Diversification, due diligence, investment limits, risk categorization.
                  </p>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
                  <h3 className="text-lg font-semibold text-amber-900">
                    Volatility Risk
                  </h3>
                  <p className="mt-3 text-sm text-amber-800">
                    <strong>Risk:</strong> Token prices may fluctuate significantly due to market conditions, liquidity constraints, or external events.
                  </p>
                  <p className="mt-2 text-sm text-amber-800">
                    <strong>Impact:</strong> Rapid price changes may result in unexpected gains or losses.
                  </p>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-900">
                    <span className="text-2xl">🔒</span>
                    Liquidity Risk
                  </h3>
                  <p className="mt-3 text-sm text-amber-800">
                    <strong>Risk:</strong> Tokenized assets may have limited secondary market liquidity, making it difficult to sell quickly or at desired prices.
                  </p>
                  <p className="mt-2 text-sm text-amber-800">
                    <strong>Consequence:</strong> Investors may be unable to exit positions when needed.
                  </p>
                </div>
              </div>
            </section>

            {/* Technology Risks */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">3. Technology & Blockchain Risks</h2>
              <div className="mt-4 space-y-6">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-900">
                    <span className="text-2xl">🔐</span>
                    Smart Contract Risk
                  </h3>
                  <p className="mt-3 text-sm text-blue-800">
                    <strong>Risk:</strong> Smart contracts may contain bugs, vulnerabilities, or coding errors that could result in loss of funds or unauthorized access.
                  </p>
                  <p className="mt-2 text-sm text-blue-800">
                    <strong>Mitigation:</strong> Code audits, security testing, bug bounties, formal verification (production requirement).
                  </p>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-900">
                    <span className="text-2xl">⛓️</span>
                    Blockchain Network Risk
                  </h3>
                  <p className="mt-3 text-sm text-blue-800">
                    <strong>Risk:</strong> Blockchain networks may experience congestion, forks, attacks (51% attack), or technical failures.
                  </p>
                  <p className="mt-2 text-sm text-blue-800">
                    <strong>Impact:</strong> Transaction delays, failed transactions, network splits, or loss of consensus.
                  </p>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-900">
                    <span className="text-2xl">🔑</span>
                    Private Key Management
                  </h3>
                  <p className="mt-3 text-sm text-blue-800">
                    <strong>Risk:</strong> Loss or theft of private keys results in permanent loss of access to tokens. There is no password recovery for blockchain wallets.
                  </p>
                  <p className="mt-2 text-sm text-blue-800">
                    <strong>User Responsibility:</strong> Secure storage, backup procedures, multi-signature wallets (recommended for production).
                  </p>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-900">
                    <span className="text-2xl">🐛</span>
                    Platform & System Risk
                  </h3>
                  <p className="mt-3 text-sm text-blue-800">
                    <strong>Risk:</strong> Technical failures, server downtime, software bugs, or cyber attacks may disrupt platform operations.
                  </p>
                  <p className="mt-2 text-sm text-blue-800">
                    <strong>Sandbox Note:</strong> As a prototype, this platform may experience frequent bugs and downtime during testing.
                  </p>
                </div>
              </div>
            </section>

            {/* Regulatory Risks */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">4. Regulatory & Legal Risks</h2>
              <div className="mt-4 space-y-6">
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-purple-900">
                    <span className="text-2xl">⚖️</span>
                    Regulatory Uncertainty
                  </h3>
                  <p className="mt-3 text-sm text-purple-800">
                    <strong>Risk:</strong> Cryptocurrency and tokenization regulations are evolving. New laws may restrict or prohibit certain activities.
                  </p>
                  <p className="mt-2 text-sm text-purple-800">
                    <strong>Impact:</strong> Regulatory changes may affect token value, transferability, or platform operations.
                  </p>
                </div>

                <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-purple-900">
                    <span className="text-2xl">🏛️</span>
                    Compliance Risk
                  </h3>
                  <p className="mt-3 text-sm text-purple-800">
                    <strong>Risk:</strong> Failure to comply with KYC/AML, securities laws, or tax regulations may result in penalties, account suspension, or legal action.
                  </p>
                  <p className="mt-2 text-sm text-purple-800">
                    <strong>User Obligation:</strong> Provide accurate information, comply with regulations, report taxes as required.
                  </p>
                </div>

                <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-purple-900">
                    <span className="text-2xl">🌍</span>
                    Jurisdictional Risk
                  </h3>
                  <p className="mt-3 text-sm text-purple-800">
                    <strong>Risk:</strong> Tokenized assets may not be legal or accessible in all jurisdictions. Cross-border regulations may apply.
                  </p>
                  <p className="mt-2 text-sm text-purple-800">
                    <strong>Restriction:</strong> Users must verify that their participation is legal in their jurisdiction.
                  </p>
                </div>
              </div>
            </section>

            {/* Operational Risks */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">5. Operational & Counterparty Risks</h2>
              <div className="mt-4 space-y-6">
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-orange-900">
                    <span className="text-2xl">🏢</span>
                    Issuer Default Risk
                  </h3>
                  <p className="mt-3 text-sm text-orange-800">
                    <strong>Risk:</strong> Asset issuers may fail to meet obligations, default on payments, or become insolvent.
                  </p>
                  <p className="mt-2 text-sm text-orange-800">
                    <strong>Impact:</strong> Token value may decline to zero if underlying asset becomes worthless.
                  </p>
                </div>

                <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-orange-900">
                    <span className="text-2xl">🔍</span>
                    Custody & Asset Backing Risk
                  </h3>
                  <p className="mt-3 text-sm text-orange-800">
                    <strong>Risk:</strong> Physical assets backing tokens may be lost, stolen, damaged, or misrepresented.
                  </p>
                  <p className="mt-2 text-sm text-orange-800">
                    <strong>Mitigation (Production):</strong> Third-party custody, insurance, regular audits, proof of reserves.
                  </p>
                </div>

                <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-orange-900">
                    <span className="text-2xl">🔄</span>
                    Settlement Risk
                  </h3>
                  <p className="mt-3 text-sm text-orange-800">
                    <strong>Risk:</strong> Settlement failures, payment delays, or reconciliation errors may occur during transactions.
                  </p>
                  <p className="mt-2 text-sm text-orange-800">
                    <strong>Note:</strong> In production, CBDC/UPI integration would reduce but not eliminate settlement risk.
                  </p>
                </div>
              </div>
            </section>

            {/* Security Risks */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">6. Security & Fraud Risks</h2>
              <div className="mt-4 space-y-6">
                <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-red-900">
                    <span className="text-2xl">🚨</span>
                    Cyber Attack Risk
                  </h3>
                  <p className="mt-3 text-sm text-red-800">
                    <strong>Risk:</strong> Hacking, phishing, malware, or DDoS attacks may compromise user accounts or platform security.
                  </p>
                  <p className="mt-2 text-sm text-red-800">
                    <strong>Protection:</strong> 2FA, strong passwords, security monitoring, regular audits (production requirement).
                  </p>
                </div>

                <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-red-900">
                    <span className="text-2xl">🎭</span>
                    Fraud & Scam Risk
                  </h3>
                  <p className="mt-3 text-sm text-red-800">
                    <strong>Risk:</strong> Fraudulent issuers, fake tokens, Ponzi schemes, or social engineering attacks may target users.
                  </p>
                  <p className="mt-2 text-sm text-red-800">
                    <strong>Due Diligence:</strong> Verify issuer credentials, review documentation, report suspicious activity.
                  </p>
                </div>

                <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-red-900">
                    <span className="text-2xl">🔓</span>
                    Unauthorized Access
                  </h3>
                  <p className="mt-3 text-sm text-red-800">
                    <strong>Risk:</strong> Weak passwords, shared credentials, or compromised devices may lead to unauthorized account access.
                  </p>
                  <p className="mt-2 text-sm text-red-800">
                    <strong>User Responsibility:</strong> Secure credentials, enable 2FA, use trusted devices, monitor account activity.
                  </p>
                </div>
              </div>
            </section>

            {/* Investor Categories */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">7. Investor Category Limits (Production)</h2>
              <div className="mt-4 space-y-4">
                <p>
                  In production deployment, investment limits would be enforced based on investor categorization:
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-[var(--border-subtle)] bg-white p-5">
                    <h3 className="font-semibold text-[var(--heading-color)]">🟢 Retail Investor</h3>
                    <p className="mt-2 text-2xl font-bold text-[var(--primary-color)]">₹1,00,000</p>
                    <p className="text-xs text-[var(--muted-text)]">Maximum exposure (sandbox limit)</p>
                    <ul className="mt-3 space-y-1 text-xs text-[var(--subtle-text)]">
                      <li>• Basic KYC required</li>
                      <li>• Limited risk tolerance</li>
                      <li>• Enhanced protections</li>
                    </ul>
                  </div>

                  <div className="rounded-lg border border-[var(--border-subtle)] bg-white p-5">
                    <h3 className="font-semibold text-[var(--heading-color)]">🟡 Accredited Investor</h3>
                    <p className="mt-2 text-2xl font-bold text-[var(--primary-color)]">₹10,00,000</p>
                    <p className="text-xs text-[var(--muted-text)]">Maximum exposure (sandbox limit)</p>
                    <ul className="mt-3 space-y-1 text-xs text-[var(--subtle-text)]">
                      <li>• Enhanced KYC required</li>
                      <li>• Financial sophistication</li>
                      <li>• Higher risk capacity</li>
                    </ul>
                  </div>

                  <div className="rounded-lg border border-[var(--border-subtle)] bg-white p-5">
                    <h3 className="font-semibold text-[var(--heading-color)]">🔵 Institutional</h3>
                    <p className="mt-2 text-2xl font-bold text-[var(--primary-color)]">₹1,00,00,000</p>
                    <p className="text-xs text-[var(--muted-text)]">Maximum exposure (sandbox limit)</p>
                    <ul className="mt-3 space-y-1 text-xs text-[var(--subtle-text)]">
                      <li>• Corporate KYC required</li>
                      <li>• Professional management</li>
                      <li>• Regulatory oversight</li>
                    </ul>
                  </div>
                </div>
                <p className="text-sm text-[var(--muted-text)]">
                  <strong>Note:</strong> These limits are for sandbox testing only. Production limits would be determined by regulatory guidelines.
                </p>
              </div>
            </section>

            {/* No Guarantee */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">8. No Guarantees or Warranties</h2>
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--neutral-50)] p-6">
                  <p className="font-semibold">The platform and tokenized assets come with NO guarantees regarding:</p>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li>✗ Returns on investment or profit generation</li>
                    <li>✗ Token value preservation or appreciation</li>
                    <li>✗ Liquidity or ability to sell tokens</li>
                    <li>✗ Platform availability or uptime</li>
                    <li>✗ Accuracy of information provided by issuers</li>
                    <li>✗ Regulatory approval or compliance</li>
                    <li>✗ Security against all threats</li>
                    <li>✗ Suitability for any particular purpose</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* User Responsibilities */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">9. User Responsibilities</h2>
              <div className="mt-4 space-y-4">
                <p>Users are responsible for:</p>
                <ul className="ml-6 list-disc space-y-2">
                  <li><strong>Due Diligence:</strong> Researching issuers, assets, and market conditions before investing</li>
                  <li><strong>Risk Assessment:</strong> Evaluating personal risk tolerance and financial capacity</li>
                  <li><strong>Diversification:</strong> Not investing more than they can afford to lose</li>
                  <li><strong>Compliance:</strong> Following all applicable laws and regulations</li>
                  <li><strong>Security:</strong> Protecting account credentials and private keys</li>
                  <li><strong>Tax Reporting:</strong> Declaring and paying taxes on gains as required</li>
                  <li><strong>Professional Advice:</strong> Consulting financial, legal, and tax advisors</li>
                </ul>
              </div>
            </section>

            {/* Acknowledgment */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">10. Acknowledgment & Acceptance</h2>
              <div className="mt-4 rounded-xl border-2 border-blue-300 bg-blue-50 p-8">
                <h3 className="text-lg font-semibold text-blue-900">By using this platform, you acknowledge that:</h3>
                <div className="mt-4 space-y-3 text-sm text-blue-800">
                  <label className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" disabled checked />
                    <span>I have read and understood all risks disclosed in this document</span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" disabled checked />
                    <span>I understand that investments in tokenized assets carry significant risks</span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" disabled checked />
                    <span>I accept that I may lose some or all of my invested capital (in production)</span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" disabled checked />
                    <span>I will conduct my own due diligence before making investment decisions</span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" disabled checked />
                    <span>I will seek professional advice as needed</span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" disabled checked />
                    <span>I understand this is currently a SANDBOX with NO REAL RISKS</span>
                  </label>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-[var(--heading-color)]">Questions About Risks?</h2>
              <div className="mt-4 space-y-4">
                <p>For questions about investment risks or compliance:</p>
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--neutral-50)] p-4">
                  <p><strong>Risk Management:</strong> risk@tokenplatform.test</p>
                  <p><strong>Compliance Team:</strong> compliance@tokenplatform.test</p>
                  <p><strong>Investor Support:</strong> support@tokenplatform.test</p>
                </div>
              </div>
            </section>

            {/* Final Warning */}
            <div className="rounded-2xl border-4 border-rose-400 bg-rose-100 p-8 text-center">
              <h3 className="text-2xl font-bold text-rose-900">⚠️ SANDBOX REMINDER</h3>
              <p className="mt-4 text-lg font-semibold text-rose-800">
                This is a PROTOTYPE platform for regulatory testing ONLY
              </p>
              <p className="mt-3 text-sm text-rose-700">
                No real investments • No actual risks • Educational purposes only
              </p>
              <p className="mt-4 text-xs text-rose-600">
                These risk disclosures would apply if the platform were deployed in production with real assets.
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
              href="/legal/sandbox-declaration"
              className="rounded-lg border border-[var(--border-subtle)] px-6 py-3 text-sm font-semibold text-[var(--subtle-text)] transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
            >
              Sandbox Declaration →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
