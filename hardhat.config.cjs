/**
 * Hardhat Configuration
 * 
 * Configuration for smart contract compilation and deployment
 * Targets Polygon Mumbai testnet for prototype
 */

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env.local" });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    amoy: {
      url: "https://rpc-amoy.polygon.technology/",
      accounts: process.env.DEPLOYER_PRIVATE_KEY?.trim()?.length === 66
        ? [process.env.DEPLOYER_PRIVATE_KEY.trim()]
        : ["0xb908f9222819e5fa3154fa57ab0824766bef270b7e109195b4fdf07ff79f9ea5"],
      chainId: 80002,
    },
    hardhat: {
      chainId: 31337,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
