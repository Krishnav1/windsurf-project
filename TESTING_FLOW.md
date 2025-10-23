# 🧪 Complete Testing Flow Guide

## 🎯 Overview
This guide shows you exactly how to test the complete trading system end-to-end.

---

## ✅ Prerequisites Completed

1. ✅ **Database Tables Created** - 6 new tables deployed to Supabase
2. ✅ **Razorpay Configured** - Test keys added to `.env.local`
3. ✅ **Dependencies Installed** - `razorpay` and `ethers` packages installed
4. ✅ **Environment Variables Set** - All credentials configured

---

## 🚀 Step-by-Step Testing

### Step 1: Start the Development Server

```bash
npm run dev
```

Wait for server to start on `http://localhost:3000`

---

### Step 2: Login as Investor

1. Go to `http://localhost:3000/auth/login`
2. Login with your investor account
3. Ensure KYC is **approved** (check `/settings/kyc`)

**If KYC not approved:**
- Go to `/settings/kyc`
- Upload documents
- Admin approves from `/admin/kyc`

---

### Step 3: Browse Marketplace

1. Click **"Marketplace"** in navigation
2. You'll see list of available tokens
3. Click on any token to view details

---

### Step 4: Buy Tokens (Complete Flow)

#### 4.1 Click "Buy Now" Button
- Opens payment modal
- Shows token details and price breakdown

#### 4.2 Enter Quantity
- Enter how many tokens you want (e.g., `10`)
- See total amount calculation:
  - Token Cost: ₹10,000
  - Platform Fee (1%): ₹100
  - Gas Fee: ₹5
  - **Total: ₹10,105**

#### 4.3 Click "Pay" Button
- Order created in database
- Razorpay payment page opens

#### 4.4 Complete Payment (Test Mode)

**Option A: Test UPI**
- Select UPI
- Enter any UPI ID (e.g., `test@paytm`)
- Click "Pay"
- Payment succeeds automatically

**Option B: Test Card**
```
Card Number: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25
Name: Test User
```
- Click "Pay"
- Enter OTP: `123456`
- Payment succeeds

#### 4.5 Wait for Blockchain Execution
- Payment verified ✅
- Blockchain transaction initiated
- Tokens transferred to your wallet
- Order status: **Completed** ✅

#### 4.6 Success!
- Alert shows: "🎉 Success! Tokens purchased!"
- Transaction hash displayed
- Redirected to holdings page

---

### Step 5: View Your Holdings

1. Go to **"Holdings"** page
2. See your purchased tokens:
   - Quantity
   - Average price
   - Current value
   - P&L (Profit/Loss)
   - Blockchain verified ✅

3. Click **"Sync"** to update from blockchain

---

## 🧪 Test Scenarios

### Scenario 1: Successful Purchase
```
✅ User has approved KYC
✅ Sufficient tokens available
✅ Payment succeeds
✅ Blockchain execution succeeds
✅ Holdings updated
```

### Scenario 2: KYC Not Approved
```
❌ User clicks "Buy"
❌ System checks KYC
❌ Error: "KYC verification required"
➡️ Redirected to /settings/kyc
```

### Scenario 3: Payment Fails
```
✅ Order created
❌ User cancels payment
❌ Order status: "failed"
➡️ User can try again
```

### Scenario 4: Blockchain Fails
```
✅ Payment succeeds
❌ Blockchain execution fails
✅ Automatic refund initiated
📧 Notification sent to user
```

---

## 💳 Razorpay Test Credentials

### Test Cards (Always Success)
```
Card: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
OTP: 123456
```

### Test Cards (Always Fail)
```
Card: 4000 0000 0000 0002
CVV: 123
Expiry: 12/25
```

### Test UPI
```
Any UPI ID works in test mode
Example: test@paytm, test@upi
```

### Test Net Banking
```
Select any bank
Use test credentials provided
```

---

## 🔍 How to Verify Each Step

### 1. Check Order Created
```sql
-- In Supabase SQL Editor
SELECT * FROM orders 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC 
LIMIT 1;
```

Expected: `status = 'pending'`

### 2. Check Payment Record
```sql
SELECT * FROM payment_settlements 
WHERE order_id = 'YOUR_ORDER_ID';
```

Expected: `status = 'completed'`

### 3. Check Blockchain Transaction
```sql
SELECT * FROM blockchain_transactions 
WHERE order_id = 'YOUR_ORDER_ID';
```

Expected: `status = 'confirmed'`, `tx_hash` present

### 4. Check Holdings Updated
```sql
SELECT * FROM user_holdings 
WHERE user_id = 'YOUR_USER_ID';
```

Expected: `quantity` increased, `blockchain_verified = true`

---

## 📊 Check Logs

### Server Console
Look for these logs:
```
[Trade Execute] Creating order...
[Trade Execute] ✓ Order created: xxx
[Razorpay] Creating payment order: xxx
[Razorpay] Order created: xxx
[Payment Verify] Verifying payment: xxx
[Payment Verify] ✓ Payment verified
[Trade Executor] Starting token transfer...
[Trade Executor] ✓ Buyer KYC verified on-chain
[Trade Executor] ✓ Transfer allowed by compliance
[Trade Executor] Transaction submitted: 0x...
[Trade Executor] ✅ Transaction confirmed
[Trade Executor] ✅ Trade execution complete
```

### Browser Console
```
[Buy] Creating order...
[Buy] Order created: xxx
[Buy] Opening Razorpay payment...
[Buy] Payment successful: xxx
[Buy] ✅ Trade completed!
```

---

## 🎯 Expected Results

### After Successful Purchase:

1. **Database:**
   - ✅ Order status: `completed`
   - ✅ Payment status: `completed`
   - ✅ Blockchain tx: `confirmed`
   - ✅ Holdings: Updated

2. **UI:**
   - ✅ Success alert shown
   - ✅ Transaction hash displayed
   - ✅ Holdings page shows tokens
   - ✅ Blockchain verified badge

3. **Blockchain:**
   - ✅ Transaction on explorer
   - ✅ Tokens in user's wallet
   - ✅ Balance matches database

---

## 🐛 Troubleshooting

### Issue: "KYC Required" Error
**Solution:**
1. Go to `/settings/kyc`
2. Upload documents
3. Admin approves from `/admin/kyc`
4. Try buying again

### Issue: Payment Modal Not Opening
**Solution:**
1. Check browser console for errors
2. Ensure Razorpay script loaded
3. Check `.env.local` has `NEXT_PUBLIC_RAZORPAY_KEY_ID`
4. Restart dev server

### Issue: "Payment Verification Failed"
**Solution:**
1. Check server logs
2. Verify webhook secret matches
3. Check Razorpay dashboard for payment status
4. Contact support if payment succeeded but verification failed

### Issue: "Blockchain Execution Failed"
**Solution:**
1. Check platform wallet has MATIC for gas
2. Check platform wallet has tokens to transfer
3. Verify user is KYC verified on-chain
4. Check RPC URL is correct
5. View transaction on explorer for error details

### Issue: Holdings Not Updated
**Solution:**
1. Click "Sync" button on holdings page
2. Check blockchain transaction confirmed
3. Verify token_id matches in orders and tokens tables
4. Check user_wallets table has wallet for user

---

## 📈 Performance Metrics

### Expected Times:
- Order creation: < 1 second
- Payment page load: < 2 seconds
- Payment processing: 5-10 seconds
- Blockchain execution: 30-60 seconds
- Total flow: ~1-2 minutes

---

## ✅ Success Checklist

After testing, verify:

- [ ] Can create order
- [ ] Razorpay payment page opens
- [ ] Can complete payment with test card
- [ ] Payment verification succeeds
- [ ] Blockchain transaction executes
- [ ] Transaction appears on explorer
- [ ] Holdings page shows tokens
- [ ] Blockchain verified badge shows
- [ ] Can sync holdings from blockchain
- [ ] Notifications received

---

## 🎉 Next Steps

Once testing is successful:

1. **Add More Tokens** - Create more tokens in marketplace
2. **Test Sell Flow** - Implement sell functionality
3. **Test Multiple Users** - Create multiple investor accounts
4. **Monitor Performance** - Check response times
5. **Production Deployment** - Deploy to Vercel

---

## 📞 Support

### Check These First:
1. Server logs (`npm run dev` console)
2. Browser console (F12)
3. Supabase logs (Dashboard → Logs)
4. Razorpay dashboard (Payments tab)
5. Blockchain explorer (search tx hash)

### Common Commands:
```bash
# Restart server
npm run dev

# Check database
# Go to Supabase → SQL Editor

# View logs
# Check terminal running npm run dev

# Clear cache
# Ctrl+Shift+R in browser
```

---

**🚀 You're ready to test! Start with Step 1 and follow the flow.**

**💡 Tip:** Keep browser console and server logs open while testing to see real-time progress.
