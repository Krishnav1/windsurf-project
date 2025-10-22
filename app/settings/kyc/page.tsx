'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import InvestorNav from '@/components/InvestorNav';
import Link from 'next/link';

export default function KYCPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [documents, setDocuments] = useState({
    idProof: null as File | null,
    addressProof: null as File | null,
    panCard: null as File | null,
    photo: null as File | null,
  });
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchKYCStatus(token);
  }, []);

  const fetchKYCStatus = async (token: string) => {
    try {
      const [statusRes, docsRes] = await Promise.all([
        fetch('/api/compliance/kyc', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/compliance/kyc-documents', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
      ]);

      const statusData = await statusRes.json();
      const docsData = await docsRes.json();
      
      setKycStatus(statusData);
      if (docsData.success) {
        setUploadedDocs(docsData.documents);
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (field: keyof typeof documents, file: File | null) => {
    setDocuments({ ...documents, [field]: file });
  };

  const handleDeleteDocument = async (documentId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!confirm('Are you sure you want to delete this document? You will need to upload a new one.')) {
      return;
    }

    try {
      const response = await fetch(`/api/compliance/kyc-documents?id=${documentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        alert('Document deleted successfully');
        fetchKYCStatus(token);
      } else {
        alert(data.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    setUploading(true);
    setUploadProgress('Preparing documents...');
    setUploadError('');
    
    const formData = new FormData();
    let docCount = 0;
    
    if (documents.idProof) { formData.append('idProof', documents.idProof); docCount++; }
    if (documents.addressProof) { formData.append('addressProof', documents.addressProof); docCount++; }
    if (documents.panCard) { formData.append('panCard', documents.panCard); docCount++; }
    if (documents.photo) { formData.append('photo', documents.photo); docCount++; }

    if (docCount === 0) {
      setUploadError('Please select at least one document to upload');
      setUploading(false);
      return;
    }

    try {
      setUploadProgress(`Uploading ${docCount} document(s)...`);
      
      const response = await fetch('/api/compliance/kyc-submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setUploadProgress('✓ Upload complete! Encrypting and storing on IPFS...');
        
        // Show success message with details
        setTimeout(() => {
          alert(
            `✅ KYC documents submitted successfully!\n\n` +
            `• ${data.uploadedCount} document(s) uploaded\n` +
            `• Encrypted and stored on IPFS\n` +
            `• Upload time: ${(data.duration / 1000).toFixed(2)}s\n\n` +
            `You have 15 minutes to edit or delete if needed.`
          );
          
          setDocuments({
            idProof: null,
            addressProof: null,
            panCard: null,
            photo: null,
          });
          setUploadProgress('');
          fetchKYCStatus(token);
        }, 1000);
      } else {
        setUploadError(data.error || data.details || 'Failed to submit KYC');
        setUploadProgress('');
      }
    } catch (error) {
      console.error('Error submitting KYC:', error);
      setUploadError(`Network error: ${(error as Error).message}`);
      setUploadProgress('');
    } finally {
      setUploading(false);
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">KYC Verification</h2>
          <p className="text-gray-600 mt-2">Complete your KYC to start trading tokenized assets</p>
        </div>

        {/* KYC Status Card */}
        <div className={`rounded-lg shadow p-6 mb-6 ${
          kycStatus?.kycStatus === 'approved' ? 'bg-green-50 border-2 border-green-200' :
          kycStatus?.kycStatus === 'rejected' ? 'bg-red-50 border-2 border-red-200' :
          'bg-yellow-50 border-2 border-yellow-200'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
              kycStatus?.kycStatus === 'approved' ? 'bg-green-200' :
              kycStatus?.kycStatus === 'rejected' ? 'bg-red-200' :
              'bg-yellow-200'
            }`}>
              {kycStatus?.kycStatus === 'approved' ? (
                <svg className="w-6 h-6 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : kycStatus?.kycStatus === 'rejected' ? (
                <svg className="w-6 h-6 text-red-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-yellow-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-bold mb-2 ${
                kycStatus?.kycStatus === 'approved' ? 'text-green-900' :
                kycStatus?.kycStatus === 'rejected' ? 'text-red-900' :
                'text-yellow-900'
              }`}>
                {kycStatus?.kycStatus === 'approved' ? 'KYC Verified ✓' :
                 kycStatus?.kycStatus === 'rejected' ? 'KYC Rejected' :
                 'KYC Pending Verification'}
              </h3>
              <p className={`text-sm ${
                kycStatus?.kycStatus === 'approved' ? 'text-green-800' :
                kycStatus?.kycStatus === 'rejected' ? 'text-red-800' :
                'text-yellow-800'
              }`}>
                {kycStatus?.kycStatus === 'approved' 
                  ? 'Your account is fully verified. You can now trade tokenized assets.'
                  : kycStatus?.kycStatus === 'rejected'
                  ? 'Your KYC submission was rejected. Please review the feedback and resubmit with correct documents.'
                  : 'Your KYC documents are under review. This typically takes 24-48 hours.'}
              </p>
              {kycStatus?.lastUpdated && (
                <p className="text-xs text-gray-600 mt-2">
                  Last updated: {new Date(kycStatus.lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Uploaded Documents with Edit Window */}
        {uploadedDocs.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Uploaded Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadedDocs.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{doc.document_type.replace('_', ' ').toUpperCase()}</p>
                      <p className="text-xs text-gray-500">{doc.file_name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                      doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    Uploaded: {new Date(doc.uploaded_at).toLocaleString()}
                  </p>
                  {doc.canEdit && (
                    <div className="mt-3 p-2 bg-blue-50 rounded">
                      <p className="text-xs text-blue-800 mb-2">
                        ⏱️ You can delete this document for the next {doc.remainingMinutes} minute{doc.remainingMinutes !== 1 ? 's' : ''}
                      </p>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete Document
                      </button>
                    </div>
                  )}
                  {doc.editWindowExpired && (
                    <p className="text-xs text-gray-500 mt-2">
                      🔒 Edit window expired (15 min limit)
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document Upload Form */}
        {kycStatus?.kycStatus !== 'approved' && (uploadedDocs.length === 0 || kycStatus?.kycStatus === 'rejected') && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {kycStatus?.kycStatus === 'rejected' ? 'Resubmit KYC Documents' : 'Submit KYC Documents'}
            </h3>
            {kycStatus?.kycStatus === 'rejected' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-800">
                  ⚠️ <strong>Rejection Notice:</strong> Your previous submission was rejected. Please review the feedback and upload correct documents.
                </p>
              </div>
            )}
            {uploadedDocs.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Note:</strong> You have 15 minutes after upload to delete and re-upload documents if you made a mistake.
                </p>
              </div>
            )}

            {/* Upload Progress */}
            {uploadProgress && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <p className="text-sm font-medium text-blue-800">{uploadProgress}</p>
                </div>
              </div>
            )}

            {/* Upload Error */}
            {uploadError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">Upload Failed</p>
                    <p className="text-sm text-red-700 mt-1">{uploadError}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ID Proof */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Proof (Aadhaar/Passport) *
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('idProof', e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF] focus:border-transparent"
                  required={!kycStatus?.submission}
                />
                <p className="text-xs text-gray-500 mt-1">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
              </div>

              {/* Address Proof */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Proof (Utility Bill/Bank Statement) *
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('addressProof', e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF] focus:border-transparent"
                  required={!kycStatus?.submission}
                />
                <p className="text-xs text-gray-500 mt-1">Document should not be older than 3 months</p>
              </div>

              {/* PAN Card */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PAN Card *
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('panCard', e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF] focus:border-transparent"
                  required={!kycStatus?.submission}
                />
                <p className="text-xs text-gray-500 mt-1">Clear image of your PAN card</p>
              </div>

              {/* Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photograph *
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('photo', e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF] focus:border-transparent"
                  required={!kycStatus?.submission}
                />
                <p className="text-xs text-gray-500 mt-1">Recent passport-size photograph</p>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-3 bg-[#0B67FF] text-white rounded-lg font-semibold hover:bg-[#2D9CDB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Submit Documents'}
                </button>
                <Link
                  href="/dashboard"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        )}

        {/* Requirements Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-3">KYC Requirements</h4>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>All documents must be clear and legible</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Documents should be in color (not black & white)</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>All four corners of the document must be visible</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Verification typically takes 24-48 hours</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>You'll receive an email notification once verified</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
