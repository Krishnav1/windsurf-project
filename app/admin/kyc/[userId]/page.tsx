'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import DocumentPreviewModal from '@/components/DocumentPreviewModal';

export default function KYCReviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verificationForm, setVerificationForm] = useState({
    action: 'approve' as 'approve' | 'reject' | 'flag',
    comments: '',
    checklist: {
      photoMatches: false,
      namesMatch: false,
      addressVisible: false,
      notExpired: false,
      noTampering: false
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchUserKYC(token);
  }, [params.userId]);

  const fetchUserKYC = async (token: string) => {
    try {
      const response = await fetch(`/api/admin/kyc/user/${params.userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        setDocuments(data.documents);
        
        // Auto-select document from query param
        const docId = searchParams.get('doc');
        if (docId) {
          const doc = data.documents.find((d: any) => d.id === docId);
          if (doc) setSelectedDoc(doc);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const token = localStorage.getItem('token');
    if (!token || !selectedDoc) return;

    const allChecked = Object.values(verificationForm.checklist).every(v => v);
    if (verificationForm.action === 'approve' && !allChecked) {
      alert('Please complete all checklist items before approving');
      return;
    }

    if (verificationForm.action === 'reject' && !verificationForm.comments) {
      alert('Please provide rejection reason');
      return;
    }

    try {
      const response = await fetch('/api/admin/kyc/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentId: selectedDoc.id,
          action: verificationForm.action,
          comments: verificationForm.comments,
          verificationLevel: 'L1'
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        router.push('/admin/kyc');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('Failed to verify document');
    }
  };

  if (loading) {
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
            <h1 className="text-2xl font-bold text-gray-900">KYC Review: {user?.full_name}</h1>
            <button
              onClick={() => router.push('/admin/kyc')}
              className="text-[#0B67FF] hover:underline"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* User Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="text-lg font-bold mb-4">User Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{user?.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mobile</p>
                  <p className="font-medium">{user?.mobile || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">KYC Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                    user?.kyc_status === 'approved' ? 'bg-green-100 text-green-800' :
                    user?.kyc_status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user?.kyc_status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Registered</p>
                  <p className="font-medium">{new Date(user?.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold mb-3">Documents</h4>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedDoc?.id === doc.id
                          ? 'bg-[#0B67FF] text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{doc.document_type.replace('_', ' ')}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          doc.status === 'approved' ? 'bg-green-200 text-green-800' :
                          doc.status === 'rejected' ? 'bg-red-200 text-red-800' :
                          'bg-yellow-200 text-yellow-800'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedDoc ? (
              <div className="space-y-6">
                {/* Document Preview */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">{selectedDoc.document_type.replace('_', ' ')}</h3>
                    <button
                      onClick={() => setShowPreview(true)}
                      className="px-4 py-2 bg-[#0B67FF] text-white rounded-lg hover:bg-[#2D9CDB]"
                    >
                      Full Screen Preview
                    </button>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden bg-gray-100">
                    {selectedDoc.file_type?.startsWith('image/') ? (
                      <img
                        src={selectedDoc.file_url}
                        alt={selectedDoc.file_name}
                        className="w-full h-96 object-contain"
                      />
                    ) : (
                      <iframe
                        src={selectedDoc.file_url}
                        className="w-full h-96"
                        title="Document"
                      />
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">File Name</p>
                      <p className="font-medium">{selectedDoc.file_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Uploaded</p>
                      <p className="font-medium">{new Date(selectedDoc.uploaded_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">File Hash</p>
                      <p className="font-mono text-xs">{selectedDoc.file_hash?.substring(0, 16)}...</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Blockchain</p>
                      <p className={selectedDoc.blockchain_verified ? 'text-green-600' : 'text-yellow-600'}>
                        {selectedDoc.blockchain_verified ? '✓ Verified' : '⏳ Pending'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Verification Form */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold mb-4">Verification Checklist</h3>
                  
                  <div className="space-y-3 mb-6">
                    {Object.entries(verificationForm.checklist).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setVerificationForm({
                            ...verificationForm,
                            checklist: { ...verificationForm.checklist, [key]: e.target.checked }
                          })}
                          className="w-5 h-5 text-[#0B67FF] rounded"
                        />
                        <span className="text-gray-700">
                          {key === 'photoMatches' && 'Photo matches selfie'}
                          {key === 'namesMatch' && 'Names match across documents'}
                          {key === 'addressVisible' && 'Address clearly visible'}
                          {key === 'notExpired' && 'Document not expired'}
                          {key === 'noTampering' && 'No signs of tampering'}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Action
                    </label>
                    <div className="flex gap-4">
                      {(['approve', 'reject', 'flag'] as const).map((action) => (
                        <label key={action} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="action"
                            value={action}
                            checked={verificationForm.action === action}
                            onChange={(e) => setVerificationForm({
                              ...verificationForm,
                              action: e.target.value as any
                            })}
                            className="w-4 h-4"
                          />
                          <span className="capitalize">{action}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments {verificationForm.action === 'reject' && <span className="text-red-600">*</span>}
                    </label>
                    <textarea
                      value={verificationForm.comments}
                      onChange={(e) => setVerificationForm({ ...verificationForm, comments: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B67FF]"
                      placeholder={verificationForm.action === 'reject' ? 'Provide rejection reason...' : 'Optional notes...'}
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleVerify}
                      className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white ${
                        verificationForm.action === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                        verificationForm.action === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                        'bg-yellow-600 hover:bg-yellow-700'
                      }`}
                    >
                      {verificationForm.action === 'approve' ? 'Approve Document' :
                       verificationForm.action === 'reject' ? 'Reject Document' :
                       'Flag for Review'}
                    </button>
                    <button
                      onClick={() => router.push('/admin/kyc')}
                      className="px-6 py-3 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">Select a document to review</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        document={selectedDoc}
      />
    </div>
  );
}
