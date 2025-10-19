/**
 * Test Deployment Script
 * 
 * Deploys a test SecurityToken to Polygon Mumbai testnet
 * Run: npx hardhat run scripts/deploy-test.js --network mumbai
 */

const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting SecurityToken deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MATIC\n");

  if (balance === 0n) {
    console.error("❌ ERROR: No testnet MATIC in wallet!");
    console.log("Get testnet MATIC from: https://faucet.polygon.technology/\n");
    process.exit(1);
  }

  // Token parameters
  const tokenName = "Test Real Estate Token";
  const tokenSymbol = "TREST";
  const totalSupply = hre.ethers.parseUnits("1000000", 8); // 1 million tokens with 8 decimals
  const decimals = 8;
  const assetType = "real-estate";
  const metadataHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

  console.log("📋 Token Parameters:");
  console.log("   Name:", tokenName);
  console.log("   Symbol:", tokenSymbol);
  console.log("   Total Supply:", hre.ethers.formatUnits(totalSupply, decimals));
  console.log("   Decimals:", decimals);
  console.log("   Asset Type:", assetType);
  console.log("   Metadata Hash:", metadataHash);
  console.log();

  // Deploy contract
  console.log("⏳ Deploying contract...");
  const SecurityToken = await hre.ethers.getContractFactory("SecurityToken");
  const token = await SecurityToken.deploy(
    tokenName,
    tokenSymbol,
    totalSupply,
    decimals,
    assetType,
    metadataHash
  );

  console.log("⏳ Waiting for deployment transaction...");
  await token.waitForDeployment();
  
  console.log("⏳ Waiting for 2 block confirmations...");
  await token.deploymentTransaction().wait(2);

  const contractAddress = await token.getAddress();
  const deploymentTx = token.deploymentTransaction();

  console.log("\n✅ SUCCESS! Token deployed!\n");
  console.log("📍 Contract Address:", contractAddress);
  console.log("🔗 Transaction Hash:", deploymentTx?.hash);
  console.log("🔢 Block Number:", deploymentTx?.blockNumber);
  console.log();
  console.log("🔍 View on Explorer:");
  console.log("   Contract:", `https://mumbai.polygonscan.com/address/${contractAddress}`);
  console.log("   Transaction:", `https://mumbai.polygonscan.com/tx/${deploymentTx?.hash}`);
  console.log();

  // Verify deployment
  console.log("🔍 Verifying deployment...");
  const name = await token.name();
  const symbol = await token.symbol();
  const supply = await token.totalSupply();
  const owner = await token.owner();

  console.log("   Token Name:", name);
  console.log("   Token Symbol:", symbol);
  console.log("   Total Supply:", hre.ethers.formatUnits(supply, decimals));
  console.log("   Owner:", owner);
  console.log();

  console.log("✅ All checks passed!");
  console.log("\n🎉 Deployment complete! Copy the contract address to use in your app.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed!");
    console.error(error);
    process.exit(1);
  });
