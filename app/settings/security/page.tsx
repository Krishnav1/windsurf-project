'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import InvestorNav from '@/components/InvestorNav';

export default function SecurityPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [twoFASetup, setTwoFASetup] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [connectedWallets, setConnectedWallets] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchSecurityData(token);
    setLoading(false);
  }, []);

  const fetchSecurityData = async (token: string) => {
    try {
      // Fetch connected wallets
      const walletsRes = await fetch('/api/user/wallets', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const walletsData = await walletsRes.json();
      if (walletsData.success) setConnectedWallets(walletsData.wallets || []);

      // Fetch login history
      const historyRes = await fetch('/api/user/login-history', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const historyData = await historyRes.json();
      if (historyData.success) setLoginHistory(historyData.history || []);
    } catch (error) {
      console.error('Error fetching security data:', error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEnable2FA = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/auth/setup-2fa', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setTwoFASetup(data);
      } else {
        setError(data.error || 'Failed to setup 2FA');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: verificationCode,
          secret: twoFASetup.secret,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('2FA enabled successfully!');
        setTwoFASetup(null);
        setVerificationCode('');
        const updatedUser = { ...user, twoFAEnabled: true };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA?')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/auth/disable-2fa', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('2FA disabled successfully');
        const updatedUser = { ...user, twoFAEnabled: false };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        setError(data.error || 'Failed to disable 2FA');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const disconnectWallet = async (walletId: string) => {
    if (!confirm('Are you sure you want to disconnect this wallet?')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`/api/user/wallets/${walletId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setConnectedWallets(connectedWallets.filter(w => w.id !== walletId));
        setSuccess('Wallet disconnected successfully');
      } else {
        setError(data.error || 'Failed to disconnect wallet');
      }
    } catch (err: any) {
      setError(err.message);
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
          <h2 className="text-3xl font-bold text-gray-900">Security Settings</h2>
          <p className="text-gray-600 mt-2">Manage your account security and authentication</p>
        </div>

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Change Password */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF] focus:border-transparent"
                required
                minLength={8}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF] focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-[#0B67FF] text-white rounded-lg font-medium hover:bg-[#2D9CDB] transition-colors"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Two-Factor Authentication (2FA)</h3>
          
          {!user?.twoFAEnabled && !twoFASetup && (
            <div>
              <p className="text-gray-600 mb-4">
                Add an extra layer of security to your account by enabling two-factor authentication.
              </p>
              <button
                onClick={handleEnable2FA}
                className="px-6 py-3 bg-[#0B67FF] text-white rounded-lg hover:bg-[#2D9CDB] transition-colors"
              >
                Enable 2FA
              </button>
            </div>
          )}

          {twoFASetup && (
            <div>
              <p className="text-gray-600 mb-4">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-4">
                <img src={twoFASetup.qrCode} alt="2FA QR Code" className="w-64 h-64" />
              </div>

              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enter 6-digit code from your app
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B67FF]"
                    placeholder="123456"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Verify & Enable
                  </button>
                  <button
                    type="button"
                    onClick={() => setTwoFASetup(null)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {user?.twoFAEnabled && !twoFASetup && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-600 font-medium">2FA is enabled on your account</p>
              </div>
              <button
                onClick={handleDisable2FA}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Disable 2FA
              </button>
            </div>
          )}
        </div>

        {/* Connected Wallets */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Connected Wallets</h3>
          {connectedWallets.length > 0 ? (
            <div className="space-y-3">
              {connectedWallets.map((wallet) => (
                <div key={wallet.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{wallet.address}</p>
                    <p className="text-sm text-gray-500">Connected on {new Date(wallet.connectedAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => disconnectWallet(wallet.id)}
                    className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Disconnect
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No wallets connected</p>
          )}
        </div>

        {/* Login History */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Login History</h3>
          {loginHistory.length > 0 ? (
            <div className="space-y-3">
              {loginHistory.slice(0, 5).map((login, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{login.device || 'Unknown Device'}</p>
                    <p className="text-sm text-gray-500">{login.location || 'Unknown Location'}</p>
                  </div>
                  <p className="text-sm text-gray-600">{new Date(login.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No login history available</p>
          )}
        </div>

        {/* Security Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-2">Security Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Never share your password or 2FA codes with anyone</li>
            <li>• Use a strong, unique password for your account</li>
            <li>• Enable 2FA for maximum security</li>
            <li>• Review your login history regularly</li>
            <li>• Log out from shared devices</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
