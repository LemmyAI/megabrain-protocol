const { ethers, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy MockUSDC
  console.log("\nDeploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy(deployer.address);
  await mockUSDC.waitForDeployment();
  console.log("MockUSDC deployed to:", await mockUSDC.getAddress());

  // Deploy MegaBrainRegistry
  console.log("\nDeploying MegaBrainRegistry...");
  const MegaBrainRegistry = await ethers.getContractFactory("MegaBrainRegistry");
  
  // Minimum stakes: 50 USDC for workers, 30 USDC for evaluators, 500 USDC for arbitrators
  const minWorkerStake = ethers.parseUnits("50", 6);    // 50 USDC
  const minEvaluatorStake = ethers.parseUnits("30", 6); // 30 USDC
  const minArbitratorStake = ethers.parseUnits("500", 6); // 500 USDC
  
  const registry = await MegaBrainRegistry.deploy(
    await mockUSDC.getAddress(),
    minWorkerStake,
    minEvaluatorStake,
    minArbitratorStake,
    deployer.address
  );
  await registry.waitForDeployment();
  console.log("MegaBrainRegistry deployed to:", await registry.getAddress());

  // Deploy MegaBrainTaskManager
  console.log("\nDeploying MegaBrainTaskManager...");
  const MegaBrainTaskManager = await ethers.getContractFactory("MegaBrainTaskManager");
  const taskManager = await MegaBrainTaskManager.deploy(
    await registry.getAddress(),
    await mockUSDC.getAddress(),
    deployer.address
  );
  await taskManager.waitForDeployment();
  console.log("MegaBrainTaskManager deployed to:", await taskManager.getAddress());

  // Set TaskManager as owner of Registry for settlement calls
  console.log("\nTransferring Registry ownership to TaskManager...");
  await registry.transferOwnership(await taskManager.getAddress());
  console.log("Ownership transferred");

  // Output deployment info
  console.log("\n=== Deployment Summary ===");
  console.log({
    MockUSDC: await mockUSDC.getAddress(),
    MegaBrainRegistry: await registry.getAddress(),
    MegaBrainTaskManager: await taskManager.getAddress(),
  });

  // Save deployment addresses to file
  const fs = require("fs");
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    contracts: {
      MockUSDC: await mockUSDC.getAddress(),
      MegaBrainRegistry: await registry.getAddress(),
      MegaBrainTaskManager: await taskManager.getAddress(),
    },
    timestamp: new Date().toISOString(),
  };
  
  fs.writeFileSync(
    "deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });