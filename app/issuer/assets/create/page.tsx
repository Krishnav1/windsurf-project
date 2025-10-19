'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type AssetFormData = {
  // Basic Info
  tokenName: string;
  tokenSymbol: string;
  assetType: string;
  totalSupply: string;
  assetValuation: string;
  
  // Asset Details
  description: string;
  city: string;
  state: string;
  areaSqft: string;
  expectedReturns: string;
  lockInMonths: string;
  minInvestment: string;
  maxInvestment: string;
  
  // Images
  images: File[];
  
  // Documents
  documents: File[];
};

export default function CreateAssetPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<AssetFormData>({
    tokenName: '',
    tokenSymbol: '',
    assetType: 'real_estate',
    totalSupply: '',
    assetValuation: '',
    description: '',
    city: '',
    state: '',
    areaSqft: '',
    expectedReturns: '',
    lockInMonths: '',
    minInvestment: '',
    maxInvestment: '',
    images: [],
    documents: []
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({ ...formData, images: Array.from(e.target.files) });
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({ ...formData, documents: Array.from(e.target.files) });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Step 1: Create token
      const tokenResponse = await fetch('/api/tokens/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          token_name: formData.tokenName,
          token_symbol: formData.tokenSymbol,
          asset_type: formData.assetType,
          total_supply: parseFloat(formData.totalSupply),
          asset_valuation: parseFloat(formData.assetValuation),
          description: formData.description,
          city: formData.city,
          state: formData.state,
          area_sqft: parseFloat(formData.areaSqft),
          expected_returns_percent: parseFloat(formData.expectedReturns),
          lock_in_months: parseInt(formData.lockInMonths),
          min_investment: parseFloat(formData.minInvestment),
          max_investment: parseFloat(formData.maxInvestment)
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to create asset');
      }

      const { asset } = await tokenResponse.json();
      const assetId = asset.id;

      // Step 2: Upload images
      if (formData.images.length > 0) {
        for (let i = 0; i < formData.images.length; i++) {
          const imageFormData = new FormData();
          imageFormData.append('file', formData.images[i]);
          imageFormData.append('asset_id', assetId);
          imageFormData.append('is_primary', i === 0 ? 'true' : 'false');

          await fetch('/api/assets/upload-media', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: imageFormData
          });
        }
      }

      // Step 3: Upload documents
      if (formData.documents.length > 0) {
        for (const doc of formData.documents) {
          const docFormData = new FormData();
          docFormData.append('file', doc);
          docFormData.append('asset_id', assetId);
          docFormData.append('document_type', 'legal');

          await fetch('/api/assets/upload-document', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: docFormData
          });
        }
      }

      // Success - redirect to issuer dashboard
      router.push('/issuer/dashboard?success=Asset created successfully');

    } catch (err: any) {
      setError(err.message || 'Failed to create asset');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset Name *
                </label>
                <input
                  type="text"
                  name="tokenName"
                  value={formData.tokenName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mumbai BKC Flat"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token Symbol *
                </label>
                <input
                  type="text"
                  name="tokenSymbol"
                  value={formData.tokenSymbol}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., MBF"
                  maxLength={10}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset Type *
                </label>
                <select
                  name="assetType"
                  value={formData.assetType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="real_estate">Real Estate</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="private_credit">Private Credit</option>
                  <option value="commodities">Commodities</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Supply (Tokens) *
                </label>
                <input
                  type="number"
                  name="totalSupply"
                  value={formData.totalSupply}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1000000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Valuation (₹) *
                </label>
                <input
                  type="number"
                  name="assetValuation"
                  value={formData.assetValuation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 50000000"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={!formData.tokenName || !formData.tokenSymbol || !formData.totalSupply || !formData.assetValuation}
              >
                Next: Asset Details
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Asset Details</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your asset in detail..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mumbai"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Maharashtra"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area (sq ft) *
                </label>
                <input
                  type="number"
                  name="areaSqft"
                  value={formData.areaSqft}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Returns (%) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="expectedReturns"
                  value={formData.expectedReturns}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 12.5"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lock-in Period (Months) *
                </label>
                <input
                  type="number"
                  name="lockInMonths"
                  value={formData.lockInMonths}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 12"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Investment (₹) *
                </label>
                <input
                  type="number"
                  name="minInvestment"
                  value={formData.minInvestment}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 100000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Investment (₹)
                </label>
                <input
                  type="number"
                  name="maxInvestment"
                  value={formData.maxInvestment}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 5000000"
                />
              </div>
            </div>

            <div className="flex justify-between gap-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={!formData.description || !formData.city || !formData.state}
              >
                Next: Upload Media
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Upload Media & Documents</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Images * (First image will be primary)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {formData.images.length > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  {formData.images.length} image(s) selected
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Legal Documents (PDFs)
              </label>
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleDocumentUpload}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {formData.documents.length > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  {formData.documents.length} document(s) selected
                </p>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex justify-between gap-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                disabled={loading || formData.images.length === 0}
              >
                {loading ? 'Creating Asset...' : 'Submit for Approval'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    step > s ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm text-gray-600">Basic Info</span>
            <span className="text-sm text-gray-600">Details</span>
            <span className="text-sm text-gray-600">Media</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow p-8">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
