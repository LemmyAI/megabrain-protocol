import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number, decimals = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCurrency(num: number): string {
  return `$${formatNumber(num)}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(timestamp: number): string {
  const diff = timestamp - Date.now();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes}m`;
}

export function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    evaluating: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    settled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    disputed: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    inconclusive: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  return colors[status] || colors.inconclusive;
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 70) return 'text-blue-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-rose-400';
}