'use client';

/**
 * Marketplace Page
 * Browse and invest in tokenized assets
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Asset = {
  id: string;
  name: string;
  symbol: string;
  assetType: string;
  status: string;
  totalValuation: number;
  totalSupply: number;
  pricePerToken: number;
  primaryImage: string | null;
  location: string | null;
  area: number | null;
  expectedReturns: number | null;
  lockInMonths: number | null;
  minInvestment: number | null;
  issuer: {
    name: string;
    rating: number;
    verified: boolean;
  };
  createdAt: string;
};

export default function MarketplacePage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    assetType: 'all',
    city: '',
    minPrice: '',
    maxPrice: '',
    minReturns: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAssets();
  }, [filters, page]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        page: page.toString(),
        limit: '12'
      });

      const response = await fetch(`/api/marketplace/assets?${params}`);
      const data = await response.json();

      if (data.success) {
        setAssets(data.assets);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      pending: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Approved', color: 'bg-blue-100 text-blue-800' },
      active: { label: 'Active', color: 'bg-green-100 text-green-800' },
      funded: { label: 'Fully Funded', color: 'bg-purple-100 text-purple-800' }
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse and invest in verified tokenized assets
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>

              {/* Asset Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset Type
                </label>
                <select
                  value={filters.assetType}
                  onChange={(e) => setFilters({ ...filters, assetType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="bonds">Bonds</option>
                  <option value="gold">Gold</option>
                  <option value="certificate_of_deposit">Certificate of Deposit</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Expected Returns */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min. Returns (%)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 10"
                  value={filters.minReturns}
                  onChange={(e) => setFilters({ ...filters, minReturns: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Sort By */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="created_at">Newest First</option>
                  <option value="price">Price</option>
                  <option value="returns">Returns</option>
                </select>
              </div>

              <button
                onClick={() => setFilters({
                  assetType: 'all',
                  city: '',
                  minPrice: '',
                  maxPrice: '',
                  minReturns: '',
                  sortBy: 'created_at',
                  sortOrder: 'desc'
                })}
                className="w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Assets Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No assets found matching your criteria</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assets.map((asset) => (
                    <Link
                      key={asset.id}
                      href={`/marketplace/${asset.id}`}
                      className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow"
                    >
                      {/* Image */}
                      <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                        {asset.primaryImage ? (
                          <img
                            src={asset.primaryImage}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-2">
                          {asset.issuer.verified && (
                            <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                              ✓ Verified
                            </div>
                          )}
                          <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(asset.status).color}`}>
                            {getStatusBadge(asset.status).label}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1">{asset.name}</h3>
                        <p className="text-sm text-gray-500 mb-3">
                          {asset.assetType.replace('_', ' ')} • {asset.symbol}
                        </p>

                        {asset.location && (
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {asset.location}
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs text-gray-500">Total Value</p>
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(asset.totalValuation)}
                            </p>
                          </div>
                          {asset.expectedReturns && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Returns</p>
                              <p className="font-semibold text-green-600">
                                {asset.expectedReturns}%
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {asset.totalSupply} tokens
                          </span>
                          {asset.lockInMonths && (
                            <span className="text-gray-600">
                              {asset.lockInMonths}mo lock-in
                            </span>
                          )}
                        </div>

                        {asset.minInvestment && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-gray-500">Min. Investment</p>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(asset.minInvestment)}
                            </p>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
