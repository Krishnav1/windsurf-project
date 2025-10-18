/**
 * User Dashboard Page
 * 
 * Main dashboard for investors showing portfolio and available tokens
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchData(token);
  }, []);

  const fetchData = async (token: string) => {
    try {
      // Fetch portfolio
      const portfolioRes = await fetch('/api/portfolio', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const portfolioData = await portfolioRes.json();
      if (portfolioData.success) {
        setPortfolio(portfolioData.portfolio);
      }

      // Fetch available tokens
      const tokensRes = await fetch('/api/tokens/issue', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const tokensData = await tokensRes.json();
      if (tokensData.success) {
        setTokens(tokensData.tokens.filter((t: any) => t.status === 'active'));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B67FF] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <h1 className="text-2xl font-bold text-[#0B67FF]">TokenPlatform</h1>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user?.fullName} ({user?.role})
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome back, {user?.fullName}!</h2>
          <p className="mt-2 text-gray-600">
            {user?.kycStatus === 'approved' 
              ? 'Your account is verified. You can start trading.'
              : 'Your KYC is pending approval. You can browse tokens but cannot trade yet.'}
          </p>
        </div>

        {/* KYC Status Alert */}
        {user?.kycStatus === 'pending' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">KYC Pending</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Your KYC verification is under review. Trading will be enabled once approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Balance Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo Balance</h3>
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-[#0B67FF]">
              ₹{user?.demoBalance?.toLocaleString() || '0'}
            </span>
            <span className="ml-2 text-gray-500">Demo Credits</span>
          </div>
        </div>

        {/* Portfolio Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">My Portfolio</h3>
            <Link
              href="/portfolio"
              className="text-sm text-[#0B67FF] hover:text-[#2D9CDB]"
            >
              View All →
            </Link>
          </div>
          {portfolio.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolio.map((item: any) => (
                <div key={item.id} className="bg-white rounded-lg shadow p-4">
                  <h4 className="font-semibold text-gray-900">{item.tokens?.token_name}</h4>
                  <p className="text-sm text-gray-500">{item.tokens?.token_symbol}</p>
                  <div className="mt-4">
                    <p className="text-2xl font-bold text-[#0B67FF]">{item.balance}</p>
                    <p className="text-sm text-gray-500">tokens</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">You don't have any tokens yet.</p>
              <p className="text-sm text-gray-400 mt-2">Start trading to build your portfolio.</p>
            </div>
          )}
        </div>

        {/* Available Tokens */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Available Tokens</h3>
          {tokens.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tokens.map((token: any) => (
                <div key={token.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{token.token_name}</h4>
                      <p className="text-sm text-gray-500">{token.token_symbol}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{token.asset_type}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Total Supply</p>
                      <p className="font-semibold">{token.total_supply}</p>
                    </div>
                    <Link
                      href={`/trading/${token.id}`}
                      className="px-4 py-2 bg-[#0B67FF] text-white text-sm rounded hover:bg-[#2D9CDB]"
                    >
                      Trade
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No tokens available for trading yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
