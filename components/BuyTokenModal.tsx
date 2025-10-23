'use client';

import { useState } from 'react';
import Script from 'next/script';

interface BuyTokenModalProps {
  token: {
    id: string;
    name: string;
    symbol: string;
    current_price: string;
    contract_address: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function BuyTokenModal({ token, onClose, onSuccess }: BuyTokenModalProps) {
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const price = parseFloat(token.current_price || '0');
  const qty = parseFloat(quantity || '0');
  const totalAmount = price * qty;
  const platformFee = totalAmount * 0.01; // 1%
  const gasEstimate = 5; // ₹5
  const netAmount = totalAmount + platformFee + gasEstimate;

  const handleBuy = async () => {
    if (qty <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        setError('Please login to continue');
        return;
      }

      // Step 1: Create order
      console.log('[Buy] Creating order...');
      const orderResponse = await fetch('/api/trades/execute', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tokenId: token.id,
          side: 'buy',
          quantity: qty,
          price: price,
          settlementMethod: 'upi'
        })
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        if (orderData.kycRequired) {
          setError('KYC verification required. Redirecting...');
          setTimeout(() => {
            window.location.href = '/settings/kyc';
          }, 2000);
          return;
        }
        throw new Error(orderData.error || 'Failed to create order');
      }

      console.log('[Buy] Order created:', orderData.order.id);

      // Step 2: If payment required, open Razorpay
      if (orderData.payment.required) {
        console.log('[Buy] Opening Razorpay payment...');
        
        const options = {
          key: orderData.payment.keyId,
          amount: orderData.payment.amount,
          currency: orderData.payment.currency,
          name: 'TokenPlatform',
          description: `Buy ${qty} ${token.symbol} tokens`,
          order_id: orderData.payment.razorpayOrderId,
          handler: async function (response: any) {
            console.log('[Buy] Payment successful:', response.razorpay_payment_id);
            
            // Step 3: Verify payment and execute blockchain
            try {
              const verifyResponse = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${authToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });

              const verifyData = await verifyResponse.json();

              if (verifyData.success) {
                console.log('[Buy] ✅ Trade completed!');
                alert(`🎉 Success! ${qty} ${token.symbol} tokens purchased!\n\nTransaction: ${verifyData.blockchain.txHash}`);
                onSuccess();
                onClose();
              } else {
                throw new Error(verifyData.error || 'Payment verification failed');
              }
            } catch (verifyError) {
              console.error('[Buy] Verification error:', verifyError);
              setError('Payment verification failed. Please contact support.');
            }
          },
          prefill: {
            name: localStorage.getItem('userName') || '',
            email: localStorage.getItem('userEmail') || '',
            contact: localStorage.getItem('userPhone') || ''
          },
          theme: {
            color: '#0B67FF'
          },
          modal: {
            ondismiss: function() {
              console.log('[Buy] Payment cancelled');
              setLoading(false);
              setError('Payment cancelled');
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        // No payment required (sell order or other)
        alert('Order created successfully!');
        onSuccess();
        onClose();
      }

    } catch (error) {
      console.error('[Buy] Error:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Buy {token.symbol}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Token Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Token</span>
              <span className="font-semibold text-gray-900">{token.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Price per token</span>
              <span className="font-semibold text-gray-900">₹{price.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0.0001"
              step="0.0001"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter quantity"
            />
          </div>

          {/* Price Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Token Cost</span>
              <span className="text-gray-900">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Platform Fee (1%)</span>
              <span className="text-gray-900">₹{platformFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Gas Fee (Est.)</span>
              <span className="text-gray-900">₹{gasEstimate.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-300 pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span className="text-gray-900">Total Amount</span>
                <span className="text-blue-600 text-lg">₹{netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>💡 Test Mode:</strong> Use test UPI or cards. No real money will be charged.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleBuy}
              disabled={loading || qty <= 0}
              className="flex-1 px-6 py-3 bg-[#0B67FF] text-white rounded-lg hover:bg-[#2D9CDB] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                `Pay ₹${netAmount.toLocaleString('en-IN')}`
              )}
            </button>
          </div>

          {/* Payment Methods Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Secure payment via Razorpay • UPI, Cards, Net Banking
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
