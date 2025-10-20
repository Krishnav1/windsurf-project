'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminKYCDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    page: 1
  });
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'admin') {
      router.push('/auth/login');
      return;
    }

    fetchSubmissions(token);
  }, [filters]);

  const fetchSubmissions = async (token: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: filters.status,
        search: filters.search,
        page: filters.page.toString()
      });

      const response = await fetch(`/api/admin/kyc/documents?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    const token = localStorage.getItem('token');
    if (!token || selectedDocs.length === 0) return;

    const comments = action === 'reject' 
      ? prompt('Enter rejection reason:')
      : 'Bulk approved by admin';

    if (action === 'reject' && !comments) return;

    try {
      const response = await fetch('/api/admin/kyc/bulk-action', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentIds: selectedDocs,
          action,
          comments
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setSelectedDocs([]);
        setShowBulkModal(false);
        fetchSubmissions(token);
      }
    } catch (error) {
      console.error('Bulk action error:', error);
    }
  };

  const toggleDocSelection = (docId: string) => {
    setSelectedDocs(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">KYC Verification Dashboard</h1>
            <Link href="/admin/dashboard" className="text-[#0B67FF] hover:underline">
              ← Back to Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="px-4 py-2 border rounded-lg w-64"
              />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>

            {selectedDocs.length > 0 && (
              <div className="flex gap-2">
                <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg">
                  {selectedDocs.length} selected
                </span>
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Bulk Approve
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Bulk Reject
                </button>
                <button
                  onClick={() => setSelectedDocs([])}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B67FF] mx-auto"></div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No KYC submissions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission: any) => (
              <div key={submission.user.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{submission.user.full_name}</h3>
                    <p className="text-sm text-gray-600">{submission.user.email}</p>
                    <p className="text-sm text-gray-500">Mobile: {submission.user.mobile || 'N/A'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    submission.user.kyc_status === 'approved' ? 'bg-green-100 text-green-800' :
                    submission.user.kyc_status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {submission.user.kyc_status}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {submission.documents.map((doc: any) => (
                    <div key={doc.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <input
                          type="checkbox"
                          checked={selectedDocs.includes(doc.id)}
                          onChange={() => toggleDocSelection(doc.id)}
                          className="w-4 h-4"
                        />
                        <span className={`text-xs px-2 py-1 rounded ${
                          doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                          doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                      <p className="font-medium text-sm mb-2">{doc.document_type.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-500 mb-3">{doc.file_name}</p>
                      <Link
                        href={`/admin/kyc/${submission.user.id}?doc=${doc.id}`}
                        className="block text-center px-3 py-2 bg-[#0B67FF] text-white text-sm rounded hover:bg-[#2D9CDB]"
                      >
                        Review
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
