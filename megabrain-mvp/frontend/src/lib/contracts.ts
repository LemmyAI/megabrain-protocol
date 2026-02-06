import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { TASK_MANAGER_ABI, REGISTRY_ABI, USDC_ABI } from '@/abis';

const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
const chainIdEnv = Number(process.env.NEXT_PUBLIC_CHAIN_ID || sepolia.id);

export const TASK_MANAGER_ADDRESS = (process.env.NEXT_PUBLIC_TASK_MANAGER || '').toLowerCase();
export const REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_REGISTRY || '').toLowerCase();
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC || '').toLowerCase();

export const publicClient = createPublicClient({
  chain: { ...sepolia, id: chainIdEnv },
  transport: http(rpcUrl),
});

export const taskManagerContract = {
  address: TASK_MANAGER_ADDRESS as `0x${string}`,
  abi: TASK_MANAGER_ABI,
};

export const registryContract = {
  address: REGISTRY_ADDRESS as `0x${string}`,
  abi: REGISTRY_ABI,
};

export const usdcContract = {
  address: USDC_ADDRESS as `0x${string}`,
  abi: USDC_ABI,
};
