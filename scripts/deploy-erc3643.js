/**
 * ERC-3643 Token Deployment Script
 * Deploys ERC3643Token, IdentityRegistry, and ComplianceModule to Polygon Amoy
 */

const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting ERC-3643 Deployment to Polygon Amoy...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MATIC");

  // Step 1: Deploy Identity Registry
  console.log("\n📋 Step 1: Deploying Identity Registry...");
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.waitForDeployment();
  console.log("✅ IdentityRegistry deployed to:", await identityRegistry.getAddress());

  // Step 2: Deploy Compliance Module (needs registry address)
  console.log("\n📋 Step 2: Deploying Compliance Module...");
  const ComplianceModule = await ethers.getContractFactory("ComplianceManager");
  const compliance = await ComplianceModule.deploy(await identityRegistry.getAddress());
  await compliance.waitForDeployment();
  console.log("✅ ComplianceModule deployed to:", await compliance.getAddress());

  // Step 3: Deploy ERC-3643 Token
  console.log("\n📋 Step 3: Deploying ERC-3643 Token...");
  const ERC3643Token = await ethers.getContractFactory("ERC3643Token");
  const token = await ERC3643Token.deploy(
    "TokenPlatform Security Token", // name
    "TPST",                         // symbol
    await identityRegistry.getAddress(),       // identity registry
    await compliance.getAddress()              // compliance module
  );
  await token.waitForDeployment();
  console.log("✅ ERC3643Token deployed to:", await token.getAddress());

  // Step 4: Configure contracts
  console.log("\n📋 Step 4: Configuring contracts...");
  
  // Mint initial supply (for testing)
  const initialSupply = ethers.parseEther("1000000"); // 1M tokens
  await token.mint(deployer.address, initialSupply);
  console.log("✅ Minted initial supply:", ethers.formatEther(initialSupply), "tokens");

  // Step 5: Save deployment info
  console.log("\n📋 Step 5: Saving deployment information...");
  const identityRegistryAddress = await identityRegistry.getAddress();
  const complianceAddress = await compliance.getAddress();
  const tokenAddress = await token.getAddress();
  
  const deploymentInfo = {
    network: "polygon-amoy",
    chainId: 80002,
    timestamp: new Date().toISOString(),
    contracts: {
      identityRegistry: identityRegistryAddress,
      compliance: complianceAddress,
      token: tokenAddress
    },
    deployer: deployer.address,
    tokenInfo: {
      name: "TokenPlatform Security Token",
      symbol: "TPST",
      decimals: 18,
      initialSupply: ethers.formatEther(initialSupply)
    }
  };

  const fs = require('fs');
  fs.writeFileSync(
    'deployment-erc3643.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("✅ Deployment info saved to deployment-erc3643.json");

  // Step 6: Verification info
  console.log("\n📋 Step 6: Contract Verification Commands:");
  console.log("\nIdentityRegistry:");
  console.log(`npx hardhat verify --network amoy ${identityRegistryAddress}`);
  console.log("\nComplianceModule:");
  console.log(`npx hardhat verify --network amoy ${complianceAddress} ${identityRegistryAddress}`);
  console.log("\nERC3643Token:");
  console.log(`npx hardhat verify --network amoy ${tokenAddress} "TokenPlatform Security Token" "TPST" ${identityRegistryAddress} ${complianceAddress}`);

  console.log("\n✅ Deployment Complete!\n");
  console.log("📊 Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("IdentityRegistry:", identityRegistryAddress);
  console.log("ComplianceModule:", complianceAddress);
  console.log("ERC3643Token:    ", tokenAddress);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🔗 View on PolygonScan:");
  console.log(`https://amoy.polygonscan.com/address/${tokenAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
