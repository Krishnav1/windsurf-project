/**
 * KYC Submission Page
 * Allows users to submit KYC documents for verification
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type KYCFormData = {
  governmentIdType: string;
  governmentIdNumber: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  nationality: string;
};

export default function KYCSubmitPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<KYCFormData>({
    governmentIdType: 'aadhaar',
    governmentIdNumber: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    nationality: 'Indian',
  });
  const [documents, setDocuments] = useState({
    idProof: null as File | null,
    addressProof: null as File | null,
    photo: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));
  }, [router]);

  const handleFileChange = (field: keyof typeof documents, file: File | null) => {
    setDocuments(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // In a real implementation, you would upload files to storage
      // For sandbox, we'll just send the metadata
      const kycData = {
        ...formData,
        documents: {
          idProof: documents.idProof?.name || null,
          addressProof: documents.addressProof?.name || null,
          photo: documents.photo?.name || null,
        },
        submittedAt: new Date().toISOString(),
      };

      const response = await fetch('/api/compliance/kyc', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(kycData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'KYC submission failed');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--primary-color)]" />
          <p className="mt-4 text-sm text-[var(--muted-text)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="card-surface max-w-md p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-10 w-10 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-[var(--heading-color)]">KYC Submitted!</h2>
          <p className="mt-2 text-sm text-[var(--subtle-text)]">
            Your KYC documents have been submitted for review. You'll be notified once approved.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-lg bg-[var(--primary-color)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-color-hover)]"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <nav className="border-b border-[var(--border-subtle)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="pill badge-soft">KYC</span>
            <h1 className="text-xl font-semibold text-[var(--heading-color)]">TokenPlatform</h1>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-[var(--primary-color)] hover:text-[var(--primary-color-hover)]"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="card-surface p-8 lg:p-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--heading-color)]">KYC Verification</h1>
            <p className="mt-2 text-[var(--subtle-text)]">
              Complete your Know Your Customer (KYC) verification to start trading. All information is encrypted and stored securely in India.
            </p>
          </div>

          {/* Info Banner */}
          <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <svg className="h-5 w-5 flex-shrink-0 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-900">
                <p className="font-semibold">Sandbox Testing Note</p>
                <p className="mt-1">
                  This is a simulated KYC process for regulatory testing. In production, documents would be verified through DigiLocker API and third-party KYC providers.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--heading-color)] mb-4">Personal Information</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="governmentIdType" className="block text-sm font-medium text-[var(--muted-text)]">
                    ID Type *
                  </label>
                  <select
                    id="governmentIdType"
                    value={formData.governmentIdType}
                    onChange={(e) => setFormData({ ...formData, governmentIdType: e.target.value })}
                    className="mt-2 block w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
                    required
                  >
                    <option value="aadhaar">Aadhaar Card</option>
                    <option value="pan">PAN Card</option>
                    <option value="passport">Passport</option>
                    <option value="driving_license">Driving License</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="governmentIdNumber" className="block text-sm font-medium text-[var(--muted-text)]">
                    ID Number *
                  </label>
                  <input
                    id="governmentIdNumber"
                    type="text"
                    value={formData.governmentIdNumber}
                    onChange={(e) => setFormData({ ...formData, governmentIdNumber: e.target.value })}
                    className="mt-2 block w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
                    placeholder="Enter ID number"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-[var(--muted-text)]">
                    Date of Birth *
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="mt-2 block w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="nationality" className="block text-sm font-medium text-[var(--muted-text)]">
                    Nationality *
                  </label>
                  <input
                    id="nationality"
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="mt-2 block w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
                    required
                  />
                </div>
              </div>
            </section>

            {/* Address Information */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--heading-color)] mb-4">Address Information</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-[var(--muted-text)]">
                    Street Address *
                  </label>
                  <textarea
                    id="address"
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="mt-2 block w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
                    placeholder="Enter your full address"
                    required
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-[var(--muted-text)]">
                      City *
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="mt-2 block w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-[var(--muted-text)]">
                      State *
                    </label>
                    <input
                      id="state"
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="mt-2 block w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="pincode" className="block text-sm font-medium text-[var(--muted-text)]">
                      Pincode *
                    </label>
                    <input
                      id="pincode"
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="mt-2 block w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
                      pattern="[0-9]{6}"
                      placeholder="000000"
                      required
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Document Upload */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--heading-color)] mb-4">Document Upload</h2>
              <p className="text-sm text-[var(--muted-text)] mb-6">
                Upload clear copies of your documents. Accepted formats: JPG, PNG, PDF (Max 5MB each)
              </p>

              <div className="space-y-6">
                <div className="rounded-lg border-2 border-dashed border-[var(--border-subtle)] bg-[var(--neutral-50)] p-6">
                  <label htmlFor="idProof" className="block text-sm font-semibold text-[var(--heading-color)]">
                    ID Proof * (Aadhaar/PAN/Passport)
                  </label>
                  <input
                    id="idProof"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileChange('idProof', e.target.files?.[0] || null)}
                    className="mt-3 block w-full text-sm text-[var(--subtle-text)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--primary-color)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--primary-color-hover)]"
                    required
                  />
                  {documents.idProof && (
                    <p className="mt-2 text-xs text-green-600">✓ {documents.idProof.name}</p>
                  )}
                </div>

                <div className="rounded-lg border-2 border-dashed border-[var(--border-subtle)] bg-[var(--neutral-50)] p-6">
                  <label htmlFor="addressProof" className="block text-sm font-semibold text-[var(--heading-color)]">
                    Address Proof * (Utility Bill/Bank Statement)
                  </label>
                  <input
                    id="addressProof"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileChange('addressProof', e.target.files?.[0] || null)}
                    className="mt-3 block w-full text-sm text-[var(--subtle-text)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--primary-color)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--primary-color-hover)]"
                    required
                  />
                  {documents.addressProof && (
                    <p className="mt-2 text-xs text-green-600">✓ {documents.addressProof.name}</p>
                  )}
                </div>

                <div className="rounded-lg border-2 border-dashed border-[var(--border-subtle)] bg-[var(--neutral-50)] p-6">
                  <label htmlFor="photo" className="block text-sm font-semibold text-[var(--heading-color)]">
                    Recent Photograph *
                  </label>
                  <input
                    id="photo"
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('photo', e.target.files?.[0] || null)}
                    className="mt-3 block w-full text-sm text-[var(--subtle-text)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--primary-color)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--primary-color-hover)]"
                    required
                  />
                  {documents.photo && (
                    <p className="mt-2 text-xs text-green-600">✓ {documents.photo.name}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Declaration */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
              <h3 className="text-sm font-semibold text-amber-900">Declaration</h3>
              <p className="mt-2 text-sm text-amber-800">
                I hereby declare that the information provided above is true and correct to the best of my knowledge. I understand that providing false information may result in account suspension and legal action.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-[var(--primary-color)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--primary-color-hover)] disabled:opacity-60"
              >
                {loading ? 'Submitting...' : 'Submit KYC for Review'}
              </button>
              <Link
                href="/dashboard"
                className="rounded-lg border border-[var(--border-subtle)] px-6 py-3 text-sm font-semibold text-[var(--subtle-text)] transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
