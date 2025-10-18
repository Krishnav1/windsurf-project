/**
 * Admin Dashboard Page
 * 
 * Central control panel for platform administrators
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    fetchData(token);
  }, []);

  const fetchData = async (token: string) => {
    try {
      // Fetch users for KYC approval
      const usersRes = await fetch('/api/admin/kyc-approval', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const usersData = await usersRes.json();
      if (usersData.success) {
        setUsers(usersData.users);
      }

      // Fetch tokens for approval
      const tokensRes = await fetch('/api/tokens/issue', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const tokensData = await tokensRes.json();
      if (tokensData.success) {
        setTokens(tokensData.tokens);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKYCApproval = async (userId: string, action: 'approve' | 'reject') => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/admin/kyc-approval', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action,
          rejectionReason: action === 'reject' ? 'Documents incomplete' : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`KYC ${action}d successfully`);
        fetchData(token);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update KYC status');
    }
  };

  const handleTokenApproval = async (tokenId: string, action: 'approve' | 'reject') => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (action === 'approve' && !confirm('This will deploy the token to blockchain. Continue?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/approve-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId,
          action,
          rejectionReason: action === 'reject' ? 'Documentation insufficient' : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Token ${action}d successfully${action === 'approve' ? '\nContract: ' + data.deployment?.contractAddress : ''}`);
        fetchData(token);
      } else {
        alert(data.error || data.details);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update token status');
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
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const pendingKYC = users.filter(u => u.kyc_status === 'pending');
  const pendingTokens = tokens.filter(t => t.status === 'pending');

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
              <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                ADMIN
              </span>
            </div>
            <div className="flex items-center gap-4">
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
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h2>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-3xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Pending KYC</p>
            <p className="text-3xl font-bold text-yellow-600">{pendingKYC.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Total Tokens</p>
            <p className="text-3xl font-bold text-gray-900">{tokens.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Pending Approval</p>
            <p className="text-3xl font-bold text-yellow-600">{pendingTokens.length}</p>
          </div>
        </div>

        {/* Pending KYC Approvals */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Pending KYC Approvals</h3>
          {pendingKYC.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingKYC.map((u) => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {u.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleKYCApproval(u.id, 'approve')}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleKYCApproval(u.id, 'reject')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No pending KYC approvals
            </div>
          )}
        </div>

        {/* Pending Token Approvals */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Pending Token Approvals</h3>
          {pendingTokens.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {pendingTokens.map((token) => (
                <div key={token.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{token.token_name}</h4>
                      <p className="text-sm text-gray-500">{token.token_symbol}</p>
                    </div>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                      Pending
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm"><span className="font-medium">Asset Type:</span> {token.asset_type}</p>
                    <p className="text-sm"><span className="font-medium">Total Supply:</span> {token.total_supply}</p>
                    <p className="text-sm"><span className="font-medium">Issuer:</span> {token.issuer_legal_name}</p>
                    <p className="text-sm"><span className="font-medium">Metadata Hash:</span> 
                      <code className="text-xs bg-gray-100 px-1 rounded">{token.metadata_hash.substring(0, 16)}...</code>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTokenApproval(token.id, 'approve')}
                      className="flex-1 px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Approve & Deploy
                    </button>
                    <button
                      onClick={() => handleTokenApproval(token.id, 'reject')}
                      className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No pending token approvals
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
