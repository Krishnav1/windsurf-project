'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type Asset = {
  id: string;
  name: string;
  symbol: string;
  assetType: string;
  description: string;
  totalValuation: number;
  totalSupply: number;
  availableTokens: number;
  pricePerToken: number;
  details: any;
  media: any;
  documents: any[];
  issuer: any;
  stats: any;
};

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investAmount, setInvestAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');

  useEffect(() => {
    fetchAsset();
  }, [params.id]);

  const fetchAsset = async () => {
    try {
      const response = await fetch(`/api/marketplace/assets/${params.id}`);
      const data = await response.json();
      if (data.success) {
        setAsset(data.asset);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvest = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch('/api/investment/create-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tokenId: asset?.id,
          amountInr: parseFloat(investAmount),
          paymentMethod
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Investment order created! Please complete payment.');
        // Show payment instructions
      } else {
        alert(data.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create investment order');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Asset Not Found</h2>
          <Link href="/marketplace" className="text-blue-600 hover:underline">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/marketplace" className="text-blue-600 hover:underline flex items-center">
            ← Back to Marketplace
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="h-96 bg-gray-200 rounded-t-lg overflow-hidden">
                {asset.media.images.length > 0 ? (
                  <img
                    src={asset.media.images[0].file_url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              {asset.media.images.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {asset.media.images.slice(1, 5).map((img: any, idx: number) => (
                    <img
                      key={idx}
                      src={img.file_url}
                      alt={`${asset.name} ${idx + 2}`}
                      className="w-24 h-24 object-cover rounded cursor-pointer hover:opacity-75"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b">
                <nav className="flex">
                  {['overview', 'details', 'documents', 'financials'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-3 font-medium capitalize ${
                        activeTab === tab
                          ? 'border-b-2 border-blue-600 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">About this Asset</h3>
                      <p className="text-gray-600">{asset.description || 'No description available'}</p>
                    </div>

                    {asset.details && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Key Features</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="font-medium">{asset.details.address.city}, {asset.details.address.state}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Area</p>
                            <p className="font-medium">{asset.details.area} sq ft</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Expected Returns</p>
                            <p className="font-medium text-green-600">{asset.details.expectedReturns}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Lock-in Period</p>
                            <p className="font-medium">{asset.details.lockInMonths} months</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'details' && asset.details && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Property Details</h3>
                      <dl className="grid grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm text-gray-500">Property Type</dt>
                          <dd className="font-medium capitalize">{asset.details.propertyType}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Construction Year</dt>
                          <dd className="font-medium">{asset.details.constructionYear}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Occupancy</dt>
                          <dd className="font-medium capitalize">{asset.details.occupancyStatus}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Rental Income</dt>
                          <dd className="font-medium">{formatCurrency(asset.details.rentalIncome)}/month</dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Full Address</h3>
                      <p className="text-gray-600">
                        {asset.details.address.line1}<br />
                        {asset.details.address.line2 && <>{asset.details.address.line2}<br /></>}
                        {asset.details.address.city}, {asset.details.address.state} {asset.details.address.pincode}
                      </p>
                    </div>

                    {asset.details.amenities && asset.details.amenities.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Amenities</h3>
                        <div className="flex flex-wrap gap-2">
                          {asset.details.amenities.map((amenity: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="space-y-4">
                    {asset.documents.length === 0 ? (
                      <p className="text-gray-500">No documents available</p>
                    ) : (
                      asset.documents.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                            </svg>
                            <div>
                              <p className="font-medium">{doc.document_name}</p>
                              <p className="text-sm text-gray-500 capitalize">{doc.document_type.replace('_', ' ')}</p>
                            </div>
                          </div>
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            View
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'financials' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Total Valuation</p>
                        <p className="text-2xl font-bold">{formatCurrency(asset.totalValuation)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Price per Token</p>
                        <p className="text-2xl font-bold">{formatCurrency(asset.pricePerToken)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Raised</p>
                        <p className="text-xl font-semibold text-green-600">
                          {formatCurrency(asset.stats.totalRaised)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Funding Progress</p>
                        <p className="text-xl font-semibold">{asset.stats.fundingProgress.toFixed(1)}%</p>
                      </div>
                    </div>

                    {asset.details && (
                      <div className="mt-6">
                        <h3 className="font-semibold mb-2">Investment Range</h3>
                        <p className="text-gray-600">
                          Min: {formatCurrency(asset.details.minInvestment)} - 
                          Max: {formatCurrency(asset.details.maxInvestment)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Investment Card */}
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-2xl font-bold mb-4">{asset.name}</h2>
              <p className="text-gray-600 mb-4">{asset.assetType.replace('_', ' ')} • {asset.symbol}</p>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Price per Token</p>
                  <p className="text-2xl font-bold">{formatCurrency(asset.pricePerToken)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Available Tokens</p>
                  <p className="text-lg font-semibold">{asset.availableTokens} / {asset.totalSupply}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${((asset.totalSupply - asset.availableTokens) / asset.totalSupply) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{asset.stats.uniqueInvestors} investors</span>
                  <span className="text-green-600 font-medium">{asset.details?.expectedReturns}% returns</span>
                </div>
              </div>

              <button
                onClick={() => setShowInvestModal(true)}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 mb-4"
              >
                Invest Now
              </button>

              {asset.issuer && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">Issued by</p>
                  <div className="flex items-center gap-3">
                    {asset.issuer.logoUrl && (
                      <img src={asset.issuer.logoUrl} alt={asset.issuer.name} className="w-12 h-12 rounded-full" />
                    )}
                    <div>
                      <p className="font-semibold">{asset.issuer.name}</p>
                      {asset.issuer.verified && (
                        <span className="text-xs text-green-600">✓ Verified</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Investment Modal */}
      {showInvestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Invest in {asset.name}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Investment Amount (₹)</label>
                <input
                  type="number"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                {investAmount && (
                  <p className="text-sm text-gray-600 mt-1">
                    You'll receive {(parseFloat(investAmount) / asset.pricePerToken).toFixed(2)} tokens
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="upi">UPI</option>
                  <option value="inr">Bank Transfer</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowInvestModal(false)}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvest}
                  disabled={!investAmount || parseFloat(investAmount) <= 0}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
