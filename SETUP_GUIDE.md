# 🚀 Complete Setup Guide - TokenPlatform

This guide will walk you through setting up the tokenization platform from scratch.

## ⏱️ Estimated Time: 30-45 minutes

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js 18+ installed ([Download](https://nodejs.org/))
- [ ] Git installed
- [ ] Code editor (VS Code recommended)
- [ ] MetaMask browser extension ([Install](https://metamask.io/))
- [ ] Email account for service signups

---

## 🔧 Step-by-Step Setup

### Step 1: Get Alchemy API Key (5 minutes)

Alchemy provides blockchain RPC access for free.

1. Go to [https://www.alchemy.com/](https://www.alchemy.com/)
2. Click **"Sign Up"** (top right)
3. Create account with email
4. After login, click **"Create new app"**
5. Fill in:
   - **Name**: TokenPlatform
   - **Chain**: Polygon
   - **Network**: Polygon Mumbai (Testnet)
6. Click **"Create app"**
7. Click on your app name
8. Click **"View Key"** button
9. **Copy** the following:
   - API KEY: `mylZASI9E40wvKQbVnrf1` (example)
   - HTTPS URL: `https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY`

✅ **Save these values** - you'll need them later

---

### Step 2: Set Up Supabase Database (10 minutes)

Supabase provides PostgreSQL database with free tier.

1. Go to [https://supabase.com/](https://supabase.com/)
2. Click **"Start your project"**
3. Sign up with GitHub or email
4. Click **"New project"**
5. Fill in:
   - **Organization**: Create new or select existing
   - **Name**: `tokenization-platform`
   - **Database Password**: Create strong password (save it!)
   - **Region**: `Mumbai (ap-south-1)` (for India)
   - **Pricing Plan**: Free
6. Click **"Create new project"**
7. Wait 2-3 minutes for project initialization
8. Once ready, go to **Settings** → **API**
9. **Copy** the following:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (long string)
   - **service_role key**: `eyJhbGc...` (different long string)
10. Go to **Settings** → **Database**
11. Scroll to **Connection string** → **URI**
12. **Copy** the connection string (replace `[YOUR-PASSWORD]` with your database password)

✅ **Save all these values**

---

### Step 3: Create MetaMask Wallet (5 minutes)

You need a wallet to deploy smart contracts.

1. Install MetaMask browser extension
2. Click **"Create a new wallet"**
3. Create password
4. **IMPORTANT**: Write down your 12-word recovery phrase on paper
   - Store it safely - this is your only backup!
5. Confirm recovery phrase
6. Wallet created!

#### Add Polygon Mumbai Network

1. Click MetaMask extension
2. Click network dropdown (top left)
3. Click **"Add network"** → **"Add network manually"**
4. Fill in:
   - **Network Name**: Polygon Mumbai
   - **RPC URL**: `https://rpc-mumbai.maticvigil.com/`
   - **Chain ID**: `80001`
   - **Currency Symbol**: MATIC
   - **Block Explorer**: `https://mumbai.polygonscan.com/`
5. Click **"Save"**
6. Switch to Polygon Mumbai network

#### Get Your Private Key (⚠️ Keep Secret!)

1. Click MetaMask extension
2. Click three dots (top right) → **"Account details"**
3. Click **"Show private key"**
4. Enter your password
5. **Copy** private key (starts with `0x...`)

⚠️ **NEVER share this with anyone!**

#### Get Free Testnet MATIC

1. Go to [https://faucet.polygon.technology/](https://faucet.polygon.technology/)
2. Select **"Mumbai"** network
3. Select **"MATIC Token"**
4. Paste your wallet address (copy from MetaMask)
5. Click **"Submit"**
6. Wait 1-2 minutes
7. Check MetaMask - you should see testnet MATIC

✅ **You now have testnet tokens for gas fees**

---

### Step 4: Generate JWT Secrets (2 minutes)

You need random secrets for authentication.

#### Option A: Using PowerShell (Windows)

```powershell
# Run this command twice to get two different secrets
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

#### Option B: Using Online Tool

1. Go to [https://generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)
2. Click **"Generate"** twice
3. Copy both secrets

✅ **Save both secrets**

---

### Step 5: Configure Environment Variables (5 minutes)

1. Open your project folder
2. You should already have `.env.local` file created
3. Open it and fill in all the values you collected:

```env
# Blockchain (from Step 1)
NEXT_PUBLIC_ALCHEMY_API_KEY=mylZASI9E40wvKQbVnrf1
NEXT_PUBLIC_ALCHEMY_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/mylZASI9E40wvKQbVnrf1

# Supabase (from Step 2)
NEXT_PUBLIC_SUPABASE_URL=https://gviwynyikaaxcjjvuedg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key...
DATABASE_URL=postgresql://postgres:YourPassword@db.xxxxx.supabase.co:5432/postgres

# Wallet (from Step 3)
DEPLOYER_PRIVATE_KEY=0x...your-private-key...
DEPLOYER_ADDRESS=0x...your-wallet-address...

# Authentication (from Step 4)
JWT_SECRET=your-first-generated-secret
NEXTAUTH_SECRET=your-second-generated-secret
NEXTAUTH_URL=http://localhost:3000

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

4. **Save** the file

✅ **Environment configured**

---

### Step 6: Install Dependencies (3 minutes)

Open terminal in project folder:

```bash
npm install
```

Wait for installation to complete.

---

### Step 7: Verify Database Setup (2 minutes)

The database tables were already created via Supabase MCP during the build process. To verify:

1. Go to Supabase dashboard
2. Click **"Table Editor"** (left sidebar)
3. You should see these tables:
   - `users`
   - `tokens`
   - `orders`
   - `transactions`
   - `portfolios`
   - `audit_logs`

✅ **Database ready**

---

### Step 8: Compile Smart Contracts (3 minutes)

```bash
npx hardhat compile
```

You should see:
```
Compiled 1 Solidity file successfully
```

✅ **Smart contracts compiled**

---

### Step 9: Start Development Server (1 minute)

```bash
npm run dev
```

You should see:
```
▲ Next.js 15.5.6
- Local:        http://localhost:3000
```

---

### Step 10: Test the Application (5 minutes)

1. Open browser: [http://localhost:3000](http://localhost:3000)
2. You should see the landing page with blue theme
3. Click **"Get Started"** or **"Create Account"**
4. Register a new user:
   - Email: `test@example.com`
   - Password: `Test1234` (must have uppercase, lowercase, number)
   - Full Name: `Test User`
   - Role: Select "Investor"
5. Click **"Register"**
6. You should see success message

✅ **Application is working!**

---

## 🎯 Next Steps

### Create Admin User

To test admin features, you need to manually set a user as admin:

1. Go to Supabase dashboard
2. Click **"Table Editor"** → **"users"**
3. Find your test user
4. Click to edit
5. Change `role` from `investor` to `admin`
6. Change `kyc_status` to `approved`
7. Save

Now log in with this account to access admin features.

---

## 🧪 Testing Checklist

Test these features to ensure everything works:

### User Features
- [ ] User registration
- [ ] User login
- [ ] View portfolio (empty initially)

### Admin Features (after creating admin user)
- [ ] View pending KYC requests
- [ ] Approve user KYC
- [ ] View pending token issuances

### Issuer Features (create issuer user)
- [ ] Submit token issuance request
- [ ] Upload documents
- [ ] View issuance status

### Trading Features (after KYC approval)
- [ ] View active tokens
- [ ] Place buy order
- [ ] View order history
- [ ] Check portfolio balance

---

## 🐛 Troubleshooting

### "Database connection not available"
- Check Supabase credentials in `.env.local`
- Verify Supabase project is active
- Check `SUPABASE_SERVICE_ROLE_KEY` is correct

### "Insufficient funds for deployment"
- Get more testnet MATIC from faucet
- Wait a few minutes and try again
- Check wallet has testnet MATIC in MetaMask

### "Failed to deploy token"
- Ensure you have testnet MATIC
- Check `DEPLOYER_PRIVATE_KEY` is correct
- Verify Alchemy RPC URL is correct

### Port 3000 already in use
```bash
# Kill existing process
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### TypeScript errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

---

## 📞 Getting Help

If you encounter issues:

1. Check the error message carefully
2. Verify all environment variables are correct
3. Ensure all services (Supabase, Alchemy) are active
4. Check you have testnet MATIC in your wallet

---

## ✅ Setup Complete!

You now have a fully functional tokenization platform running locally.

**What you can do:**
- Register users with different roles
- Submit token issuance requests
- Approve tokens and mint on blockchain
- Trade tokens with simulated settlement
- View audit logs and transaction history

**Next:** Read the main README.md for detailed API documentation and usage guide.

---

**🎉 Congratulations! Your platform is ready for testing.**
