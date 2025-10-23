# 🚀 Complete Trading System Setup Guide

## Overview
This guide will help you set up the complete end-to-end trading system with payment integration, blockchain execution, and holdings management.

---

## 📋 Prerequisites

### 1. Accounts Needed
- ✅ Supabase account (database)
- ✅ Razorpay account (payment gateway)
- ✅ Pinata account (IPFS storage) - already configured
- ✅ Blockchain RPC provider (Alchemy/Infura for Polygon)

### 2. Tools Required
- Node.js 18+ installed
- Git installed
- Code editor (VS Code recommended)

---

## 🗄️ STEP 1: Database Setup

### Run the Migration

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `ztxnwqwgdvxjgfwkqjqe`

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Run the Migration**
   - Open file: `database/migrations/create_trading_system.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run"

4. **Verify Tables Created**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
     'user_holdings',
     'orders',
     'payment_settlements',
     'blockchain_transactions',
     'user_wallets',
     'settlement_queue'
   );
   ```
   Should return 6 rows.

---

## 💳 STEP 2: Razorpay Setup

### Create Razorpay Account

1. **Sign Up**
   - Go to https://razorpay.com
   - Click "Sign Up"
   - Complete business verification

2. **Get API Keys**
   - Go to Settings → API Keys
   - Click "Generate Test Key" (for testing)
   - Copy:
     - Key ID (starts with `rzp_test_`)
     - Key Secret

3. **Configure Webhook**
   - Go to Settings → Webhooks
   - Click "Add New Webhook"
   - URL: `https://your-domain.com/api/webhooks/razorpay`
   - Secret: Generate a random string (save it)
   - Events to subscribe:
     - `payment.authorized`
     - `payment.captured`
     - `payment.failed`
   - Click "Create Webhook"

---

## 🔗 STEP 3: Blockchain Setup

### Get RPC URL

1. **Alchemy (Recommended)**
   - Go to https://alchemy.com
   - Create account
   - Create new app
   - Network: Polygon Mumbai (testnet) or Polygon Mainnet
   - Copy HTTP URL

2. **Or Infura**
   - Go to https://infura.io
   - Create project
   - Select Polygon
   - Copy endpoint URL

### Create Platform Wallet

1. **Generate Wallet**
   ```bash
   # Install ethers if not already
   npm install ethers

   # Run this in Node.js console
   const { ethers } = require('ethers');
   const wallet = ethers.Wallet.createRandom();
   console.log('Address:', wallet.address);
   console.log('Private Key:', wallet.privateKey);
   ```

2. **Fund Wallet**
   - For testnet: Get MATIC from https://faucet.polygon.technology
   - For mainnet: Transfer MATIC to wallet address

3. **Load with Tokens**
   - Transfer your ERC3643 tokens to this wallet
   - This wallet will distribute tokens to buyers

---

## 🔐 STEP 4: Environment Variables

### Create `.env.local` file

```env
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://ztxnwqwgdvxjgfwkqjqe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx

# Blockchain
BLOCKCHAIN_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/your_key
NEXT_PUBLIC_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/your_key
PLATFORM_PRIVATE_KEY=0xYOUR_WALLET_PRIVATE_KEY
PLATFORM_WALLET_ADDRESS=0xYOUR_WALLET_ADDRESS
NEXT_PUBLIC_BLOCK_EXPLORER=https://mumbai.polygonscan.com

# Encryption (for custodial wallets)
ENCRYPTION_KEY=your-32-character-encryption-key-here
NEXT_PUBLIC_ENCRYPTION_KEY=your-32-character-encryption-key-here

# Pinata (already configured)
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Generate Encryption Key

```bash
# Run in terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📦 STEP 5: Install Dependencies

```bash
# Install Razorpay SDK
npm install razorpay

# Install ethers.js (if not already)
npm install ethers

# Install other dependencies
npm install
```

---

## 🏗️ STEP 6: Deploy Smart Contracts (If Not Already)

### Check if Contracts are Deployed

1. Go to your blockchain explorer
2. Search for your token contract address
3. If not found, deploy using Hardhat:

```bash
# Compile contracts
npx hardhat compile

# Deploy to testnet
npx hardhat run scripts/deploy.js --network polygonMumbai

# Save contract address
# Update tokens table in database with contract_address
```

---

## 🧪 STEP 7: Testing

### Test 1: Create Order

```bash
# Start dev server
npm run dev

# In browser:
# 1. Login as investor
# 2. Go to marketplace
# 3. Click "Buy" on a token
# 4. Should see Razorpay payment page
```

### Test 2: Complete Payment

```bash
# Use Razorpay test cards:
# Card: 4111 1111 1111 1111
# CVV: Any 3 digits
# Expiry: Any future date
# OTP: 123456 (for test mode)

# After payment:
# - Check order status in database
# - Should see blockchain transaction
# - Holdings should update
```

### Test 3: Verify Blockchain

```bash
# Check transaction on explorer
# Go to: https://mumbai.polygonscan.com/tx/YOUR_TX_HASH

# Verify token transfer
# Check buyer's wallet balance
```

---

## 🔄 STEP 8: Webhook Testing

### Test Razorpay Webhook Locally

1. **Install ngrok**
   ```bash
   npm install -g ngrok
   ```

2. **Start ngrok**
   ```bash
   ngrok http 3000
   ```

3. **Update Razorpay Webhook URL**
   - Copy ngrok URL (e.g., `https://abc123.ngrok.io`)
   - Go to Razorpay Dashboard → Webhooks
   - Update URL to: `https://abc123.ngrok.io/api/webhooks/razorpay`

4. **Test Payment**
   - Make a test payment
   - Check ngrok terminal for webhook requests
   - Check server logs for processing

---

## 📊 STEP 9: Verify Complete Flow

### End-to-End Test

1. **Create Order**
   - User clicks "Buy 10 tokens @ ₹1000"
   - Order created in database (status: pending)
   - Razorpay payment page opens

2. **Complete Payment**
   - User pays via UPI/Card
   - Webhook received
   - Payment verified
   - Order status: payment_confirmed

3. **Blockchain Execution**
   - Trade executor triggered
   - KYC verified on-chain
   - Tokens transferred
   - Transaction confirmed
   - Order status: completed

4. **Holdings Updated**
   - user_holdings table updated
   - User can see tokens in Holdings page
   - Blockchain verified: true

5. **Notifications Sent**
   - Payment success notification
   - Trade completed notification
   - Email sent (if configured)

---

## 🐛 Troubleshooting

### Issue: Payment Not Processing

**Check:**
1. Razorpay keys in `.env.local`
2. Webhook URL is correct
3. Webhook secret matches
4. Server logs for errors

**Fix:**
```bash
# Check Razorpay dashboard for payment status
# Check payment_settlements table
SELECT * FROM payment_settlements 
WHERE status = 'pending' 
ORDER BY created_at DESC;
```

### Issue: Blockchain Transaction Failing

**Check:**
1. Platform wallet has MATIC for gas
2. Platform wallet has tokens to transfer
3. Buyer is KYC verified on-chain
4. RPC URL is correct

**Fix:**
```bash
# Check wallet balance
# In browser console:
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const balance = await provider.getBalance(WALLET_ADDRESS);
console.log('Balance:', ethers.utils.formatEther(balance));
```

### Issue: Holdings Not Updating

**Check:**
1. user_wallets table has wallet for user
2. Blockchain transaction confirmed
3. Token ID matches in orders and tokens tables

**Fix:**
```sql
-- Check user wallet
SELECT * FROM user_wallets WHERE user_id = 'USER_ID';

-- Check holdings
SELECT * FROM user_holdings WHERE user_id = 'USER_ID';

-- Manually sync
-- Call /api/holdings/sync with token address
```

---

## 🚀 STEP 10: Production Deployment

### Before Going Live

1. **Switch to Mainnet**
   - Update RPC URL to Polygon Mainnet
   - Deploy contracts to mainnet
   - Update contract addresses in database

2. **Switch to Live Razorpay**
   - Get live API keys
   - Update webhook URL to production domain
   - Complete KYC with Razorpay

3. **Security Checklist**
   - ✅ Private keys in environment variables (not code)
   - ✅ Webhook signature verification enabled
   - ✅ Rate limiting on APIs
   - ✅ HTTPS enabled
   - ✅ Database backups configured

4. **Monitoring**
   - Set up error tracking (Sentry)
   - Set up uptime monitoring
   - Set up blockchain transaction monitoring
   - Set up payment reconciliation

---

## 📈 Next Steps

### Week 2 Features

1. **Settlement Automation**
   - Auto-pay sellers after trade
   - Batch settlements
   - Fee collection

2. **Order Book**
   - Limit orders
   - Order matching
   - Price discovery

3. **CBDC Integration**
   - Prepare infrastructure
   - Test with RBI pilot
   - Implement instant settlement

4. **Advanced Analytics**
   - Portfolio performance charts
   - Tax reports
   - Investment insights

---

## 📞 Support

### Common Commands

```bash
# Check order status
SELECT * FROM orders WHERE id = 'ORDER_ID';

# Check payment status
SELECT * FROM payment_settlements WHERE order_id = 'ORDER_ID';

# Check blockchain transaction
SELECT * FROM blockchain_transactions WHERE order_id = 'ORDER_ID';

# Check holdings
SELECT * FROM user_holdings WHERE user_id = 'USER_ID';

# Sync holdings from blockchain
POST /api/holdings/sync
{
  "tokenAddress": "0x..."
}
```

### Logs to Check

1. **Server Logs**
   - Look for `[Trade Execute]`, `[Razorpay]`, `[Trade Executor]`

2. **Database Logs**
   - Check Supabase logs for query errors

3. **Blockchain Logs**
   - Check transaction on explorer
   - Look for revert reasons

---

## ✅ Verification Checklist

- [ ] Database tables created
- [ ] Razorpay account configured
- [ ] Webhook URL set up
- [ ] Blockchain RPC connected
- [ ] Platform wallet funded
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Smart contracts deployed
- [ ] Test payment successful
- [ ] Blockchain transaction confirmed
- [ ] Holdings updated
- [ ] Notifications sent

---

**Your platform is now ready for end-to-end trading! 🎉**

For issues, check the troubleshooting section or review server logs.
