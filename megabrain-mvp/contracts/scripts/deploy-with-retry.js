const { ethers, network } = require("hardhat");

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function deployWithRetry(factory, ...args) {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      console.log(`Deployment attempt ${attempts + 1}/${maxAttempts}...`);
      const contract = await factory.deploy(...args);
      await contract.waitForDeployment();
      return contract;
    } catch (error) {
      attempts++;
      console.log(`Attempt ${attempts} failed: ${error.message}`);
      if (attempts >= maxAttempts) throw error;
      console.log(`Waiting 10 seconds before retry...`);
      await sleep(10000);
    }
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy MockUSDC
  console.log("\nDeploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await deployWithRetry(MockUSDC, deployer.address);
  console.log("MockUSDC deployed to:", await mockUSDC.getAddress());

  // Deploy MegaBrainRegistry
  console.log("\nDeploying MegaBrainRegistry...");
  const MegaBrainRegistry = await ethers.getContractFactory("MegaBrainRegistry");
  
  const minWorkerStake = ethers.parseUnits("50", 6);
  const minEvaluatorStake = ethers.parseUnits("30", 6);
  const minArbitratorStake = ethers.parseUnits("500", 6);
  
  const registry = await deployWithRetry(
    MegaBrainRegistry,
    await mockUSDC.getAddress(),
    minWorkerStake,
    minEvaluatorStake,
    minArbitratorStake,
    deployer.address
  );
  console.log("MegaBrainRegistry deployed to:", await registry.getAddress());

  // Deploy MegaBrainTaskManager
  console.log("\nDeploying MegaBrainTaskManager...");
  const MegaBrainTaskManager = await ethers.getContractFactory("MegaBrainTaskManager");
  const taskManager = await deployWithRetry(
    MegaBrainTaskManager,
    await registry.getAddress(),
    await mockUSDC.getAddress(),
    deployer.address
  );
  console.log("MegaBrainTaskManager deployed to:", await taskManager.getAddress());

  // Transfer Registry ownership to TaskManager
  console.log("\nTransferring Registry ownership to TaskManager...");
  await registry.transferOwnership(await taskManager.getAddress());
  console.log("Ownership transferred");

  // Output deployment info
  console.log("\n=== Deployment Summary ===");
  const addresses = {
    MockUSDC: await mockUSDC.getAddress(),
    MegaBrainRegistry: await registry.getAddress(),
    MegaBrainTaskManager: await taskManager.getAddress(),
  };
  console.log(addresses);

  // Save deployment addresses to file
  const fs = require("fs");
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    contracts: addresses,
    timestamp: new Date().toISOString(),
  };
  
  fs.writeFileSync("deployment.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("\nDeployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
