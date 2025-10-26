'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

interface Token {
  id: string;
  token_symbol: string;
  token_name: string;
  current_price: number | null;
  last_valuation_date: string | null;
  next_valuation_due: string | null;
  asset_valuation: number | null;
}

interface Valuation {
  id: string;
  valuation_date: string;
  valuation_amount: number;
  change_percentage: number | null;
  valuation_agency: string;
  valuer_name: string;
  status: string;
  created_at: string;
}

export default function IssuerValuationsPage() {
  const router = useRouter();
  const { token, user, loading: authLoading } = useAuth('issuer');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    valuationDate: '',
    valuationAmount: '',
    valuationAgency: '',
    valuerName: '',
    valuerRegistrationNo: '',
    valuerContactEmail: '',
    valuerContactPhone: '',
    methodology: 'DCF',
    methodologyDescription: '',
    marketConditions: '',
    assumptions: '',
    submissionNotes: '',
  });

  const [files, setFiles] = useState({
    valuationReport: null as File | null,
    valuationCertificate: null as File | null,
  });

  useEffect(() => {
    if (authLoading || !token) return;
    fetchTokens(token);
  }, [token, authLoading]);

  useEffect(() => {
    if (selectedToken && token) {
      fetchValuations(selectedToken, token);
    }
  }, [selectedToken, token]);

  const fetchTokens = async (authToken: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/tokens/issue', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (data.success) {
        const activeTokens = data.tokens.filter((t: any) => t.status === 'active' || t.status === 'approved');
        setTokens(activeTokens);
        if (activeTokens.length > 0) {
          setSelectedToken(activeTokens[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchValuations = async (tokenId: string, authToken: string) => {
    try {
      const response = await fetch(`/api/issuer/submit-valuation?tokenId=${tokenId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (data.success) {
        setValuations(data.valuations);
      }
    } catch (error) {
      console.error('Error fetching valuations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    if (!token) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('tokenId', selectedToken);
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      if (files.valuationReport) {
        formDataToSend.append('valuationReport', files.valuationReport);
      }
      if (files.valuationCertificate) {
        formDataToSend.append('valuationCertificate', files.valuationCertificate);
      }

      const response = await fetch('/api/issuer/submit-valuation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit valuation');
      }

      setSuccess('Valuation submitted successfully! Awaiting admin review.');
      setShowForm(false);
      fetchValuations(selectedToken, token);
      
      // Reset form
      setFormData({
        valuationDate: '',
        valuationAmount: '',
        valuationAgency: '',
        valuerName: '',
        valuerRegistrationNo: '',
        valuerContactEmail: '',
        valuerContactPhone: '',
        methodology: 'DCF',
        methodologyDescription: '',
        marketConditions: '',
        assumptions: '',
        submissionNotes: '',
      });
      setFiles({ valuationReport: null, valuationCertificate: null });

    } catch (err: any) {
      setError(err.message || 'Failed to submit valuation');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTokenData = tokens.find(t => t.id === selectedToken);
  const isValuationOverdue = selectedTokenData?.next_valuation_due 
    ? new Date(selectedTokenData.next_valuation_due) < new Date() 
    : false;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B67FF]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Token Valuations</h1>
            <Link href="/issuer/dashboard" className="text-[#0B67FF] hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Token Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Token
          </label>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF] focus:border-transparent"
          >
            {tokens.map(token => (
              <option key={token.id} value={token.id}>
                {token.token_symbol} - {token.token_name}
              </option>
            ))}
          </select>

          {selectedTokenData && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Current Price</p>
                <p className="text-lg font-semibold">
                  ₹{selectedTokenData.current_price?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Valuation</p>
                <p className="text-lg font-semibold">
                  {selectedTokenData.last_valuation_date 
                    ? new Date(selectedTokenData.last_valuation_date).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Next Due</p>
                <p className={`text-lg font-semibold ${isValuationOverdue ? 'text-red-600' : ''}`}>
                  {selectedTokenData.next_valuation_due 
                    ? new Date(selectedTokenData.next_valuation_due).toLocaleDateString()
                    : 'Not set'}
                  {isValuationOverdue && ' (Overdue)'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Asset Valuation</p>
                <p className="text-lg font-semibold">
                  ₹{selectedTokenData.asset_valuation?.toLocaleString() || 'N/A'}
                </p>
              </div>
            </div>
          )}

          {isValuationOverdue && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">⚠️ Valuation Overdue</p>
              <p className="text-red-600 text-sm mt-1">
                Quarterly valuation is overdue. Please submit a new valuation report immediately.
              </p>
            </div>
          )}
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Submit New Valuation Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 bg-[#0B67FF] text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            + Submit New Valuation
          </button>
        )}

        {/* Valuation Submission Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Submit New Valuation</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕ Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valuation Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.valuationDate}
                    onChange={(e) => setFormData({...formData, valuationDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valuation Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.valuationAmount}
                    onChange={(e) => setFormData({...formData, valuationAmount: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valuation Agency *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.valuationAgency}
                    onChange={(e) => setFormData({...formData, valuationAgency: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valuer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.valuerName}
                    onChange={(e) => setFormData({...formData, valuerName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valuer Registration No *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.valuerRegistrationNo}
                    onChange={(e) => setFormData({...formData, valuerRegistrationNo: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valuer Email
                  </label>
                  <input
                    type="email"
                    value={formData.valuerContactEmail}
                    onChange={(e) => setFormData({...formData, valuerContactEmail: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valuer Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.valuerContactPhone}
                    onChange={(e) => setFormData({...formData, valuerContactPhone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Methodology *
                  </label>
                  <select
                    required
                    value={formData.methodology}
                    onChange={(e) => setFormData({...formData, methodology: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF]"
                  >
                    <option value="DCF">Discounted Cash Flow (DCF)</option>
                    <option value="Comparable Sales">Comparable Sales</option>
                    <option value="Cost Approach">Cost Approach</option>
                    <option value="Income Approach">Income Approach</option>
                    <option value="Market Value">Market Value</option>
                    <option value="NAV">Net Asset Value (NAV)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Methodology Description
                </label>
                <textarea
                  rows={3}
                  value={formData.methodologyDescription}
                  onChange={(e) => setFormData({...formData, methodologyDescription: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF]"
                  placeholder="Describe the valuation methodology used..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Market Conditions
                </label>
                <textarea
                  rows={3}
                  value={formData.marketConditions}
                  onChange={(e) => setFormData({...formData, marketConditions: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF]"
                  placeholder="Describe current market conditions affecting valuation..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Assumptions (JSON format or text)
                </label>
                <textarea
                  rows={4}
                  value={formData.assumptions}
                  onChange={(e) => setFormData({...formData, assumptions: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF]"
                  placeholder='{"discount_rate": "10%", "growth_rate": "5%", ...}'
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valuation Report * (PDF)
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf"
                  onChange={(e) => setFiles({...files, valuationReport: e.target.files?.[0] || null})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valuation Certificate (PDF)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFiles({...files, valuationCertificate: e.target.files?.[0] || null})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Submission Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.submissionNotes}
                  onChange={(e) => setFormData({...formData, submissionNotes: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF]"
                  placeholder="Any additional notes for the admin..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#0B67FF] text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Valuation'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Valuation History */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Valuation History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valuer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {valuations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No valuations submitted yet
                    </td>
                  </tr>
                ) : (
                  valuations.map((val) => (
                    <tr key={val.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(val.valuation_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        ₹{val.valuation_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {val.change_percentage !== null ? (
                          <span className={val.change_percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {val.change_percentage >= 0 ? '+' : ''}{val.change_percentage.toFixed(2)}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4">{val.valuation_agency}</td>
                      <td className="px-6 py-4">{val.valuer_name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          val.status === 'approved' ? 'bg-green-100 text-green-800' :
                          val.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          val.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {val.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(val.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
