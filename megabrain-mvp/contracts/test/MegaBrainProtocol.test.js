const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MegaBrain Protocol", function () {
  let mockUSDC, registry, taskManager;
  let owner, requester, worker1, worker2, worker3, evaluator1, evaluator2;
  
  const INITIAL_SUPPLY = ethers.parseUnits("1000000", 6); // 1M USDC
  const TASK_BUDGET = ethers.parseUnits("1000", 6);       // 1000 USDC
  const WORKER_STAKE = ethers.parseUnits("50", 6);        // 50 USDC
  const EVALUATOR_STAKE = ethers.parseUnits("30", 6);     // 30 USDC
  
  beforeEach(async function () {
    [owner, requester, worker1, worker2, worker3, evaluator1, evaluator2] = await ethers.getSigners();
    
    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy(owner.address);
    await mockUSDC.waitForDeployment();
    
    // Deploy Registry
    const MegaBrainRegistry = await ethers.getContractFactory("MegaBrainRegistry");
    registry = await MegaBrainRegistry.deploy(
      await mockUSDC.getAddress(),
      WORKER_STAKE,
      EVALUATOR_STAKE,
      ethers.parseUnits("500", 6),
      owner.address
    );
    await registry.waitForDeployment();
    
    // Deploy TaskManager
    const MegaBrainTaskManager = await ethers.getContractFactory("MegaBrainTaskManager");
    taskManager = await MegaBrainTaskManager.deploy(
      await registry.getAddress(),
      await mockUSDC.getAddress(),
      owner.address
    );
    await taskManager.waitForDeployment();
    
    // Transfer registry ownership to taskManager
    await registry.transferOwnership(await taskManager.getAddress());
    
    // Fund accounts
    await mockUSDC.transfer(requester.address, ethers.parseUnits("10000", 6));
    await mockUSDC.transfer(worker1.address, ethers.parseUnits("1000", 6));
    await mockUSDC.transfer(worker2.address, ethers.parseUnits("1000", 6));
    await mockUSDC.transfer(worker3.address, ethers.parseUnits("1000", 6));
    await mockUSDC.transfer(evaluator1.address, ethers.parseUnits("1000", 6));
    await mockUSDC.transfer(evaluator2.address, ethers.parseUnits("1000", 6));
  });

  describe("MockUSDC", function () {
    it("Should have correct initial supply", async function () {
      expect(await mockUSDC.totalSupply()).to.equal(INITIAL_SUPPLY);
    });
    
    it("Should allow faucet claims", async function () {
      const faucetAmount = ethers.parseUnits("1000", 6);
      await mockUSDC.connect(worker1).faucet(faucetAmount);
      expect(await mockUSDC.balanceOf(worker1.address)).to.equal(
        ethers.parseUnits("1000", 6).add(faucetAmount)
      );
    });
  });

  describe("MegaBrainRegistry", function () {
    it("Should register a worker", async function () {
      await mockUSDC.connect(worker1).approve(await registry.getAddress(), WORKER_STAKE);
      
      await registry.connect(worker1).register(
        1, // Worker role
        ethers.keccak256(ethers.toUtf8Bytes("capabilities")),
        "ipfs://metadata",
        WORKER_STAKE
      );
      
      const agent = await registry.getAgent(worker1.address);
      expect(agent.role).to.equal(1);
      expect(agent.stakeAmount).to.equal(WORKER_STAKE);
      expect(agent.workerReputation).to.equal(100);
    });
    
    it("Should not register without minimum stake", async function () {
      await mockUSDC.connect(worker1).approve(await registry.getAddress(), ethers.parseUnits("10", 6));
      
      await expect(
        registry.connect(worker1).register(
          1, // Worker role
          ethers.keccak256(ethers.toUtf8Bytes("capabilities")),
          "ipfs://metadata",
          ethers.parseUnits("10", 6)
        )
      ).to.be.revertedWith("Insufficient stake");
    });
    
    it("Should track reputation correctly", async function () {
      // Register worker
      await mockUSDC.connect(worker1).approve(await registry.getAddress(), WORKER_STAKE);
      await registry.connect(worker1).register(1, ethers.keccak256(ethers.toUtf8Bytes("caps")), "uri", WORKER_STAKE);
      
      // Update reputation (as task manager)
      await taskManager.updateWorkerReputation(worker1.address, 50);
      
      const agent = await registry.getAgent(worker1.address);
      expect(agent.workerReputation).to.equal(150);
    });
    
    it("Should slash stake correctly", async function () {
      // Register worker
      await mockUSDC.connect(worker1).approve(await registry.getAddress(), WORKER_STAKE);
      await registry.connect(worker1).register(1, ethers.keccak256(ethers.toUtf8Bytes("caps")), "uri", WORKER_STAKE);
      
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("task1"));
      
      // Slash as task manager
      await taskManager.slashStake(worker1.address, ethers.parseUnits("25", 6), taskId, "test slash");
      
      const agent = await registry.getAgent(worker1.address);
      expect(agent.stakeAmount).to.equal(ethers.parseUnits("25", 6));
    });
  });

  describe("MegaBrainTaskManager - Task Creation", function () {
    it("Should create a task", async function () {
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("task1"));
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      
      await mockUSDC.connect(requester).approve(await taskManager.getAddress(), TASK_BUDGET);
      
      await taskManager.connect(requester).createTask(
        taskId,
        "Test task description",
        ethers.keccak256(ethers.toUtf8Bytes("task-class-1")),
        TASK_BUDGET,
        ethers.parseUnits("5", 6),  // worker stake
        ethers.parseUnits("3", 6),  // evaluator stake
        deadline,
        ethers.keccak256(ethers.toUtf8Bytes("metadata")),
        3, // 3 workers
        2  // 2 evaluators
      );
      
      const task = await taskManager.getTask(taskId);
      expect(task.requester).to.equal(requester.address);
      expect(task.totalBudget).to.equal(TASK_BUDGET);
      expect(task.workerCount).to.equal(3);
      expect(task.evaluatorCount).to.equal(2);
      
      // Check pool distribution (70/20/10)
      expect(task.workerPoolAmount).to.equal(TASK_BUDGET * 7000n / 10000n);
      expect(task.evaluatorPoolAmount).to.equal(TASK_BUDGET * 2000n / 10000n);
      expect(task.bonusPoolAmount).to.equal(TASK_BUDGET * 1000n / 10000n);
    });
    
    it("Should not create task with zero budget", async function () {
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("task1"));
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      
      await expect(
        taskManager.connect(requester).createTask(
          taskId,
          "Test task",
          ethers.keccak256(ethers.toUtf8Bytes("class")),
          0, // zero budget
          0,
          0,
          deadline,
          ethers.keccak256(ethers.toUtf8Bytes("metadata")),
          0,
          0
        )
      ).to.be.revertedWith("Budget must be > 0");
    });
  });

  describe("MegaBrainTaskManager - Full Workflow", function () {
    let taskId;
    let deadline;
    
    beforeEach(async function () {
      taskId = ethers.keccak256(ethers.toUtf8Bytes("full-task"));
      deadline = Math.floor(Date.now() / 1000) + 86400;
      
      // Register workers
      for (const worker of [worker1, worker2, worker3]) {
        await mockUSDC.connect(worker).approve(await registry.getAddress(), WORKER_STAKE);
        await registry.connect(worker).register(1, ethers.keccak256(ethers.toUtf8Bytes("caps")), "uri", WORKER_STAKE);
      }
      
      // Register evaluators
      for (const evaluator of [evaluator1, evaluator2]) {
        await mockUSDC.connect(evaluator).approve(await registry.getAddress(), EVALUATOR_STAKE);
        await registry.connect(evaluator).register(2, ethers.keccak256(ethers.toUtf8Bytes("eval-caps")), "uri", EVALUATOR_STAKE);
      }
      
      // Create task
      await mockUSDC.connect(requester).approve(await taskManager.getAddress(), TASK_BUDGET);
      await taskManager.connect(requester).createTask(
        taskId,
        "Full workflow test task",
        ethers.keccak256(ethers.toUtf8Bytes("task-class")),
        TASK_BUDGET,
        ethers.parseUnits("5", 6),
        ethers.parseUnits("3", 6),
        deadline,
        ethers.keccak256(ethers.toUtf8Bytes("metadata")),
        3,
        2
      );
    });
    
    it("Should complete full task workflow", async function () {
      // 1. Select workers
      await taskManager.connect(requester).selectWorkers(taskId, [worker1.address, worker2.address, worker3.address]);
      
      // 2. Select evaluators
      await taskManager.connect(requester).selectEvaluators(taskId, [evaluator1.address, evaluator2.address]);
      
      // 3. Workers submit results
      const resultHash1 = ethers.keccak256(ethers.toUtf8Bytes("result1"));
      const resultHash2 = ethers.keccak256(ethers.toUtf8Bytes("result2"));
      const resultHash3 = ethers.keccak256(ethers.toUtf8Bytes("result3"));
      
      await taskManager.connect(worker1).submitResult(taskId, resultHash1, "Summary of work 1", ethers.ZeroHash);
      await taskManager.connect(worker2).submitResult(taskId, resultHash2, "Summary of work 2", ethers.ZeroHash);
      await taskManager.connect(worker3).submitResult(taskId, resultHash3, "Summary of work 3", ethers.ZeroHash);
      
      // Verify task is now evaluating
      const task = await taskManager.getTask(taskId);
      expect(task.status).to.equal(2); // Evaluating
      
      // 4. Evaluators submit scores
      await taskManager.connect(evaluator1).submitEvaluation(taskId, worker1.address, 85, 90, ethers.ZeroHash, "Good work");
      await taskManager.connect(evaluator1).submitEvaluation(taskId, worker2.address, 90, 95, ethers.ZeroHash, "Excellent");
      await taskManager.connect(evaluator1).submitEvaluation(taskId, worker3.address, 40, 80, ethers.ZeroHash, "Poor quality");
      
      await taskManager.connect(evaluator2).submitEvaluation(taskId, worker1.address, 88, 85, ethers.ZeroHash, "Good");
      await taskManager.connect(evaluator2).submitEvaluation(taskId, worker2.address, 92, 90, ethers.ZeroHash, "Great");
      await taskManager.connect(evaluator2).submitEvaluation(taskId, worker3.address, 35, 85, ethers.ZeroHash, "Below standard");
      
      // 5. Settle task
      const workerBalanceBefore1 = await mockUSDC.balanceOf(worker1.address);
      const workerBalanceBefore2 = await mockUSDC.balanceOf(worker2.address);
      const workerBalanceBefore3 = await mockUSDC.balanceOf(worker3.address);
      
      await taskManager.settleTask(
        taskId,
        ethers.keccak256(ethers.toUtf8Bytes("winning-cluster")),
        [worker1.address, worker2.address], // consensus workers
        [86, 91], // scores
        [evaluator1.address, evaluator2.address], // aligned evaluators
        [] // no outliers
      );
      
      // 6. Verify payments
      const workerBalanceAfter1 = await mockUSDC.balanceOf(worker1.address);
      const workerBalanceAfter2 = await mockUSDC.balanceOf(worker2.address);
      const workerBalanceAfter3 = await mockUSDC.balanceOf(worker3.address);
      
      // Workers 1 and 2 should be paid, worker 3 slashed
      expect(workerBalanceAfter1).to.be.gt(workerBalanceBefore1);
      expect(workerBalanceAfter2).to.be.gt(workerBalanceBefore2);
      expect(workerBalanceAfter3).to.be.lt(workerBalanceBefore3); // Lost stake
      
      // Verify task settled
      const taskAfter = await taskManager.getTask(taskId);
      expect(taskAfter.status).to.equal(3); // Settled
      
      // Verify results
      const result1 = await taskManager.getResult(taskId, worker1.address);
      expect(result1.inConsensus).to.be.true;
      expect(result1.finalScore).to.equal(86);
    });
    
    it("Should not allow worker to evaluate own work", async function () {
      await taskManager.connect(requester).selectWorkers(taskId, [worker1.address, worker2.address, worker3.address]);
      await taskManager.connect(requester).selectEvaluators(taskId, [evaluator1.address, evaluator2.address]);
      
      await taskManager.connect(worker1).submitResult(taskId, ethers.keccak256(ethers.toUtf8Bytes("result1")), "Summary", ethers.ZeroHash);
      
      // Try to evaluate self (should fail)
      await expect(
        taskManager.connect(worker1).submitEvaluation(taskId, worker1.address, 100, 100, ethers.ZeroHash, "Self eval")
      ).to.be.revertedWith("Not assigned evaluator");
    });
    
    it("Should allow task cancellation before workers join", async function () {
      const requesterBalanceBefore = await mockUSDC.balanceOf(requester.address);
      
      await taskManager.connect(requester).cancelTask(taskId);
      
      const requesterBalanceAfter = await mockUSDC.balanceOf(requester.address);
      expect(requesterBalanceAfter).to.equal(requesterBalanceBefore + TASK_BUDGET);
      
      const task = await taskManager.getTask(taskId);
      expect(task.status).to.equal(5); // Cancelled
    });
  });

  describe("Access Control", function () {
    it("Should restrict settlement to owner", async function () {
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("access-test"));
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      
      await mockUSDC.connect(requester).approve(await taskManager.getAddress(), TASK_BUDGET);
      await taskManager.connect(requester).createTask(
        taskId,
        "Access test",
        ethers.keccak256(ethers.toUtf8Bytes("class")),
        TASK_BUDGET,
        0,
        0,
        deadline,
        ethers.keccak256(ethers.toUtf8Bytes("metadata")),
        0,
        0
      );
      
      await expect(
        taskManager.connect(worker1).settleTask(
          taskId,
          ethers.ZeroHash,
          [],
          [],
          [],
          []
        )
      ).to.be.revertedWithCustomError(taskManager, "OwnableUnauthorizedAccount");
    });
  });
});