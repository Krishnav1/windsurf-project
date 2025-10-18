/**
 * Issuer Dashboard Page
 * 
 * Token issuance interface for asset issuers
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function IssuerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tokenName: '',
    tokenSymbol: '',
    assetType: 'real-estate',
    totalSupply: '',
    assetDescription: '',
    assetValuation: '',
    valuationDate: '',
    custodianName: '',
    issuerLegalName: '',
    issuerRegistrationNumber: '',
  });
  const [documents, setDocuments] = useState({
    legalDocument: null as File | null,
    valuationReport: null as File | null,
    custodyProof: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'issuer' && parsedUser.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    fetchTokens(token);
  }, []);

  const fetchTokens = async (token: string) => {
    try {
      const response = await fetch('/api/tokens/issue', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTokens(data.tokens);
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files && e.target.files[0]) {
      setDocuments({ ...documents, [field]: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      // Add documents
      if (documents.legalDocument) {
        formDataToSend.append('legalDocument', documents.legalDocument);
      }
      if (documents.valuationReport) {
        formDataToSend.append('valuationReport', documents.valuationReport);
      }
      if (documents.custodyProof) {
        formDataToSend.append('custodyProof', documents.custodyProof);
      }

      const response = await fetch('/api/tokens/issue', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit token issuance');
      }

      alert('Token issuance request submitted successfully! Awaiting admin approval.');
      setShowForm(false);
      fetchTokens(token);
      
      // Reset form
      setFormData({
        tokenName: '',
        tokenSymbol: '',
        assetType: 'real-estate',
        totalSupply: '',
        assetDescription: '',
        assetValuation: '',
        valuationDate: '',
        custodianName: '',
        issuerLegalName: '',
        issuerRegistrationNumber: '',
      });
      setDocuments({
        legalDocument: null,
        valuationReport: null,
        custodyProof: null,
      });
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
            <div className="flex items-center gap-8">
              <Link href="/">
                <h1 className="text-2xl font-bold text-[#0B67FF]">TokenPlatform</h1>
              </Link>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
                ISSUER
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
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Issuer Dashboard</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-[#0B67FF] text-white rounded-lg hover:bg-[#2D9CDB] transition-colors"
          >
            {showForm ? 'Cancel' : '+ New Token Issuance'}
          </button>
        </div>

        {/* Token Issuance Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Token Issuance Request</h3>
            
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Token Information */}
              <div className="border-b pb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Token Information</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Token Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.tokenName}
                      onChange={(e) => setFormData({ ...formData, tokenName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                      placeholder="e.g., Mumbai Office Tower Token"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Token Symbol * (3-10 uppercase letters)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.tokenSymbol}
                      onChange={(e) => setFormData({ ...formData, tokenSymbol: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                      placeholder="e.g., MBOFF"
                      pattern="[A-Z0-9]{3,10}"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asset Type *
                    </label>
                    <select
                      value={formData.assetType}
                      onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                    >
                      <option value="real-estate">Real Estate</option>
                      <option value="gold">Gold</option>
                      <option value="bonds">Bonds</option>
                      <option value="equity">Equity</option>
                      <option value="commodities">Commodities</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Supply *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.totalSupply}
                      onChange={(e) => setFormData({ ...formData, totalSupply: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                      placeholder="e.g., 1000000"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Asset Details */}
              <div className="border-b pb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Asset Details</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asset Description
                    </label>
                    <textarea
                      value={formData.assetDescription}
                      onChange={(e) => setFormData({ ...formData, assetDescription: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                      rows={4}
                      placeholder="Describe the underlying asset..."
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Asset Valuation (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.assetValuation}
                        onChange={(e) => setFormData({ ...formData, assetValuation: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                        placeholder="e.g., 50000000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valuation Date
                      </label>
                      <input
                        type="date"
                        value={formData.valuationDate}
                        onChange={(e) => setFormData({ ...formData, valuationDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custodian Name
                    </label>
                    <input
                      type="text"
                      value={formData.custodianName}
                      onChange={(e) => setFormData({ ...formData, custodianName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                      placeholder="e.g., HDFC Bank Custody Services"
                    />
                  </div>
                </div>
              </div>

              {/* Issuer Information */}
              <div className="border-b pb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Issuer Information</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Legal Entity Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.issuerLegalName}
                      onChange={(e) => setFormData({ ...formData, issuerLegalName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                      placeholder="e.g., ABC Properties Pvt Ltd"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registration Number (CIN/LLPIN)
                    </label>
                    <input
                      type="text"
                      value={formData.issuerRegistrationNumber}
                      onChange={(e) => setFormData({ ...formData, issuerRegistrationNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                      placeholder="e.g., U12345MH2020PTC123456"
                    />
                  </div>
                </div>
              </div>

              {/* Document Upload */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Supporting Documents</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Legal Documentation (PDF)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(e, 'legalDocument')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      SHA-256 hash will be computed and anchored on blockchain
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valuation Report (PDF)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(e, 'valuationReport')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custody Proof (PDF)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.png"
                      onChange={(e) => handleFileChange(e, 'custodyProof')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0B67FF] focus:border-[#0B67FF]"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-[#0B67FF] text-white rounded-lg hover:bg-[#2D9CDB] transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Token Issuance Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tokens List */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">My Token Issuances</h3>
          {tokens.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {tokens.map((token) => (
                <div key={token.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{token.token_name}</h4>
                      <p className="text-sm text-gray-500">{token.token_symbol}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded ${
                      token.status === 'active' ? 'bg-green-100 text-green-800' :
                      token.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      token.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {token.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Asset Type:</span> {token.asset_type}</p>
                    <p><span className="font-medium">Total Supply:</span> {token.total_supply.toLocaleString()}</p>
                    <p><span className="font-medium">Created:</span> {new Date(token.created_at).toLocaleDateString()}</p>
                    {token.contract_address && (
                      <p className="text-xs">
                        <span className="font-medium">Contract:</span>{' '}
                        <a
                          href={`https://mumbai.polygonscan.com/address/${token.contract_address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0B67FF] hover:text-[#2D9CDB]"
                        >
                          View on Explorer ↗
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">No token issuances yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-[#0B67FF] hover:text-[#2D9CDB]"
              >
                Create your first token →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
