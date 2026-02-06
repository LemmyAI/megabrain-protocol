#!/usr/bin/env node

const { Command } = require('commander');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const program = new Command();

// Load config
function loadConfig() {
  const configPaths = [
    path.join(process.env.HOME, '.megabrain', 'config.json'),
    './megabrain.config.json',
    './config.json'
  ];
  
  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      // Expand environment variables
      return JSON.parse(JSON.stringify(config).replace(/\$\{(\w+)\}/g, (match, envVar) => process.env[envVar] || match));
    }
  }
  
  // Fallback to env vars
  return {
    network: 'sepolia',
    rpcUrl: process.env.SEPOLIA_RPC || 'https://rpc.sepolia.org',
    contracts: {
      registry: process.env.MEGABRAIN_REGISTRY,
      taskManager: process.env.MEGABRAIN_TASK_MANAGER,
      usdc: process.env.MEGABRAIN_USDC
    },
    agent: {
      privateKey: process.env.MEGABRAIN_PRIVATE_KEY
    }
  };
}

const config = loadConfig();
const provider = new ethers.JsonRpcProvider(config.rpcUrl);
const wallet = new ethers.Wallet(config.agent.privateKey, provider);

// ABIs (simplified)
const TASK_MANAGER_ABI = [
  "function getAvailableTasks() view returns (bytes32[])",
  "function getTask(bytes32) view returns (tuple(bytes32,address,string,bytes32,uint256,uint256,uint256,uint256,uint256,uint256,uint64,uint64,uint64,uint8,uint8,uint8,address[],address[],bytes32))",
  "function claimTaskAsWorker(bytes32)",
  "function submitResult(bytes32,bytes32,string)",
  "function getTaskState(bytes32) view returns (uint8,uint64,uint64,uint256)"
];

const REGISTRY_ABI = [
  "function registerAgent(bytes32[],uint256,string)",
  "function getReputation(address) view returns (uint256,uint256,uint64)"
];

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const taskManager = new ethers.Contract(config.contracts.taskManager, TASK_MANAGER_ABI, wallet);
const registry = new ethers.Contract(config.contracts.registry, REGISTRY_ABI, wallet);
const usdc = new ethers.Contract(config.contracts.usdc, ERC20_ABI, provider);

// Commands
program
  .name('mbp')
  .description('MegaBrain Protocol CLI - Earn USDC by completing tasks')
  .version('1.0.0');

program
  .command('status')
  .description('Check your agent status and balance')
  .action(async () => {
    try {
      const address = wallet.address;
      const balance = await usdc.balanceOf(address);
      const decimals = await usdc.decimals();
      const rep = await registry.getReputation(address);
      
      console.log('\n🤖 Agent Status');
      console.log('================');
      console.log(`Address: ${address}`);
      console.log(`USDC Balance: ${ethers.formatUnits(balance, decimals)}`);
      console.log(`Worker Reputation: ${rep[0]}`);
      console.log(`Evaluator Reputation: ${rep[1]}`);
      console.log(`Last Active: ${new Date(Number(rep[2]) * 1000).toISOString()}`);
    } catch (error) {
      console.error('Error:', error.message);
    }
  });

program
  .command('tasks')
  .description('List available tasks')
  .option('-c, --capability <type>', 'Filter by capability')
  .option('-m, --min-budget <amount>', 'Minimum budget in USDC')
  .action(async (options) => {
    try {
      const taskIds = await taskManager.getAvailableTasks();
      console.log(`\n📋 Available Tasks (${taskIds.length})`);
      console.log('========================');
      
      for (const taskId of taskIds.slice(0, 10)) {
        try {
          const task = await taskManager.getTask(taskId);
          const budget = ethers.formatUnits(task[4], 6);
          
          if (options.minBudget && parseFloat(budget) < parseFloat(options.minBudget)) continue;
          
          console.log(`\nTask: ${taskId}`);
          console.log(`  Budget: ${budget} USDC`);
          console.log(`  Workers: ${task[14]}/${task[16].length}`);
          console.log(`  Status: ${['Created', 'Open', 'Evaluating', 'Settled', 'Disputed'][task[13]]}`);
        } catch (e) {
          // Skip invalid tasks
        }
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  });

program
  .command('claim <taskId>')
  .description('Claim a task as worker')
  .action(async (taskId) => {
    try {
      console.log(`Claiming task ${taskId}...`);
      const tx = await taskManager.claimTaskAsWorker(taskId);
      await tx.wait();
      console.log('✅ Task claimed successfully!');
    } catch (error) {
      console.error('Error:', error.message);
    }
  });

program
  .command('submit <taskId>')
  .description('Submit result for a task')
  .requiredOption('-r, --result <text>', 'Result text')
  .action(async (taskId, options) => {
    try {
      console.log(`Submitting result for task ${taskId}...`);
      const resultHash = ethers.keccak256(ethers.toUtf8Bytes(options.result));
      const summary = options.result.substring(0, 500);
      
      const tx = await taskManager.submitResult(taskId, resultHash, summary);
      await tx.wait();
      console.log('✅ Result submitted successfully!');
    } catch (error) {
      console.error('Error:', error.message);
    }
  });

program
  .command('register')
  .description('Register as an agent')
  .requiredOption('-c, --capabilities <list>', 'Comma-separated capabilities')
  .requiredOption('-r, --rate <amount>', 'Hourly rate in USDC')
  .requiredOption('-e, --endpoint <url>', 'Your webhook endpoint')
  .action(async (options) => {
    try {
      const capabilities = options.capabilities.split(',').map(c => 
        ethers.keccak256(ethers.toUtf8Bytes(c.trim()))
      );
      const rate = ethers.parseUnits(options.rate, 6);
      
      console.log('Registering agent...');
      const tx = await registry.registerAgent(capabilities, rate, options.endpoint);
      await tx.wait();
      console.log('✅ Agent registered successfully!');
    } catch (error) {
      console.error('Error:', error.message);
    }
  });

program
  .command('auto')
  .description('Auto-claim and execute matching tasks')
  .option('-c, --capabilities <list>', 'Comma-separated capabilities', 'research,coding')
  .option('-m, --min-budget <amount>', 'Minimum budget', '5')
  .action(async (options) => {
    console.log('🤖 Auto-mode started. Press Ctrl+C to stop.');
    console.log(`Capabilities: ${options.capabilities}`);
    console.log(`Min Budget: ${options.minBudget} USDC\n`);
    
    const capabilities = options.capabilities.split(',');
    
    setInterval(async () => {
      try {
        const taskIds = await taskManager.getAvailableTasks();
        
        for (const taskId of taskIds) {
          try {
            const task = await taskManager.getTask(taskId);
            const budget = parseFloat(ethers.formatUnits(task[4], 6));
            
            if (budget >= parseFloat(options.minBudget)) {
              console.log(`[${new Date().toISOString()}] Claiming task ${taskId} (${budget} USDC)...`);
              await taskManager.claimTaskAsWorker(taskId);
              console.log(`✅ Claimed! Complete and submit result.`);
            }
          } catch (e) {
            // Already claimed or error
          }
        }
      } catch (error) {
        console.error('Error:', error.message);
      }
    }, 30000); // Check every 30 seconds
  });

program.parse();
