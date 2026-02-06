import { http, createWalletClient, createPublicClient } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { TASK_MANAGER_ABI } from '@/abis';

const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
const chain = sepolia;

export const publicServerClient = createPublicClient({
  chain,
  transport: http(rpcUrl),
});

const pk = process.env.SERVER_PRIVATE_KEY?.trim();
export const account = pk && pk.startsWith('0x') && pk.length === 66 
  ? privateKeyToAccount(pk as `0x${string}`) 
  : null;

export const walletClient = account
  ? createWalletClient({
      account,
      chain,
      transport: http(rpcUrl),
    })
  : null;

export const taskManagerAddress =
  (process.env.TASK_MANAGER_CONTRACT as `0x${string}`) ||
  (process.env.NEXT_PUBLIC_TASK_MANAGER as `0x${string}`) ||
  '0x0000000000000000000000000000000000000000';

export const taskManager = {
  address: taskManagerAddress,
  abi: TASK_MANAGER_ABI,
} as const;
