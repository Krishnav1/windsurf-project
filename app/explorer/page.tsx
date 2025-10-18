/**
 * Token Explorer Page
 * 
 * Public page to explore all active tokens with hash verification
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ExplorerPage() {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<any>(null);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      // Fetch public token data without authentication
      const response = await fetch('/api/tokens/issue');
      const data = await response.json();
      
      if (data.success) {
        // Filter only active tokens for public view
        setTokens(data.tokens.filter((t: any) => t.status === 'active'));
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewTokenDetails = async (tokenId: string) => {
    try {
      const response = await fetch(`/api/verify/hash?tokenId=${tokenId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedToken(data.token);
      }
    } catch (error) {
      console.error('Error fetching token details:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B67FF] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tokens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <h1 className="text-2xl font-bold text-[#0B67FF]">TokenPlatform</h1>
              </Link>
            </div>
            <div className="flex gap-4">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-[#0B67FF] hover:bg-[#F4F7FB] rounded-lg transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 bg-[#0B67FF] text-white rounded-lg hover:bg-[#2D9CDB] transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Token Explorer</h2>
          <p className="mt-2 text-gray-600">
            Browse all active tokenized assets on the platform
          </p>
        </div>

        {/* Token Grid */}
        {tokens.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokens.map((token) => (
              <div key={token.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{token.token_name}</h3>
                    <p className="text-sm text-gray-500">{token.token_symbol}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                    Active
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Asset Type</p>
                    <p className="text-sm font-medium text-gray-900">{token.asset_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Supply</p>
                    <p className="text-sm font-medium text-gray-900">
                      {token.total_supply.toLocaleString()} tokens
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Issuer</p>
                    <p className="text-sm font-medium text-gray-900">{token.issuer_legal_name}</p>
                  </div>
                  {token.contract_address && (
                    <div>
                      <p className="text-xs text-gray-500">Contract Address</p>
                      <a
                        href={`https://mumbai.polygonscan.com/address/${token.contract_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#0B67FF] hover:text-[#2D9CDB] break-all"
                      >
                        {token.contract_address.substring(0, 10)}...{token.contract_address.substring(38)}
                      </a>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => viewTokenDetails(token.id)}
                  className="w-full px-4 py-2 bg-[#0B67FF] text-white text-sm rounded hover:bg-[#2D9CDB] transition-colors"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No active tokens available yet</p>
            <p className="text-gray-400 text-sm mt-2">Check back later for tokenized assets</p>
          </div>
        )}
      </div>

      {/* Token Details Modal */}
      {selectedToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedToken.name}</h3>
                <p className="text-gray-500">{selectedToken.symbol}</p>
              </div>
              <button
                onClick={() => setSelectedToken(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Asset Information</h4>
                <div className="bg-gray-50 rounded p-4 space-y-2">
                  <p className="text-sm"><span className="font-medium">Type:</span> {selectedToken.assetType}</p>
                  <p className="text-sm"><span className="font-medium">Total Supply:</span> {selectedToken.totalSupply}</p>
                  <p className="text-sm"><span className="font-medium">Status:</span> {selectedToken.status}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Blockchain Details</h4>
                <div className="bg-gray-50 rounded p-4 space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Contract Address</p>
                    <a
                      href={`https://mumbai.polygonscan.com/address/${selectedToken.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#0B67FF] hover:text-[#2D9CDB] break-all"
                    >
                      {selectedToken.contractAddress}
                    </a>
                  </div>
                  {selectedToken.mintTxHash && (
                    <div>
                      <p className="text-xs text-gray-500">Mint Transaction</p>
                      <a
                        href={`https://mumbai.polygonscan.com/tx/${selectedToken.mintTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#0B67FF] hover:text-[#2D9CDB] break-all"
                      >
                        {selectedToken.mintTxHash}
                      </a>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Metadata Hash (On-chain Anchor)</p>
                    <code className="text-xs bg-white px-2 py-1 rounded border break-all">
                      {selectedToken.metadataHash}
                    </code>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Document Hashes</h4>
                <div className="bg-gray-50 rounded p-4 space-y-2">
                  {selectedToken.documentHashes.legalDocument && (
                    <div>
                      <p className="text-xs text-gray-500">Legal Document</p>
                      <code className="text-xs bg-white px-2 py-1 rounded border break-all">
                        {selectedToken.documentHashes.legalDocument}
                      </code>
                    </div>
                  )}
                  {selectedToken.documentHashes.valuationReport && (
                    <div>
                      <p className="text-xs text-gray-500">Valuation Report</p>
                      <code className="text-xs bg-white px-2 py-1 rounded border break-all">
                        {selectedToken.documentHashes.valuationReport}
                      </code>
                    </div>
                  )}
                  {selectedToken.documentHashes.custodyProof && (
                    <div>
                      <p className="text-xs text-gray-500">Custody Proof</p>
                      <code className="text-xs bg-white px-2 py-1 rounded border break-all">
                        {selectedToken.documentHashes.custodyProof}
                      </code>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <Link
                  href="/auth/register"
                  className="block w-full text-center px-4 py-3 bg-[#0B67FF] text-white rounded-lg hover:bg-[#2D9CDB] transition-colors"
                >
                  Register to Trade This Token
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
