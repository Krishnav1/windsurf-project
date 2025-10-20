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
  const [activeTab, setActiveTab] = useState<string>('aadhaar');
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
        
        // Auto-select document from query param or first document
        const docId = searchParams.get('doc');
        if (docId) {
          const doc = data.documents.find((d: any) => d.id === docId);
          if (doc) {
            setSelectedDoc(doc);
            setActiveTab(doc.document_type);
          }
        } else if (data.documents.length > 0) {
          setSelectedDoc(data.documents[0]);
          setActiveTab(data.documents[0].document_type);
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
            {/* Document Tabs */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="border-b">
                <nav className="flex -mb-px">
                  {['aadhaar', 'pan', 'address_proof', 'photo'].map((docType) => {
                    const doc = documents.find(d => d.document_type === docType);
                    return (
                      <button
                        key={docType}
                        onClick={() => {
                          if (doc) {
                            setSelectedDoc(doc);
                            setActiveTab(docType);
                          }
                        }}
                        disabled={!doc}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === docType
                            ? 'border-[#0B67FF] text-[#0B67FF]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } ${!doc ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {docType === 'aadhaar' && '🆔 Aadhaar'}
                        {docType === 'pan' && '💳 PAN Card'}
                        {docType === 'address_proof' && '🏠 Address Proof'}
                        {docType === 'photo' && '📸 Photo'}
                        {doc && (
                          <span className={`ml-2 inline-block w-2 h-2 rounded-full ${
                            doc.status === 'approved' ? 'bg-green-500' :
                            doc.status === 'rejected' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`} />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

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
                      <p className="text-gray-500">File Size</p>
                      <p className="font-medium">{(selectedDoc.file_size / 1024).toFixed(2)} KB</p>
                    </div>
                    <div>
                      <p className="text-gray-500">File Type</p>
                      <p className="font-medium">{selectedDoc.file_type}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Uploaded</p>
                      <p className="font-medium">{new Date(selectedDoc.uploaded_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">File Hash</p>
                      <p className="font-mono text-xs">{selectedDoc.file_hash?.substring(0, 20)}...</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Blockchain Status</p>
                      <p className={selectedDoc.blockchain_verified ? 'text-green-600 font-medium' : 'text-yellow-600'}>
                        {selectedDoc.blockchain_verified ? '✓ Verified on Chain' : '⏳ Pending Verification'}
                      </p>
                    </div>
                  </div>

                  {/* Document-Specific Info */}
                  {selectedDoc.document_type === 'aadhaar' && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Aadhaar Verification Points</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>✓ Check photo clarity and matches selfie</li>
                        <li>✓ Verify name matches across all documents</li>
                        <li>✓ Ensure address is clearly visible</li>
                        <li>✓ Check for any signs of tampering</li>
                        <li>✓ Verify Aadhaar number format (12 digits)</li>
                      </ul>
                    </div>
                  )}

                  {selectedDoc.document_type === 'pan' && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-900 mb-2">PAN Card Verification Points</h4>
                      <ul className="text-sm text-purple-800 space-y-1">
                        <li>✓ Verify PAN number format (AAAAA9999A)</li>
                        <li>✓ Check name matches Aadhaar</li>
                        <li>✓ Verify date of birth</li>
                        <li>✓ Check signature is present</li>
                        <li>✓ Ensure no tampering or alterations</li>
                      </ul>
                    </div>
                  )}

                  {selectedDoc.document_type === 'address_proof' && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Address Proof Verification</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>✓ Address clearly visible and readable</li>
                        <li>✓ Document not older than 3 months</li>
                        <li>✓ Name matches other documents</li>
                        <li>✓ Official letterhead/stamp present</li>
                      </ul>
                    </div>
                  )}

                  {selectedDoc.document_type === 'photo' && (
                    <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-semibold text-orange-900 mb-2">Photo Verification</h4>
                      <ul className="text-sm text-orange-800 space-y-1">
                        <li>✓ Clear, recent photo</li>
                        <li>✓ Face clearly visible</li>
                        <li>✓ Matches photo on Aadhaar/PAN</li>
                        <li>✓ No sunglasses or face covering</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Verification Form */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold mb-4">Document Verification Checklist</h3>
                  
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Current Document:</strong> {selectedDoc.document_type.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Status:</strong> <span className={`font-medium ${
                        selectedDoc.status === 'approved' ? 'text-green-600' :
                        selectedDoc.status === 'rejected' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>{selectedDoc.status}</span>
                    </p>
                  </div>

                  <div className="space-y-3 mb-6">
                    {Object.entries(verificationForm.checklist).map(([key, value]) => (
                      <label key={key} className="flex items-start gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setVerificationForm({
                            ...verificationForm,
                            checklist: { ...verificationForm.checklist, [key]: e.target.checked }
                          })}
                          className="w-5 h-5 text-[#0B67FF] rounded mt-0.5"
                        />
                        <div>
                          <span className="text-gray-700 font-medium block">
                            {key === 'photoMatches' && 'Photo matches selfie'}
                            {key === 'namesMatch' && 'Names match across documents'}
                            {key === 'addressVisible' && 'Address clearly visible'}
                            {key === 'notExpired' && 'Document not expired'}
                            {key === 'noTampering' && 'No signs of tampering'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {key === 'photoMatches' && 'Compare photo with selfie document'}
                            {key === 'namesMatch' && 'Verify name consistency across all documents'}
                            {key === 'addressVisible' && 'Ensure address is legible and complete'}
                            {key === 'notExpired' && 'Check document validity period'}
                            {key === 'noTampering' && 'Look for alterations, cuts, or edits'}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>⚠️ Note:</strong> All checklist items must be verified before approving this document.
                    </p>
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
