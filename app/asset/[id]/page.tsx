'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import InvestorNav from '@/components/InvestorNav';

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<any>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    setUser(JSON.parse(userData));
    fetchAssetDetails(token);
  }, [params.id]);

  const fetchAssetDetails = async (token: string) => {
    try {
      const response = await fetch(`/api/assets/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setAsset(data.asset);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWatchlist = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch('/api/watchlist/toggle', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assetId: params.id }),
      });
      const data = await response.json();
      if (data.success) setIsInWatchlist(!isInWatchlist);
    } catch (error) {
      console.error('Error:', error);
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

  if (!asset) {
    return (
      <div className="min-h-screen bg-[#F4F7FB]">
        <InvestorNav />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Asset Not Found</h2>
          <Link href="/marketplace" className="text-[#0B67FF]">Browse Marketplace →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <InvestorNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <img src={asset.primaryImage || '/placeholder.png'} alt={asset.name} className="w-full h-96 object-cover rounded-lg" />
          </div>
          
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{asset.name}</h1>
                <p className="text-lg text-gray-600">{asset.symbol}</p>
              </div>
              <button onClick={toggleWatchlist} className={`p-3 rounded-full ${isInWatchlist ? 'bg-[#0B67FF] text-white' : 'bg-gray-100'}`}>
                <svg className="w-6 h-6" fill={isInWatchlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Price per Token</p>
                <p className="text-2xl font-bold text-[#0B67FF]">₹{asset.pricePerToken?.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Expected Returns</p>
                <p className="text-2xl font-bold text-green-600">{asset.expectedReturns}%</p>
              </div>
            </div>

            <div className="flex gap-4">
              {user?.kycStatus === 'approved' ? (
                <Link href={`/trading/${asset.id}`} className="flex-1 px-6 py-3 bg-[#0B67FF] text-white rounded-lg font-semibold text-center">
                  Trade Now
                </Link>
              ) : (
                <Link href="/compliance/kyc-submit" className="flex-1 px-6 py-3 bg-yellow-500 text-white rounded-lg font-semibold text-center">
                  Complete KYC to Trade
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="border-b mb-6">
            <div className="flex gap-8">
              {['overview', 'details', 'documents', 'trade'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 font-medium border-b-2 ${activeTab === tab ? 'border-[#0B67FF] text-[#0B67FF]' : 'border-transparent text-gray-600'}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'overview' && (
            <div>
              <h3 className="text-xl font-bold mb-4">About This Asset</h3>
              <p className="text-gray-700 mb-6">{asset.description || 'No description available.'}</p>
            </div>
          )}

          {activeTab === 'details' && (
            <div>
              <h3 className="text-xl font-bold mb-4">Detailed Specifications</h3>
              <dl className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <dt className="text-gray-600">Asset Type</dt>
                  <dd className="font-medium">{asset.assetType}</dd>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <dt className="text-gray-600">Total Supply</dt>
                  <dd className="font-medium">{asset.totalSupply?.toLocaleString()} tokens</dd>
                </div>
              </dl>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <h3 className="text-xl font-bold mb-4">Legal Documents</h3>
              {user?.kycStatus === 'approved' ? (
                <p className="text-gray-600">Documents will be available here.</p>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <h4 className="font-semibold mb-2">KYC Verification Required</h4>
                  <Link href="/compliance/kyc-submit" className="inline-block px-6 py-2 bg-yellow-500 text-white rounded-lg">
                    Complete KYC
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'trade' && (
            <div>
              <h3 className="text-xl font-bold mb-4">Trade This Asset</h3>
              {user?.kycStatus === 'approved' ? (
                <Link href={`/trading/${asset.id}`} className="inline-block px-6 py-3 bg-[#0B67FF] text-white rounded-lg">
                  Go to Trading Page
                </Link>
              ) : (
                <p className="text-gray-600">Complete KYC verification to start trading.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
