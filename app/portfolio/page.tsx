/**
 * Portfolio Page
 * 
 * Displays user's token holdings and transaction history with enhanced features
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTokenBalance, getInvestorDetails } from '@/lib/blockchain/erc3643Service';
import InvestorNav from '@/components/InvestorNav';

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
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'value',
    sortOrder: 'desc' as 'asc' | 'desc',
  });
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

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

  const filteredAndSortedPortfolio = () => {
    let filtered = [...portfolio];

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(item =>
        item.tokens?.token_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.tokens?.token_symbol?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(item => {
        if (filters.status === 'active') return !item.tokens?.is_frozen;
        if (filters.status === 'frozen') return item.tokens?.is_frozen;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (filters.sortBy) {
        case 'name':
          aVal = a.tokens?.token_name || '';
          bVal = b.tokens?.token_name || '';
          break;
        case 'balance':
          aVal = a.balance;
          bVal = b.balance;
          break;
        case 'value':
          aVal = a.currentValue || 0;
          bVal = b.currentValue || 0;
          break;
        default:
          return 0;
      }
      
      if (filters.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  };

  const totalPortfolioValue = portfolio.reduce((sum, item) => sum + (item.currentValue || 0), 0);
  const totalGainLoss = portfolio.reduce((sum, item) => {
    const purchaseValue = (item.purchase_price || item.marketPrice) * item.balance;
    const currentValue = item.currentValue || 0;
    return sum + (currentValue - purchaseValue);
  }, 0);
  const gainLossPercentage = totalPortfolioValue > 0 ? (totalGainLoss / (totalPortfolioValue - totalGainLoss)) * 100 : 0;

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
      <InvestorNav 
        showWalletConnect={true}
        onWalletConnect={handleWalletConnect}
        onWalletDisconnect={handleWalletDisconnect}
      />

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
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-2">Demo Balance</p>
            <p className="text-3xl font-bold text-[#0B67FF]">
              ₹{summary.demoBalance?.toLocaleString() || '0'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-2">Portfolio Value</p>
            <p className="text-3xl font-bold text-gray-900">
              ₹{totalPortfolioValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-2">Total Gain/Loss</p>
            <p className={`text-3xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGainLoss >= 0 ? '+' : ''}₹{totalGainLoss.toLocaleString()}
            </p>
            <p className={`text-sm ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGainLoss >= 0 ? '+' : ''}{gainLossPercentage.toFixed(2)}%
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-2">Total Assets</p>
            <p className="text-3xl font-bold text-gray-900">
              {portfolio.length}
            </p>
          </div>
        </div>

        {/* Filters and View Toggle */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <input
                type="text"
                placeholder="Search tokens..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF] focus:border-transparent"
              />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="frozen">Frozen</option>
              </select>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF] focus:border-transparent"
              >
                <option value="value">Sort by Value</option>
                <option value="name">Sort by Name</option>
                <option value="balance">Sort by Balance</option>
              </select>
              <button
                onClick={() => setFilters({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <svg className={`w-5 h-5 transition-transform ${filters.sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-[#0B67FF] text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-lg ${viewMode === 'card' ? 'bg-[#0B67FF] text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Holdings */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Token Holdings</h3>
          {filteredAndSortedPortfolio().length > 0 ? (
            viewMode === 'table' ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Token</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Locked</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Market Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gain/Loss</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedPortfolio().map((item: any) => {
                      const purchaseValue = (item.purchase_price || item.marketPrice) * item.balance;
                      const currentValue = item.currentValue || 0;
                      const gainLoss = currentValue - purchaseValue;
                      const gainLossPercent = purchaseValue > 0 ? (gainLoss / purchaseValue) * 100 : 0;
                      
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link href={`/asset/${item.token_id}`} className="flex items-center gap-3 hover:text-[#0B67FF]">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {item.tokens?.token_name}
                                </div>
                                <div className="text-sm text-gray-500">{item.tokens?.token_symbol}</div>
                              </div>
                            </Link>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className={`font-medium ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {gainLoss >= 0 ? '+' : ''}₹{gainLoss.toLocaleString()}
                            </div>
                            <div className={`text-xs ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                            </div>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <Link
                                href={`/asset/${item.token_id}`}
                                className="text-[#0B67FF] hover:text-[#2D9CDB] font-medium"
                              >
                                View
                              </Link>
                              <Link
                                href={`/trading/${item.token_id}`}
                                className="text-green-600 hover:text-green-700 font-medium"
                              >
                                Trade
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedPortfolio().map((item: any) => {
                  const purchaseValue = (item.purchase_price || item.marketPrice) * item.balance;
                  const currentValue = item.currentValue || 0;
                  const gainLoss = currentValue - purchaseValue;
                  const gainLossPercent = purchaseValue > 0 ? (gainLoss / purchaseValue) * 100 : 0;
                  
                  return (
                    <div key={item.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                      <Link href={`/asset/${item.token_id}`}>
                        <h4 className="text-lg font-bold text-gray-900 mb-2 hover:text-[#0B67FF]">
                          {item.tokens?.token_name}
                        </h4>
                        <p className="text-sm text-gray-500 mb-4">{item.tokens?.token_symbol}</p>
                      </Link>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Balance</span>
                          <span className="text-sm font-medium">{item.balance} tokens</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Current Value</span>
                          <span className="text-sm font-medium">₹{item.currentValue?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Gain/Loss</span>
                          <span className={`text-sm font-medium ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {gainLoss >= 0 ? '+' : ''}₹{gainLoss.toLocaleString()} ({gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%)
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t">
                          <span className={`px-2 py-1 text-xs rounded ${
                            item.tokens?.is_frozen 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.tokens?.is_frozen ? 'Frozen' : 'Active'}
                          </span>
                          <div className="flex gap-2">
                            <Link
                              href={`/asset/${item.token_id}`}
                              className="text-sm text-[#0B67FF] hover:text-[#2D9CDB] font-medium"
                            >
                              View
                            </Link>
                            <Link
                              href={`/trading/${item.token_id}`}
                              className="text-sm text-green-600 hover:text-green-700 font-medium"
                            >
                              Trade
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No token holdings found</p>
              <Link
                href="/marketplace"
                className="mt-4 inline-block text-[#0B67FF] hover:text-[#2D9CDB]"
              >
                Browse Marketplace →
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
