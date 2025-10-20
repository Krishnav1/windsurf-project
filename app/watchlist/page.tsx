'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import InvestorNav from '@/components/InvestorNav';

export default function WatchlistPage() {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchWatchlist(token);
  }, []);

  const fetchWatchlist = async (token: string) => {
    try {
      const response = await fetch('/api/watchlist', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setWatchlist(data.watchlist);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (assetId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/watchlist/toggle', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assetId }),
      });

      const data = await response.json();
      if (data.success) {
        setWatchlist(watchlist.filter(item => item.token_id !== assetId));
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">My Watchlist</h2>
          <p className="text-gray-600 mt-2">Assets you're interested in</p>
        </div>

        {watchlist.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlist.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <Link href={`/asset/${item.token_id}`}>
                  <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                    {item.tokens?.primary_image ? (
                      <img
                        src={item.tokens.primary_image}
                        alt={item.tokens.token_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  <Link href={`/asset/${item.token_id}`}>
                    <h3 className="font-semibold text-gray-900 mb-1 hover:text-[#0B67FF]">
                      {item.tokens?.token_name}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-500 mb-3">{item.tokens?.token_symbol}</p>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Price per Token</p>
                      <p className="font-semibold text-gray-900">
                        ₹{item.tokens?.price_per_token?.toLocaleString()}
                      </p>
                    </div>
                    {item.tokens?.expected_returns && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Returns</p>
                        <p className="font-semibold text-green-600">
                          {item.tokens.expected_returns}%
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t">
                    <Link
                      href={`/asset/${item.token_id}`}
                      className="flex-1 px-4 py-2 bg-[#0B67FF] text-white text-sm font-medium rounded-lg hover:bg-[#2D9CDB] text-center"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => removeFromWatchlist(item.token_id)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your watchlist is empty</h3>
            <p className="text-gray-600 mb-6">Start adding assets you're interested in to keep track of them</p>
            <Link
              href="/marketplace"
              className="inline-block px-6 py-3 bg-[#0B67FF] text-white rounded-lg font-semibold hover:bg-[#2D9CDB]"
            >
              Browse Marketplace
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
