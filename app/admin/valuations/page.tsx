'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

interface Valuation {
  id: string;
  token_id: string;
  valuation_date: string;
  valuation_amount: number;
  previous_valuation_amount: number | null;
  change_percentage: number | null;
  valuation_agency: string;
  valuer_name: string;
  valuer_registration_no: string;
  methodology: string;
  report_document_url: string | null;
  status: string;
  created_at: string;
  tokens: {
    token_symbol: string;
    token_name: string;
    issuer_id: string;
    current_price: number | null;
    total_supply: number;
  };
}

export default function AdminValuationsPage() {
  const router = useRouter();
  const { token, user, loading: authLoading } = useAuth('admin');
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedValuation, setSelectedValuation] = useState<Valuation | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    if (authLoading || !token) return;
    fetchValuations(token, statusFilter);
  }, [token, authLoading, statusFilter]);

  const fetchValuations = async (authToken: string, status: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/approve-valuation?status=${status}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (data.success) {
        setValuations(data.valuations);
      }
    } catch (error) {
      console.error('Error fetching valuations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedValuation || !token) return;

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/approve-valuation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valuationId: selectedValuation.id,
          action: reviewAction,
          reviewNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process valuation');
      }

      setSuccess(data.message);
      setShowReviewModal(false);
      setSelectedValuation(null);
      setReviewNotes('');
      fetchValuations(token, statusFilter);

    } catch (err: any) {
      setError(err.message || 'Failed to process valuation');
    } finally {
      setSubmitting(false);
    }
  };

  const openReviewModal = (valuation: Valuation, action: 'approve' | 'reject') => {
    setSelectedValuation(valuation);
    setReviewAction(action);
    setShowReviewModal(true);
    setError('');
    setSuccess('');
  };

  const calculateNewPrice = (valuation: Valuation) => {
    return valuation.valuation_amount / valuation.tokens.total_supply;
  };

  const requiresIFSCA = (valuation: Valuation) => {
    return Math.abs(valuation.change_percentage || 0) > 20;
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Valuation Review</h1>
            <Link href="/admin/dashboard" className="text-[#0B67FF] hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Status Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2">
            {['pending', 'approved', 'rejected', 'under_review'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  statusFilter === status
                    ? 'bg-[#0B67FF] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Valuations Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">
              {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Valuations
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Token</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valuation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">New Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IFSCA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {valuations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No {statusFilter} valuations found
                    </td>
                  </tr>
                ) : (
                  valuations.map((val) => (
                    <tr key={val.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">{val.tokens.token_symbol}</div>
                          <div className="text-sm text-gray-500">{val.tokens.token_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(val.valuation_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium">₹{val.valuation_amount.toLocaleString()}</div>
                          {val.previous_valuation_amount && (
                            <div className="text-sm text-gray-500">
                              Prev: ₹{val.previous_valuation_amount.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {val.change_percentage !== null ? (
                          <span className={`font-medium ${
                            val.change_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {val.change_percentage >= 0 ? '+' : ''}{val.change_percentage.toFixed(2)}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium">₹{calculateNewPrice(val).toFixed(2)}</div>
                          {val.tokens.current_price && (
                            <div className="text-sm text-gray-500">
                              Current: ₹{val.tokens.current_price.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm">{val.valuation_agency}</div>
                          <div className="text-xs text-gray-500">{val.valuer_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {requiresIFSCA(val) ? (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                            Required
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Not Required
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {val.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => openReviewModal(val, 'approve')}
                              className="text-green-600 hover:text-green-800 font-medium text-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openReviewModal(val, 'reject')}
                              className="text-red-600 hover:text-red-800 font-medium text-sm"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {val.report_document_url && (
                          <a
                            href={val.report_document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0B67FF] hover:underline text-sm block mt-1"
                          >
                            View Report
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedValuation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Valuation
            </h2>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Token</p>
                  <p className="font-medium">{selectedValuation.tokens.token_symbol}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valuation Date</p>
                  <p className="font-medium">
                    {new Date(selectedValuation.valuation_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valuation Amount</p>
                  <p className="font-medium">₹{selectedValuation.valuation_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Change</p>
                  <p className={`font-medium ${
                    (selectedValuation.change_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedValuation.change_percentage !== null
                      ? `${selectedValuation.change_percentage >= 0 ? '+' : ''}${selectedValuation.change_percentage.toFixed(2)}%`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">New Price per Token</p>
                  <p className="font-medium">₹{calculateNewPrice(selectedValuation).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valuation Agency</p>
                  <p className="font-medium">{selectedValuation.valuation_agency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valuer</p>
                  <p className="font-medium">{selectedValuation.valuer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Registration No</p>
                  <p className="font-medium">{selectedValuation.valuer_registration_no}</p>
                </div>
              </div>

              {requiresIFSCA(selectedValuation) && reviewAction === 'approve' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-orange-800 font-medium">⚠️ IFSCA Approval Required</p>
                  <p className="text-orange-600 text-sm mt-1">
                    Price change exceeds 20% threshold. This will require IFSCA approval before price update.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Notes {reviewAction === 'reject' && '*'}
                </label>
                <textarea
                  rows={4}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  required={reviewAction === 'reject'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF]"
                  placeholder={
                    reviewAction === 'approve'
                      ? 'Optional notes about the approval...'
                      : 'Reason for rejection (required)...'
                  }
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleReview}
                disabled={submitting || (reviewAction === 'reject' && !reviewNotes.trim())}
                className={`px-6 py-3 rounded-lg font-medium disabled:opacity-50 ${
                  reviewAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {submitting ? 'Processing...' : `Confirm ${reviewAction === 'approve' ? 'Approval' : 'Rejection'}`}
              </button>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedValuation(null);
                  setReviewNotes('');
                }}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
