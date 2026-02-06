'use client';

import { useWriteContract, useAccount, useReadContract } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { TASK_MANAGER_ABI, USDC_ABI, REGISTRY_ABI } from '@/abis';
import { CreateTaskInput, Task, AgentReputation } from '@/types';
import { parseUnits, keccak256, toBytes } from 'viem';
import { useCallback } from 'react';
import { TASK_MANAGER_ADDRESS, REGISTRY_ADDRESS, USDC_ADDRESS } from '@/lib/contracts';

const TASK_MANAGER = TASK_MANAGER_ADDRESS as `0x${string}`;
const REGISTRY = REGISTRY_ADDRESS as `0x${string}`;
const USDC = USDC_ADDRESS as `0x${string}`;

// Tasks list via API
export function useAvailableTasks() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks', { cache: 'no-store' });
      if (!res.ok) throw new Error('failed to load tasks');
      const json = await res.json();
      return json.tasks as Task[];
    },
    refetchInterval: 20000,
  });

  return { tasks: data || [], isLoading, error };
}

// Single task via API
export function useTask(taskId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('failed to load task');
      return (await res.json()) as Task;
    },
    enabled: !!taskId,
    refetchInterval: 15000,
  });

  return { task: data || null, isLoading, error, refetch };
}

// Agent reputation (registry)
export function useAgentReputation(address?: string) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const { data, isLoading, error } = useReadContract({
    address: REGISTRY,
    abi: REGISTRY_ABI,
    functionName: 'getAgent',
    args: targetAddress ? [targetAddress as `0x${string}`] : undefined,
    query: { enabled: !!targetAddress },
  });

  const reputation: AgentReputation | null = data && targetAddress ? {
    address: targetAddress,
    workerScore: Number(data.workerReputation),
    evaluatorScore: Number(data.evaluatorReputation),
    tasksCompleted: 0,
    tasksEvaluated: 0,
    totalEarnings: BigInt(0),
    lastActive: Number(data.lastActive),
  } : null;

  return { reputation, isLoading, error };
}

// Create task (on-chain)
export function useCreateTask() {
  const { writeContract, isPending, error, data: hash } = useWriteContract();

  const createTask = useCallback((input: CreateTaskInput) => {
    const taskId = keccak256(toBytes(crypto.randomUUID()));

    writeContract({
      address: TASK_MANAGER,
      abi: TASK_MANAGER_ABI,
      functionName: 'createTask',
      args: [
        taskId,
        input.description,
        input.taskClass as `0x${string}`,
        input.totalBudget,
        input.workerStake,
        input.evaluatorStake,
        BigInt(input.submissionDeadline),
        input.metadata ? input.metadata as `0x${string}` : '0x',
        input.workerCount,
        input.evaluatorCount,
      ],
    });

    return taskId;
  }, [writeContract]);

  return { createTask, isPending, error, hash };
}

// Submit result
export function useSubmitResult() {
  const { writeContract, isPending, error, data: hash } = useWriteContract();

  const submit = useCallback((taskId: string, resultHash: string, summary: string) => {
    writeContract({
      address: TASK_MANAGER,
      abi: TASK_MANAGER_ABI,
      functionName: 'submitResult',
      args: [taskId as `0x${string}`, resultHash as `0x${string}`, summary, '0x'],
    });
  }, [writeContract]);

  return { submit, isPending, error, hash };
}

// Submit evaluation
export function useSubmitEvaluation() {
  const { writeContract, isPending, error, data: hash } = useWriteContract();

  const submit = useCallback((taskId: string, worker: string, score: number, confidence: number) => {
    writeContract({
      address: TASK_MANAGER,
      abi: TASK_MANAGER_ABI,
      functionName: 'submitEvaluation',
      args: [
        taskId as `0x${string}`,
        worker as `0x${string}`,
        score,
        confidence,
        '0x',
        '',
      ],
    });
  }, [writeContract]);

  return { submit, isPending, error, hash };
}

// Approve USDC spending
export function useApproveUSDC() {
  const { writeContract, isPending, error, data: hash } = useWriteContract();

  const approve = useCallback((amount: bigint) => {
    writeContract({
      address: USDC,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [TASK_MANAGER, amount],
    });
  }, [writeContract]);

  return { approve, isPending, error, hash };
}

// USDC balance
export function useUSDCBalance(address?: string) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const { data, isLoading, error } = useReadContract({
    address: USDC,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: targetAddress ? [targetAddress as `0x${string}`] : undefined,
    query: { enabled: !!targetAddress },
  });

  const formattedBalance = data ? `${(Number(data) / 1e6).toFixed(2)} USDC` : '0 USDC';

  return { balance: data || BigInt(0), formattedBalance, isLoading, error };
}

// Helper for USDC decimals (6)
export const parseUsdc = (value: string) => parseUnits(value, 6);
