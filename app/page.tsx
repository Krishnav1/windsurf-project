/**
 * Landing Page - Tokenization Platform
 * 
 * Main entry point showcasing platform features and value proposition
 * Light theme: Blue (#0B67FF) and White (#FFFFFF)
 */

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-[#0B67FF]">TokenPlatform</h1>
            </div>
            <div className="flex gap-4">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-[#0B67FF] hover:bg-[#F4F7FB] rounded-lg transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 bg-[#0B67FF] text-white rounded-lg hover:bg-[#2D9CDB] transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-[#F4F7FB] rounded-full text-sm text-[#0B67FF] font-medium">
            ⚠️ PROTOTYPE - Test Environment Only
          </div>
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Tokenize Real-World Assets
            <br />
            <span className="text-[#0B67FF]">On Blockchain</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Secure, compliant, and transparent platform for issuing, trading, and settling tokenized assets.
            Built for IFSCA/RBI sandbox readiness with on-chain proof anchoring.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-3 bg-[#0B67FF] text-white rounded-lg hover:bg-[#2D9CDB] transition-colors font-medium"
            >
              Request Demo
            </Link>
            <Link
              href="/explorer"
              className="px-8 py-3 border-2 border-[#0B67FF] text-[#0B67FF] rounded-lg hover:bg-[#F4F7FB] transition-colors font-medium"
            >
              Explore Tokens
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-[#F4F7FB]">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-[#0B67FF] text-white rounded-lg flex items-center justify-center text-xl font-bold mb-4">
                1
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">Issuance</h4>
              <p className="text-gray-600">
                Asset issuers upload documents, system computes SHA-256 hashes, and admin approves. 
                Token is minted on Polygon Mumbai testnet with metadata hash anchored on-chain.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-[#2D9CDB] text-white rounded-lg flex items-center justify-center text-xl font-bold mb-4">
                2
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">Trading</h4>
              <p className="text-gray-600">
                KYC-approved investors place buy/sell orders in simulated order book. 
                Market orders execute instantly with demo balance settlement.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-[#16A34A] text-white rounded-lg flex items-center justify-center text-xl font-bold mb-4">
                3
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">Settlement</h4>
              <p className="text-gray-600">
                Simulated CBDC/UPI settlement with instant finality. 
                All transactions logged with blockchain proof for audit trail.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">Key Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="text-3xl mb-3">🔐</div>
              <h4 className="font-bold mb-2 text-gray-900">SHA-256 Hashing</h4>
              <p className="text-sm text-gray-600">Immutable document proofs anchored on blockchain</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="text-3xl mb-3">✅</div>
              <h4 className="font-bold mb-2 text-gray-900">KYC/Compliance</h4>
              <p className="text-sm text-gray-600">Admin approval workflows for regulatory compliance</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="text-3xl mb-3">⛓️</div>
              <h4 className="font-bold mb-2 text-gray-900">Blockchain Proof</h4>
              <p className="text-sm text-gray-600">Every transaction verified on Polygon testnet</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="text-3xl mb-3">📊</div>
              <h4 className="font-bold mb-2 text-gray-900">Audit Logs</h4>
              <p className="text-sm text-gray-600">Immutable audit trail for regulators</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-16 bg-[#F4F7FB]">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-8 text-gray-900">Security & Compliance</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="text-2xl mb-2">🔒</div>
              <p className="font-medium text-gray-900">2FA Authentication</p>
            </div>
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="text-2xl mb-2">🇮🇳</div>
              <p className="font-medium text-gray-900">India Data Residency</p>
            </div>
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="text-2xl mb-2">📝</div>
              <p className="font-medium text-gray-900">VAPT Ready</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h3 className="text-3xl font-bold mb-4 text-gray-900">Ready to Get Started?</h3>
          <p className="text-gray-600 mb-8">
            Join the future of asset tokenization. Create your account and explore the platform.
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-8 py-3 bg-[#0B67FF] text-white rounded-lg hover:bg-[#2D9CDB] transition-colors font-medium"
          >
            Create Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p className="mb-2">
            <strong>Prototype Platform</strong> - For demonstration and sandbox testing only
          </p>
          <p className="text-sm">
            Built for IFSCA/GIFT City and RBI sandbox readiness | Polygon Mumbai Testnet
          </p>
        </div>
      </footer>
    </div>
  );
}
