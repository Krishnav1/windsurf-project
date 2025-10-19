/**
 * Admin Freeze Tokens Page
 * Interface for freezing/unfreezing tokens
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { erc3643Service } from '@/lib/blockchain/erc3643Service';

export default function FreezeTokensPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvestor, setSelectedInvestor] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [action, setAction] = useState<'freeze' | 'unfreeze'>('freeze');
  const [loading, setLoading] = useState(false);
  const [frozenTokens, setFrozenTokens] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    fetchFrozenTokens(token);
  }, []);

  const fetchFrozenTokens = async (token: string) => {
    try {
      const response = await fetch('/api/erc3643/admin/frozen-tokens-list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setFrozenTokens(data.frozenTokens);
      }
    } catch (error) {
      console.error('Error fetching frozen tokens:', error);
    }
  };

  const searchInvestor = async () => {
    if (!searchQuery) return;

    try {
      const response = await fetch(`/api/erc3643/investor-info?address=${searchQuery}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedInvestor(data.investor);
      } else {
        alert('Investor not found');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Error searching investor');
    }
  };

  const handleAction = async () => {
    if (!selectedInvestor || !amount || !reason) {
      alert('Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      if (action === 'freeze') {
        const txHash = await erc3643Service.freezeTokens(
          selectedInvestor.wallet_address,
          parseFloat(amount),
          reason
        );
        alert(`Tokens frozen successfully! TX: ${txHash}`);
      } else {
        const txHash = await erc3643Service.unfreezeTokens(
          selectedInvestor.wallet_address,
          parseFloat(amount)
        );
        alert(`Tokens unfrozen successfully! TX: ${txHash}`);
      }

      // Refresh list
      const token = localStorage.getItem('token');
      if (token) fetchFrozenTokens(token);
      
      // Reset form
      setAmount('');
      setReason('');
      setSelectedInvestor(null);
      setSearchQuery('');

    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-[var(--neutral-200)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/admin/dashboard">
              <h1 className="text-xl font-semibold text-[var(--primary-color)]">TokenPlatform</h1>
            </Link>
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700">
              Freeze Tokens
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-[var(--neutral-500)]">
            <Link href="/admin/dashboard" className="hover:text-[var(--primary-color)]">
              Dashboard
            </Link>
            <Link href="/admin/compliance-view" className="hover:text-[var(--primary-color)]">
              Compliance
            </Link>
            <span>{user?.fullName || user?.full_name}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-[var(--neutral-200)] px-3 py-1.5 text-[var(--neutral-600)] transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--heading-color)]">Freeze/Unfreeze Tokens</h1>
          <p className="mt-2 text-[var(--subtle-text)]">
            Manage frozen tokens for compliance and security purposes
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Freeze/Unfreeze Form */}
          <div className="card-surface p-6">
            <h2 className="text-xl font-semibold text-[var(--heading-color)]">Action</h2>
            
            {/* Action Toggle */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setAction('freeze')}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  action === 'freeze'
                    ? 'bg-red-600 text-white'
                    : 'border border-[var(--neutral-200)] text-[var(--neutral-600)] hover:border-red-600 hover:text-red-600'
                }`}
              >
                🔒 Freeze Tokens
              </button>
              <button
                onClick={() => setAction('unfreeze')}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  action === 'unfreeze'
                    ? 'bg-green-600 text-white'
                    : 'border border-[var(--neutral-200)] text-[var(--neutral-600)] hover:border-green-600 hover:text-green-600'
                }`}
              >
                ✅ Unfreeze Tokens
              </button>
            </div>

            {/* Search Investor */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-[var(--heading-color)]">
                Search Investor
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Wallet address or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 rounded-lg border border-[var(--neutral-200)] px-4 py-2 text-sm focus:border-[var(--primary-color)] focus:outline-none"
                />
                <button
                  onClick={searchInvestor}
                  className="rounded-lg bg-[var(--primary-color)] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-color-hover)]"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Selected Investor */}
            {selectedInvestor && (
              <div className="mt-6 rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4">
                <h3 className="font-semibold text-[var(--heading-color)]">Selected Investor</h3>
                <div className="mt-2 space-y-1 text-sm text-[var(--subtle-text)]">
                  <p><strong>Wallet:</strong> {selectedInvestor.wallet_address}</p>
                  <p><strong>Category:</strong> {selectedInvestor.investor_category}</p>
                  <p><strong>KYC Status:</strong> {selectedInvestor.kyc_status}</p>
                  <p><strong>Investment Limit:</strong> ₹{selectedInvestor.investment_limit?.toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-[var(--heading-color)]">
                Amount (tokens)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 text-sm focus:border-[var(--primary-color)] focus:outline-none"
              />
            </div>

            {/* Reason */}
            {action === 'freeze' && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-[var(--heading-color)]">
                  Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 text-sm focus:border-[var(--primary-color)] focus:outline-none"
                >
                  <option value="">Select reason</option>
                  <option value="kyc_expired">KYC Expired</option>
                  <option value="investigation">Under Investigation</option>
                  <option value="court_order">Court Order</option>
                  <option value="suspicious_activity">Suspicious Activity</option>
                  <option value="compliance_violation">Compliance Violation</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleAction}
              disabled={loading || !selectedInvestor || !amount}
              className={`mt-6 w-full rounded-lg px-6 py-3 text-sm font-semibold text-white transition ${
                action === 'freeze'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Processing...' : action === 'freeze' ? '🔒 Freeze Tokens' : '✅ Unfreeze Tokens'}
            </button>
          </div>

          {/* Frozen Tokens List */}
          <div className="card-surface p-6">
            <h2 className="text-xl font-semibold text-[var(--heading-color)]">Currently Frozen Tokens</h2>
            
            <div className="mt-4 space-y-3">
              {frozenTokens.length === 0 ? (
                <p className="text-sm text-[var(--muted-text)]">No frozen tokens</p>
              ) : (
                frozenTokens.map((ft) => (
                  <div
                    key={ft.id}
                    className="rounded-lg border border-[var(--neutral-200)] p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[var(--heading-color)]">
                          {ft.amount} tokens
                        </p>
                        <p className="mt-1 text-xs text-[var(--subtle-text)]">
                          {ft.investor_address.slice(0, 10)}...{ft.investor_address.slice(-8)}
                        </p>
                        <p className="mt-2 text-xs text-[var(--muted-text)]">
                          <strong>Reason:</strong> {ft.reason}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted-text)]">
                          <strong>Frozen:</strong> {new Date(ft.frozen_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                        Frozen
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
