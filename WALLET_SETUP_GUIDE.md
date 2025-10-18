# 🔐 WALLET SETUP GUIDE FOR BLOCKCHAIN DEPLOYMENT

## Why You Need a Wallet

To deploy smart contracts to blockchain, you need:
1. **Wallet Address** - Your blockchain identity
2. **Private Key** - To sign transactions (KEEP SECRET!)
3. **Testnet MATIC** - For gas fees (free from faucet)

---

## 🎯 OPTION 1: MetaMask (RECOMMENDED - Easiest)

### Step 1: Install MetaMask

1. Go to **https://metamask.io/**
2. Click **"Download"**
3. Install browser extension (Chrome/Firefox/Brave)
4. Click the extension icon

### Step 2: Create New Wallet

1. Click **"Create a new wallet"**
2. Agree to terms
3. Create a strong password
4. Click **"Create a new wallet"**

### Step 3: Save Recovery Phrase

**⚠️ CRITICAL - DO THIS CAREFULLY!**

1. You'll see 12 words (recovery phrase)
2. **Write them down on paper** (in order!)
3. Store paper in a safe place
4. **NEVER share these words with anyone!**
5. **NEVER take a screenshot or save digitally!**
6. Click **"Next"**
7. Confirm the words in correct order
8. Click **"Confirm"**

### Step 4: Add Polygon Mumbai Network

1. Open MetaMask
2. Click network dropdown (top left, says "Ethereum Mainnet")
3. Click **"Add network"**
4. Click **"Add network manually"**
5. Fill in these details:

```
Network Name: Polygon Mumbai
New RPC URL: https://rpc-mumbai.maticvigil.com/
Chain ID: 80001
Currency Symbol: MATIC
Block Explorer URL: https://mumbai.polygonscan.com/
```

6. Click **"Save"**
7. Switch to "Polygon Mumbai" network

### Step 5: Get Your Wallet Address

1. Click MetaMask extension
2. Your address is at the top (starts with 0x...)
3. Click to copy
4. Example: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

### Step 6: Get Your Private Key

**⚠️ NEVER SHARE THIS WITH ANYONE!**

1. Click MetaMask extension
2. Click three dots (⋮) at top right
3. Click **"Account details"**
4. Click **"Show private key"**
5. Enter your MetaMask password
6. Click **"Confirm"**
7. **Copy the private key** (starts with 0x...)
8. Example: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`

### Step 7: Update .env.local

Open your `.env.local` file and add:

```env
DEPLOYER_PRIVATE_KEY=0x1234...your-actual-private-key...
DEPLOYER_ADDRESS=0x742d...your-actual-wallet-address...
```

### Step 8: Get Testnet MATIC

1. Go to **https://faucet.polygon.technology/**
2. Select **"Mumbai"** network
3. Select **"MATIC Token"**
4. Paste your wallet address
5. Complete CAPTCHA
6. Click **"Submit"**
7. Wait 1-2 minutes
8. Check MetaMask - you should see 0.5 MATIC

**Alternative Faucets (if first one doesn't work):**
- https://mumbaifaucet.com/
- https://faucet.quicknode.com/polygon/mumbai
- https://testmatic.vercel.app/

✅ **Done! You're ready to deploy smart contracts!**

---

## 🎯 OPTION 2: Generate Wallet via Command Line

### Step 1: Generate New Wallet

Open terminal in your project folder:

```bash
node -e "const ethers = require('ethers'); const wallet = ethers.Wallet.createRandom(); console.log('Wallet Address:', wallet.address); console.log('Private Key:', wallet.privateKey); console.log('Mnemonic:', wallet.mnemonic.phrase);"
```

**Output will look like:**
```
Wallet Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Private Key: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
Mnemonic: word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12
```

### Step 2: Save Credentials

**⚠️ IMPORTANT:**
1. Copy the **Mnemonic** (12 words) to paper
2. Store in a safe place
3. Copy **Wallet Address** and **Private Key**

### Step 3: Update .env.local

```env
DEPLOYER_PRIVATE_KEY=0x1234...paste-private-key...
DEPLOYER_ADDRESS=0x742d...paste-wallet-address...
```

### Step 4: Get Testnet MATIC

1. Go to https://faucet.polygon.technology/
2. Paste your **Wallet Address**
3. Get testnet MATIC

✅ **Done!**

---

## 🎯 OPTION 3: Use Existing Wallet

If you already have a wallet (MetaMask, Trust Wallet, etc.):

### Step 1: Export Private Key

**MetaMask:**
1. Three dots → Account details → Show private key

**Trust Wallet:**
1. Settings → Wallets → [Your Wallet] → Show Recovery Phrase
2. Use recovery phrase to import into MetaMask
3. Then export private key from MetaMask

### Step 2: Add to .env.local

```env
DEPLOYER_PRIVATE_KEY=0x...your-private-key...
DEPLOYER_ADDRESS=0x...your-wallet-address...
```

### Step 3: Ensure You Have Testnet MATIC

Check balance at: https://mumbai.polygonscan.com/address/YOUR_ADDRESS

If zero, get from faucet: https://faucet.polygon.technology/

---

## ✅ VERIFICATION CHECKLIST

Before deploying, verify:

- [ ] MetaMask installed and wallet created
- [ ] Polygon Mumbai network added
- [ ] Wallet address copied to `.env.local`
- [ ] Private key copied to `.env.local`
- [ ] Testnet MATIC received (check MetaMask)
- [ ] Recovery phrase written on paper and stored safely

---

## 🧪 TEST YOUR WALLET

Run this command to verify your wallet is configured:

```bash
npx hardhat run scripts/deploy-test.js --network mumbai
```

**Expected Output:**
```
🚀 Starting SecurityToken deployment...
📝 Deploying with account: 0x742d35Cc...
💰 Account balance: 0.5 MATIC
⏳ Deploying contract...
✅ SUCCESS! Token deployed!
📍 Contract Address: 0xABC123...
```

**If you see "No testnet MATIC":**
- Get MATIC from faucet
- Wait a few minutes
- Try again

**If you see "Invalid private key":**
- Check `.env.local` has correct format
- Private key should start with `0x`
- No spaces or quotes around the key

---

## 🔒 SECURITY BEST PRACTICES

### ✅ DO:
- ✅ Write recovery phrase on paper
- ✅ Store paper in safe/secure location
- ✅ Use strong MetaMask password
- ✅ Keep private key in `.env.local` only
- ✅ Add `.env.local` to `.gitignore`
- ✅ Use different wallets for testnet and mainnet

### ❌ DON'T:
- ❌ Share private key with anyone
- ❌ Screenshot recovery phrase
- ❌ Store recovery phrase digitally
- ❌ Commit `.env.local` to git
- ❌ Use same wallet for real money (mainnet)
- ❌ Share your screen while private key is visible

---

## 💰 TESTNET vs MAINNET

### Testnet (Mumbai) - FREE
- **Purpose**: Testing and development
- **MATIC**: Free from faucet
- **Risk**: Zero (not real money)
- **Use for**: This prototype

### Mainnet (Polygon) - REAL MONEY
- **Purpose**: Production deployment
- **MATIC**: Buy from exchange
- **Risk**: Real money at stake
- **Use for**: After regulatory approval

**For this project, ONLY use Mumbai testnet!**

---

## 📞 TROUBLESHOOTING

### "Insufficient funds for deployment"

**Solution:**
1. Check MetaMask shows testnet MATIC
2. Make sure you're on Mumbai network
3. Get more MATIC from faucet
4. Wait 2-3 minutes and try again

### "Invalid private key"

**Solution:**
1. Check `.env.local` format
2. Private key should be 66 characters (including 0x)
3. No spaces or quotes
4. Copy directly from MetaMask

### "Network connection failed"

**Solution:**
1. Check Alchemy RPC URL in `.env.local`
2. Verify Alchemy API key is correct
3. Try alternative RPC: `https://rpc-mumbai.maticvigil.com/`

### "Transaction failed"

**Solution:**
1. Check you have enough MATIC for gas
2. Increase gas limit in hardhat.config.ts
3. Wait a few minutes and retry

---

## 🎉 YOU'RE READY!

Once you have:
- ✅ Wallet created
- ✅ Private key in `.env.local`
- ✅ Testnet MATIC in wallet
- ✅ Test deployment successful

**You can now deploy tokens from the admin dashboard!**

---

## 📚 ADDITIONAL RESOURCES

- **MetaMask Guide**: https://metamask.io/faqs/
- **Polygon Faucet**: https://faucet.polygon.technology/
- **Mumbai Explorer**: https://mumbai.polygonscan.com/
- **Hardhat Docs**: https://hardhat.org/tutorial

---

**Need help? Check the COMPLETE_SETUP_GUIDE.md for full instructions!**
