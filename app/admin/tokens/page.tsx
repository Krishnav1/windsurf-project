'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminTokensPage() {
  const router = useRouter();
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'admin') {
      router.push('/auth/login');
      return;
    }

    fetchTokens(token);
  }, [filters]);

  const fetchTokens = async (token: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: filters.status,
        search: filters.search
      });

      const response = await fetch(`/api/admin/tokens?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setTokens(data.tokens);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (tokenId: string) => {
    if (!confirm('Deploy this token to blockchain?')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/admin/approve-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tokenId, action: 'approve' })
      });

      const data = await response.json();
      if (data.success) {
        alert('Token approved and deployed!');
        fetchTokens(token!);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to approve token');
    }
  };

  const handleReject = async (tokenId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/admin/approve-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tokenId, action: 'reject', rejectionReason: reason })
      });

      const data = await response.json();
      if (data.success) {
        alert('Token rejected');
        fetchTokens(token!);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to reject token');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Token Management</h1>
              <p className="text-sm text-gray-600">Review and approve token submissions</p>
            </div>
            <Link
              href="/admin/dashboard"
              className="text-[#0B67FF] hover:underline"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B67FF]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="active">Active</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Token name or symbol..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B67FF]"
              />
            </div>
          </div>
        </div>

        {/* Tokens List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B67FF] mx-auto"></div>
          </div>
        ) : tokens.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No token submissions found</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {tokens.map((token) => (
              <div key={token.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{token.token_name}</h3>
                    <p className="text-sm text-gray-600">{token.token_symbol}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    token.status === 'approved' || token.status === 'active' ? 'bg-green-100 text-green-800' :
                    token.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {token.status}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Asset Type</p>
                    <p className="font-medium">{token.asset_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Supply</p>
                    <p className="font-medium">{token.total_supply?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Price per Token</p>
                    <p className="font-medium">₹{token.price_per_token?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Issuer</p>
                    <p className="font-medium">{token.issuer_legal_name || 'N/A'}</p>
                  </div>
                </div>

                {token.contract_address && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Contract Address</p>
                    <p className="font-mono text-xs">{token.contract_address}</p>
                  </div>
                )}

                {token.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(token.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Approve & Deploy
                    </button>
                    <button
                      onClick={() => handleReject(token.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
