'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import InvestorNav from '@/components/InvestorNav';
import Link from 'next/link';

interface Holding {
  id: string;
  token_id: string;
  quantity: string;
  avg_purchase_price: string;
  total_invested: string;
  current_value: string;
  unrealized_pnl: string;
  blockchain_verified: boolean;
  last_synced_at: string;
  token: {
    name: string;
    symbol: string;
    current_price: string;
    contract_address: string;
  };
}

export default function HoldingsPage() {
  const router = useRouter();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [totalInvested, setTotalInvested] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchHoldings(token);
  }, []);

  const fetchHoldings = async (token: string) => {
    try {
      const response = await fetch('/api/holdings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setHoldings(data.holdings);
        calculateTotals(data.holdings);
      }
    } catch (error) {
      console.error('Error fetching holdings:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (holdings: Holding[]) => {
    let invested = 0;
    let value = 0;
    let pnl = 0;

    holdings.forEach(holding => {
      invested += parseFloat(holding.total_invested || '0');
      value += parseFloat(holding.current_value || '0');
      pnl += parseFloat(holding.unrealized_pnl || '0');
    });

    setTotalInvested(invested);
    setCurrentValue(value);
    setTotalPnL(pnl);
  };

  const syncFromBlockchain = async (tokenId: string, tokenAddress: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setSyncing(true);
    try {
      const response = await fetch('/api/holdings/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tokenAddress })
      });

      const data = await response.json();
      if (data.success) {
        alert('Holdings synced from blockchain!');
        fetchHoldings(token);
      } else {
        alert('Sync failed: ' + data.error);
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB]">
        <InvestorNav />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B67FF]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <InvestorNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Holdings</h1>
          <p className="text-gray-600 mt-2">Track your token portfolio and performance</p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">Total Invested</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">Current Value</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">Total P&L</p>
            <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              <span className="text-sm ml-2">
                ({totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : '0.00'}%)
              </span>
            </p>
          </div>
        </div>

        {/* Holdings Table */}
        {holdings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Holdings Yet</h3>
            <p className="text-gray-600 mb-6">
              Start investing in tokenized assets to build your portfolio
            </p>
            <Link
              href="/marketplace"
              className="inline-block px-6 py-3 bg-[#0B67FF] text-white rounded-lg hover:bg-[#2D9CDB] font-medium"
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Token
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invested
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P&L
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {holdings.map((holding) => {
                    const pnl = parseFloat(holding.unrealized_pnl || '0');
                    const pnlPercent = parseFloat(holding.total_invested) > 0
                      ? (pnl / parseFloat(holding.total_invested)) * 100
                      : 0;

                    return (
                      <tr key={holding.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {holding.token?.name || 'Unknown Token'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {holding.token?.symbol || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {parseFloat(holding.quantity).toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{parseFloat(holding.avg_purchase_price || '0').toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{parseFloat(holding.token?.current_price || '0').toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{parseFloat(holding.total_invested || '0').toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{parseFloat(holding.current_value || '0').toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString('en-IN')}
                            <div className="text-xs">
                              ({pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {holding.blockchain_verified ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => syncFromBlockchain(holding.token_id, holding.token?.contract_address)}
                            disabled={syncing}
                            className="text-[#0B67FF] hover:text-[#2D9CDB] disabled:opacity-50"
                          >
                            🔄 Sync
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Box */}
        {holdings.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Click "Sync" to update holdings from blockchain. Last synced times are shown for each token.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
