/**
 * Grievance Portal
 * User support and complaint submission system
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type GrievanceFormData = {
  issueType: string;
  subject: string;
  description: string;
  priority: string;
};

export default function GrievancePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<GrievanceFormData>({
    issueType: 'transaction',
    subject: '',
    description: '',
    priority: 'medium',
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ticketId, setTicketId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
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

      // In production, upload files to storage first
      const grievanceData = {
        ...formData,
        attachments: attachments.map(f => f.name),
        submittedAt: new Date().toISOString(),
      };

      const response = await fetch('/api/support/grievance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(grievanceData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit grievance');
      }

      setTicketId(data.ticketId || 'GRV-' + Date.now());
      setSuccess(true);
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
          <h2 className="mt-4 text-2xl font-semibold text-[var(--heading-color)]">Grievance Submitted</h2>
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">Ticket ID</p>
            <p className="mt-1 font-mono text-lg font-bold text-blue-700">{ticketId}</p>
          </div>
          <p className="mt-4 text-sm text-[var(--subtle-text)]">
            Your grievance has been submitted successfully. Our support team will review and respond within 48 hours.
          </p>
          <p className="mt-2 text-xs text-[var(--muted-text)]">
            You'll receive updates via email at <strong>{user.email}</strong>
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
            <span className="pill badge-soft">Support</span>
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
            <h1 className="text-3xl font-bold text-[var(--heading-color)]">Grievance & Support Portal</h1>
            <p className="mt-2 text-[var(--subtle-text)]">
              Report issues, submit complaints, or request assistance. Our team is here to help.
            </p>
          </div>

          {/* Info Banner */}
          <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <svg className="h-5 w-5 flex-shrink-0 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-900">
                <p className="font-semibold">Response Time</p>
                <p className="mt-1">
                  We aim to respond to all grievances within 48 hours. Critical issues are prioritized and addressed immediately.
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
            {/* Issue Type */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--heading-color)] mb-4">Issue Details</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="issueType" className="block text-sm font-medium text-[var(--muted-text)]">
                    Issue Type *
                  </label>
                  <select
                    id="issueType"
                    value={formData.issueType}
                    onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                    className="mt-2 block w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
                    required
                  >
                    <option value="kyc">KYC/Verification Issue</option>
                    <option value="transaction">Transaction Problem</option>
                    <option value="account">Account Access</option>
                    <option value="trading">Trading/Orders</option>
                    <option value="technical">Technical Issue</option>
                    <option value="compliance">Compliance Query</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-[var(--muted-text)]">
                    Priority *
                  </label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="mt-2 block w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
                    required
                  >
                    <option value="low">Low - General inquiry</option>
                    <option value="medium">Medium - Standard issue</option>
                    <option value="high">High - Urgent matter</option>
                    <option value="critical">Critical - Immediate attention needed</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Subject & Description */}
            <section>
              <div className="space-y-6">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-[var(--muted-text)]">
                    Subject *
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="mt-2 block w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
                    placeholder="Brief summary of your issue"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-[var(--muted-text)]">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-2 block w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-surface)]"
                    placeholder="Please provide detailed information about your issue, including any error messages, transaction IDs, or relevant details..."
                    required
                  />
                  <p className="mt-2 text-xs text-[var(--muted-text)]">
                    Minimum 20 characters. Be as specific as possible to help us resolve your issue quickly.
                  </p>
                </div>
              </div>
            </section>

            {/* Attachments */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--heading-color)] mb-4">Attachments (Optional)</h2>
              <div className="rounded-lg border-2 border-dashed border-[var(--border-subtle)] bg-[var(--neutral-50)] p-6">
                <label htmlFor="attachments" className="block text-sm font-semibold text-[var(--heading-color)]">
                  Upload Supporting Documents
                </label>
                <p className="mt-1 text-xs text-[var(--muted-text)]">
                  Screenshots, error logs, or any relevant files (Max 5MB each, up to 3 files)
                </p>
                <input
                  id="attachments"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.txt,.log"
                  multiple
                  onChange={handleFileChange}
                  className="mt-3 block w-full text-sm text-[var(--subtle-text)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--primary-color)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--primary-color-hover)]"
                />
                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((file, index) => (
                      <p key={index} className="text-xs text-green-600">✓ {file.name}</p>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* User Info Display */}
            <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--neutral-50)] p-6">
              <h3 className="text-sm font-semibold text-[var(--heading-color)]">Your Contact Information</h3>
              <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-[var(--muted-text)]">Name:</dt>
                  <dd className="font-semibold text-[var(--foreground)]">{user.fullName || user.full_name}</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted-text)]">Email:</dt>
                  <dd className="font-semibold text-[var(--foreground)]">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted-text)]">User ID:</dt>
                  <dd className="font-mono text-xs font-semibold text-[var(--foreground)]">{user.id.slice(0, 8)}...</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted-text)]">Role:</dt>
                  <dd className="font-semibold capitalize text-[var(--foreground)]">{user.role}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-[var(--muted-text)]">
                We'll use this information to contact you regarding your grievance.
              </p>
            </section>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || formData.description.length < 20}
                className="flex-1 rounded-lg bg-[var(--primary-color)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--primary-color-hover)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Grievance'}
              </button>
              <Link
                href="/dashboard"
                className="rounded-lg border border-[var(--border-subtle)] px-6 py-3 text-sm font-semibold text-[var(--subtle-text)] transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
              >
                Cancel
              </Link>
            </div>
          </form>

          {/* Help Section */}
          <div className="mt-12 border-t border-[var(--border-subtle)] pt-8">
            <h3 className="text-lg font-semibold text-[var(--heading-color)]">Need Immediate Help?</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-[var(--border-subtle)] bg-white p-4">
                <p className="font-semibold text-[var(--heading-color)]">📧 Email Support</p>
                <p className="mt-2 text-sm text-[var(--subtle-text)]">support@tokenplatform.test</p>
              </div>
              <div className="rounded-lg border border-[var(--border-subtle)] bg-white p-4">
                <p className="font-semibold text-[var(--heading-color)]">📞 Compliance Team</p>
                <p className="mt-2 text-sm text-[var(--subtle-text)]">compliance@tokenplatform.test</p>
              </div>
              <div className="rounded-lg border border-[var(--border-subtle)] bg-white p-4">
                <p className="font-semibold text-[var(--heading-color)]">🔒 Security Issues</p>
                <p className="mt-2 text-sm text-[var(--subtle-text)]">security@tokenplatform.test</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
