# 🪙 TokenPlatform - Asset Tokenization Platform

A comprehensive prototype for tokenizing real-world assets on blockchain with regulatory compliance features. Built for IFSCA/GIFT City and RBI sandbox readiness.

## ⚠️ Important Notice

**This is a PROTOTYPE for demonstration and sandbox testing only.**
- All transactions use simulated payments (demo balance, mock CBDC/UPI)
- Deployed on Polygon Mumbai testnet (no real money)
- Not for production use without proper regulatory approvals

## 🎯 Features

### Core Functionality
- ✅ **User Authentication** - JWT-based auth with 2FA support
- ✅ **KYC Workflow** - Simulated KYC approval by admins
- ✅ **Token Issuance** - Upload documents, compute SHA-256 hashes, mint on blockchain
- ✅ **Trading Simulation** - Order book with buy/sell execution
- ✅ **Portfolio Management** - Track holdings and transaction history
- ✅ **Admin Panel** - Approve tokens, manage KYC, freeze/unfreeze tokens
- ✅ **Hash Verification** - Public tool to verify document authenticity
- ✅ **Audit Logs** - Immutable compliance trail

### Blockchain Integration
- **Network**: Polygon Mumbai Testnet (Chain ID: 80001)
- **Smart Contract**: ERC-20 compatible SecurityToken with compliance features
- **Features**: Freeze/unfreeze accounts, whitelist management, metadata anchoring

### Security & Compliance
- 🔐 Password hashing (bcrypt)
- 🔐 2FA authentication (TOTP)
- 🔐 Role-based access control (RBAC)
- 🔐 SHA-256 document hashing
- 🔐 On-chain metadata anchoring
- 📊 Comprehensive audit logging

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React, TailwindCSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL (Supabase)
- **Blockchain**: Polygon Mumbai, Ethers.js, Hardhat
- **Authentication**: JWT, Speakeasy (2FA)
- **Deployment**: Vercel (frontend), Railway (backend)

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Alchemy account (free tier)
- Supabase account (free tier)
- MetaMask or similar wallet (for testnet)

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd windsurf-project
npm install
```

### 2. Environment Setup

Create `.env.local` file in the root directory:

```env
# Blockchain
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_ALCHEMY_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
NEXTAUTH_SECRET=your-super-secret-nextauth-key-min-32-chars
NEXTAUTH_URL=http://localhost:3000

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Database Setup

Database schema is automatically created via Supabase migrations. Tables include:
- `users` - User accounts with KYC status
- `tokens` - Tokenized assets
- `orders` - Trading orders
- `transactions` - Settlement records
- `portfolios` - User holdings
- `audit_logs` - Compliance logs

### 4. Get Testnet Tokens

1. Visit https://faucet.polygon.technology/
2. Enter your wallet address
3. Request testnet MATIC (needed for gas fees)

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
windsurf-project/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── tokens/            # Token issuance
│   │   ├── trading/           # Order placement
│   │   ├── portfolio/         # User holdings
│   │   ├── admin/             # Admin operations
│   │   └── verify/            # Hash verification
│   ├── page.tsx               # Landing page
│   └── layout.tsx             # Root layout
├── lib/
│   ├── supabase/              # Database client
│   ├── blockchain/            # Smart contract interaction
│   └── utils/                 # Utilities (auth, hash)
├── contracts/
│   └── SecurityToken.sol      # ERC-20 token contract
└── hardhat.config.ts          # Blockchain config
```

## 📚 Documentation

- **README.md** Comprehensive project overview
- **SETUP_GUIDE.md** Step-by-step environment preparation
- **PROJECT_SUMMARY.md** Executive summary and technical highlights
- **docs/UserFlowGuide.md** Persona-specific walkthroughs for investors, issuers, admins, and auditors
- **docs/RegulatorArchitecture.md** Architecture brief for regulators and government stakeholders
- **docs/ImplementationRoadmap.md** ERC-3643 adoption and enhancement timeline

## 🔑 User Roles

1. **Investor** - Register, complete KYC, trade tokens
2. **Issuer** - Create token issuance requests
3. **Admin** - Approve KYC, approve tokens, freeze/unfreeze
4. **Auditor** - Read-only access to audit logs

## 🎮 Usage Guide

### For Investors

1. **Register**: Create account at `/auth/register`
2. **KYC**: Wait for admin approval (simulated)
3. **Trade**: Browse tokens and place buy/sell orders
4. **Portfolio**: View holdings at `/portfolio`

### For Issuers

1. **Register** as issuer role
2. **Submit Token**: Upload asset documents
3. **Wait for Approval**: Admin reviews and mints token
4. **Track Status**: Monitor issuance status

### For Admins

1. **Approve KYC**: Review and approve user KYC
2. **Approve Tokens**: Review documents, approve minting
3. **Freeze Tokens**: Compliance actions
4. **Export Logs**: Download audit reports

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Tokens
- `POST /api/tokens/issue` - Submit token issuance
- `GET /api/tokens/issue` - List tokens

### Trading
- `POST /api/trading/place-order` - Place buy/sell order
- `GET /api/trading/place-order` - Get user orders

### Admin
- `POST /api/admin/kyc-approval` - Approve/reject KYC
- `POST /api/admin/approve-token` - Approve token & deploy
- `POST /api/admin/freeze-token` - Freeze/unfreeze token

### Verification
- `POST /api/verify/hash` - Verify document hash
- `GET /api/verify/hash?tokenId=xxx` - Get token details

## 🧪 Testing

### Manual Testing Checklist

- [ ] User registration and login
- [ ] KYC approval workflow
- [ ] Token issuance submission
- [ ] Admin token approval and blockchain deployment
- [ ] Order placement and execution
- [ ] Portfolio balance updates
- [ ] Hash verification tool
- [ ] Audit log generation

### Smart Contract Testing

```bash
npx hardhat test
npx hardhat coverage
```

## 🚢 Deployment

### Frontend (Vercel)

```bash
vercel deploy
```

### Backend (Railway)

1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

## 📊 Database Schema

Key tables and relationships documented in `/lib/supabase/client.ts`

## 🔒 Security Considerations

### Current Implementation (Prototype)
- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ 2FA support
- ✅ Role-based access control
- ✅ Audit logging

### Production Requirements
- 🔲 VAPT audit
- 🔲 ISO 27001 certification
- 🔲 Hardware Security Module (HSM) for key storage
- 🔲 Multi-signature wallet for admin operations
- 🔲 Rate limiting and DDoS protection
- 🔲 SIEM integration
- 🔲 Data encryption at rest

## 📝 Next Steps for Production

1. **Regulatory Approval**
   - Submit to IFSCA/GIFT City sandbox
   - Obtain RBI sandbox approval (if needed)

2. **Security Hardening**
   - Complete VAPT audit
   - Implement HSM for key management
   - Set up SIEM monitoring

3. **Real Integrations**
   - KYC provider (Signzy/IDfy)
   - UPI gateway (Razorpay)
   - CBDC sandbox connection
   - Custody partner (Fireblocks/Liminal)

4. **Legal & Compliance**
   - Incorporate legal entity
   - Engage fintech legal counsel
   - Obtain necessary licenses

## 🤝 Contributing

This is a prototype project. For production deployment, consult with:
- Blockchain security auditors
- Fintech legal counsel
- Regulatory compliance experts

## 📄 License

Proprietary - For demonstration purposes only

## 📞 Support

For questions about sandbox applications:
- IFSCA: https://ifsca.gov.in/
- RBI Sandbox: https://www.rbi.org.in/

## ⚡ Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Blockchain
npx hardhat compile     # Compile smart contracts
npx hardhat test        # Run contract tests
npx hardhat run scripts/deploy.ts --network mumbai  # Deploy to testnet

# Database
# Migrations are handled via Supabase MCP
```

## 🎨 Design System

**Color Palette:**
- Primary Blue: `#0B67FF`
- Secondary Blue: `#2D9CDB`
- Background: `#FFFFFF`
- Cards: `#F4F7FB`
- Success: `#16A34A`
- Warning: `#F59E0B`
- Danger: `#EF4444`

---

**Built with ❤️ for the future of asset tokenization**
