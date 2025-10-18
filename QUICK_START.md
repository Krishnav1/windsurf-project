# ⚡ Quick Start Guide

Get the tokenization platform running in **5 minutes**.

---

## ✅ Prerequisites Check

Before starting, verify you have:
- ✅ `.env.local` file created with all credentials
- ✅ Node.js installed (`node --version`)
- ✅ Dependencies installed (`npm install` already run)

---

## 🚀 Start the Application

### 1. Open Terminal

Navigate to project directory:
```bash
cd c:\Users\kvarm\OneDrive\Desktop\Token\CascadeProjects\windsurf-project
```

### 2. Start Development Server

```bash
npm run dev
```

You should see:
```
▲ Next.js 15.5.6
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Starting...
✓ Ready in 2.5s
```

### 3. Open Browser

Visit: **http://localhost:3000**

You should see the landing page with:
- Blue and white theme
- "TokenPlatform" header
- "Tokenize Real-World Assets" headline
- "Get Started" and "Explore Tokens" buttons

---

## 🎯 Test Basic Features

### Register Your First User

1. Click **"Get Started"** or **"Create Account"**
2. Fill in:
   - **Email**: `admin@test.com`
   - **Password**: `Admin123!` (must have uppercase, lowercase, number)
   - **Full Name**: `Admin User`
   - **Role**: Select **"Admin"** (for testing admin features)
3. Click **"Register"**

**Expected Result**: Success message with user details

### Login

1. Go to `/auth/login`
2. Enter credentials
3. Click **"Login"**

**Expected Result**: JWT token received, redirected to dashboard

---

## 🔧 Common Issues & Fixes

### Port 3000 Already in Use

```bash
# Kill existing process
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### Database Connection Error

**Error**: "Database connection not available"

**Fix**:
1. Check `.env.local` has correct Supabase credentials
2. Verify Supabase project is active
3. Check `SUPABASE_SERVICE_ROLE_KEY` is set

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### TypeScript Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

---

## 📊 Verify Database Setup

### Check Supabase Tables

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **"Table Editor"** (left sidebar)
4. Verify these tables exist:
   - ✅ `users`
   - ✅ `tokens`
   - ✅ `orders`
   - ✅ `transactions`
   - ✅ `portfolios`
   - ✅ `audit_logs`

**If tables are missing**: They were created via Supabase MCP during build. Check Supabase logs.

---

## 🧪 Quick Feature Test

### Test User Registration API

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "fullName": "Test User",
    "role": "investor"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "fullName": "Test User",
    "role": "investor",
    "walletAddress": "0x...",
    "kycStatus": "pending"
  }
}
```

---

## 📱 Access Different Pages

Once server is running:

- **Landing Page**: http://localhost:3000
- **Login**: http://localhost:3000/auth/login
- **Register**: http://localhost:3000/auth/register
- **Dashboard**: http://localhost:3000/dashboard (after login)
- **Portfolio**: http://localhost:3000/portfolio (after login)
- **Admin Panel**: http://localhost:3000/admin (admin only)
- **Token Explorer**: http://localhost:3000/explorer

---

## 🎮 Next Steps

### Create Admin User

To test admin features:

1. Register a user (as shown above)
2. Go to Supabase dashboard
3. **Table Editor** → **users**
4. Find your user
5. Edit row:
   - Change `role` to `admin`
   - Change `kyc_status` to `approved`
6. Save
7. Login with this account

Now you can:
- Approve KYC requests
- Approve token issuances
- Freeze/unfreeze tokens
- View audit logs

### Test Token Issuance

1. Register as **issuer** role
2. Go to token issuance page
3. Fill in token details
4. Upload documents (any PDF/image)
5. Submit
6. Login as admin
7. Approve the token
8. Token will be minted on Polygon Mumbai testnet

---

## 📖 Full Documentation

For complete documentation:
- **Setup Guide**: `SETUP_GUIDE.md`
- **Project Summary**: `PROJECT_SUMMARY.md`
- **Main README**: `README.md`

---

## 🆘 Need Help?

### Check Logs

**Browser Console**:
- Open DevTools (F12)
- Check Console tab for errors

**Server Logs**:
- Check terminal where `npm run dev` is running
- Look for error messages

### Common Solutions

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Restart dev server** (Ctrl+C, then `npm run dev`)
3. **Check all environment variables** in `.env.local`
4. **Verify Supabase project is active**
5. **Ensure you have testnet MATIC** (for blockchain operations)

---

## ✅ Success Checklist

- [ ] Server starts without errors
- [ ] Landing page loads
- [ ] Can register new user
- [ ] Can login
- [ ] Database tables exist
- [ ] API endpoints respond

**If all checked**: ✅ **Your platform is ready!**

---

## 🚀 Ready to Build!

Your tokenization platform is now running. Start testing features and building your demo!

**Happy coding! 🎉**
