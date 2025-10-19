/**
 * Portfolio Page
 * 
 * Displays user's token holdings and transaction history
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTokenBalance, getInvestorDetails } from '@/lib/blockchain/erc3643Service';
import WalletConnect from '@/components/WalletConnect';

export default function PortfolioPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [erc3643Balance, setErc3643Balance] = useState<any>(null);
  const [investorInfo, setInvestorInfo] = useState<any>(null);
  const [investmentLimit, setInvestmentLimit] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchPortfolio(token);
  }, []);

  const handleWalletConnect = async (address: string) => {
    setWalletAddress(address);
    
    // Fetch ERC3643 balance
    try {
      const balance = await getTokenBalance(address);
      setErc3643Balance(balance);
      
      const info = await getInvestorDetails(address);
      setInvestorInfo(info);
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
    }
  };

  const handleWalletDisconnect = () => {
    setWalletAddress(null);
    setErc3643Balance(null);
    setInvestorInfo(null);
  };

  const fetchPortfolio = async (token: string) => {
    try {
      const response = await fetch('/api/portfolio', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setPortfolio(data.portfolio);
        setTransactions(data.transactions);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
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
          <p className="mt-4 text-gray-600">Loading portfolio...</p>
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
            <div className="flex items-center gap-8">
              <Link href="/">
                <h1 className="text-2xl font-bold text-[#0B67FF]">TokenPlatform</h1>
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/portfolio" className="text-[#0B67FF] font-medium">
                Portfolio
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <WalletConnect 
                onConnect={handleWalletConnect}
                onDisconnect={handleWalletDisconnect}
              />
              <span className="text-sm text-gray-600">{user?.fullName}</span>
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
        <h2 className="text-3xl font-bold text-gray-900 mb-8">My Portfolio</h2>

        {/* Wallet Status Banner */}
        {walletAddress && erc3643Balance && (
          <div className="mb-8 bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-emerald-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">🔗 Blockchain Connected</h3>
                <div className="grid grid-cols-3 gap-6 mt-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ERC-3643 Balance</p>
                    <p className="text-2xl font-bold text-emerald-600">{erc3643Balance.total.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Available: {erc3643Balance.available.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Frozen Tokens</p>
                    <p className="text-2xl font-bold text-orange-600">{erc3643Balance.frozen.toFixed(2)}</p>
                  </div>
                  {investorInfo && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Investment Limit</p>
                      <p className="text-2xl font-bold text-blue-600">₹{investorInfo.investmentLimit.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Used: ₹{investorInfo.currentInvestment.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
              {investorInfo && (
                <div className="text-right">
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                    investorInfo.kycStatus === 'approved' ? 'bg-green-100 text-green-800' :
                    investorInfo.kycStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    KYC: {investorInfo.kycStatus.toUpperCase()}
                  </span>
                  <p className="text-xs text-gray-500 mt-2">Category: {investorInfo.category}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-2">Demo Balance</p>
            <p className="text-3xl font-bold text-[#0B67FF]">
              ₹{summary.demoBalance?.toLocaleString() || '0'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-2">Portfolio Value</p>
            <p className="text-3xl font-bold text-gray-900">
              ₹{summary.totalPortfolioValue?.toLocaleString() || '0'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-2">Total Assets</p>
            <p className="text-3xl font-bold text-gray-900">
              {summary.totalAssets || 0}
            </p>
          </div>
        </div>

        {/* Holdings */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Token Holdings</h3>
          {portfolio.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Token</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Locked</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Market Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {portfolio.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.tokens?.token_name}
                          </div>
                          <div className="text-sm text-gray-500">{item.tokens?.token_symbol}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.balance}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.locked_balance || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{item.marketPrice}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{item.currentValue?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${
                          item.tokens?.is_frozen 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.tokens?.is_frozen ? 'Frozen' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No token holdings yet</p>
              <Link
                href="/dashboard"
                className="mt-4 inline-block text-[#0B67FF] hover:text-[#2D9CDB]"
              >
                Browse available tokens →
              </Link>
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Transaction History</h3>
          {transactions.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Token</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blockchain</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx: any) => (
                    <tr key={tx.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tx.tokens?.token_symbol || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tx.quantity || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tx.total_amount ? `₹${tx.total_amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${
                          tx.settlement_status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : tx.settlement_status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {tx.settlement_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {tx.blockchain_tx_hash ? (
                          <a
                            href={`https://mumbai.polygonscan.com/tx/${tx.blockchain_tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0B67FF] hover:text-[#2D9CDB]"
                          >
                            View ↗
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
