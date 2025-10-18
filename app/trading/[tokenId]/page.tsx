/**
 * Trading Page
 * 
 * Buy/sell interface for individual tokens
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function TradingPage() {
  const router = useRouter();
  const params = useParams();
  const tokenId = params.tokenId as string;
  
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('100');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const authToken = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!authToken || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchData(authToken);
  }, [tokenId]);

  const fetchData = async (authToken: string) => {
    try {
      // Fetch token details
      const tokenRes = await fetch(`/api/verify/hash?tokenId=${tokenId}`);
      const tokenData = await tokenRes.json();
      if (tokenData.success) {
        setToken(tokenData.token);
      }

      // Fetch user's orders
      const ordersRes = await fetch('/api/trading/place-order', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const ordersData = await ordersRes.json();
      if (ordersData.success) {
        setOrders(ordersData.orders.filter((o: any) => o.token_id === tokenId));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const authToken = localStorage.getItem('token');
    if (!authToken) return;

    try {
      const response = await fetch('/api/trading/place-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId,
          orderType,
          orderSide: 'market',
          quantity: parseFloat(quantity),
          price: parseFloat(price),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      alert(`${orderType.toUpperCase()} order placed successfully!`);
      setQuantity('');
      fetchData(authToken);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
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
          <p className="mt-4 text-gray-600">Loading trading interface...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Token not found</p>
          <Link href="/dashboard" className="mt-4 text-[#0B67FF] hover:text-[#2D9CDB]">
            Back to Dashboard
          </Link>
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
              <Link href="/portfolio" className="text-gray-600 hover:text-gray-900">
                Portfolio
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">Demo Balance</p>
                <p className="text-sm font-semibold text-gray-900">₹{user?.demoBalance?.toLocaleString()}</p>
              </div>
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
        {/* Token Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{token.name}</h2>
              <p className="text-lg text-gray-500">{token.symbol}</p>
              <p className="text-sm text-gray-600 mt-2">{token.assetType}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Current Price</p>
              <p className="text-3xl font-bold text-[#0B67FF]">₹{price}</p>
              <p className="text-xs text-green-600">+2.5% (24h)</p>
            </div>
          </div>
          
          {token.contractAddress && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500">Contract Address</p>
              <a
                href={`https://mumbai.polygonscan.com/address/${token.contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#0B67FF] hover:text-[#2D9CDB] break-all"
              >
                {token.contractAddress}
              </a>
            </div>
          )}
        </div>

        {/* KYC Warning */}
        {user?.kycStatus !== 'approved' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="h-5 w-5 text-yellow-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">KYC Approval Required</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Your KYC is pending approval. Trading will be enabled once your account is verified.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Trading Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Place Order</h3>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Order Type Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setOrderType('buy')}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                    orderType === 'buy'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  BUY
                </button>
                <button
                  onClick={() => setOrderType('sell')}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                    orderType === 'sell'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  SELL
                </button>
              </div>

              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    required
                    min="0.00000001"
                    step="0.00000001"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B67FF] focus:border-transparent"
                    placeholder="Enter quantity"
                    disabled={user?.kycStatus !== 'approved'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per Token (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B67FF] focus:border-transparent"
                    placeholder="Enter price"
                    disabled={user?.kycStatus !== 'approved'}
                  />
                </div>

                {quantity && price && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold text-gray-900">
                        ₹{(parseFloat(quantity) * parseFloat(price)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Available Balance:</span>
                      <span className="font-semibold text-gray-900">
                        ₹{user?.demoBalance?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || user?.kycStatus !== 'approved'}
                  className={`w-full py-4 rounded-lg font-semibold text-white transition-colors ${
                    orderType === 'buy'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {submitting ? 'Placing Order...' : `${orderType.toUpperCase()} ${token.symbol}`}
                </button>
              </form>
            </div>

            {/* Order History */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Your Orders</h3>
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            order.order_type === 'buy'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {order.order_type.toUpperCase()}
                          </span>
                          <p className="text-sm text-gray-600 mt-2">
                            {order.quantity} tokens @ ₹{order.price}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          order.status === 'filled'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'cancelled'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No orders yet</p>
              )}
            </div>
          </div>

          {/* Market Info Sidebar */}
          <div className="space-y-6">
            {/* Token Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Token Stats</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Total Supply</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {token.totalSupply?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">24h Volume</p>
                  <p className="text-lg font-semibold text-gray-900">₹1,234,567</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Market Cap</p>
                  <p className="text-lg font-semibold text-gray-900">₹12.5 Cr</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    {token.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/portfolio"
                  className="block w-full px-4 py-2 text-center border border-[#0B67FF] text-[#0B67FF] rounded-lg hover:bg-[#F4F7FB] transition-colors"
                >
                  View Portfolio
                </Link>
                <Link
                  href="/dashboard"
                  className="block w-full px-4 py-2 text-center border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-xs text-yellow-800">
                <strong>⚠️ DEMO MODE:</strong> All trades use simulated demo balance. No real money involved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
