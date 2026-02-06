import crypto from 'crypto';
import { ethers } from 'ethers';

// ============================================
// Cryptographic Utilities
// ============================================

/**
 * Generate a hash for content using keccak256 (Ethereum compatible)
 */
export function keccak256Hash(content: string | Buffer): string {
  const data = typeof content === 'string' ? Buffer.from(content) : content;
  return ethers.keccak256(data);
}

/**
 * Generate a random UUID
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Generate a task ID hash from description and timestamp
 */
export function generateTaskId(description: string, timestamp: number, requesterAddress: string): string {
  const data = `${description}:${timestamp}:${requesterAddress}`;
  return keccak256Hash(data);
}

/**
 * Verify an Ethereum signature
 */
export function verifySignature(message: string, signature: string, address: string): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Sign a message with a private key
 */
export function signMessage(message: string, privateKey: string): string {
  const wallet = new ethers.Wallet(privateKey);
  return wallet.signMessageSync(message);
}

// ============================================
// Mathematical Utilities
// ============================================

/**
 * Calculate mean of an array of numbers
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate standard deviation of an array of numbers
 */
export function stdDev(values: number[]): number {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
  const avgSquaredDiff = mean(squaredDiffs);
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Calculate weighted mean
 */
export function weightedMean(values: number[], weights: number[]): number {
  if (values.length !== weights.length || values.length === 0) return 0;
  const weightedSum = values.reduce((sum, val, i) => sum + val * weights[i], 0);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Calculate weighted standard deviation
 */
export function weightedStdDev(values: number[], weights: number[]): number {
  if (values.length !== weights.length || values.length <= 1) return 0;
  const weightedAvg = weightedMean(values, weights);
  const weightedSquaredDiffs = values.map((v, i) => weights[i] * Math.pow(v - weightedAvg, 2));
  const weightedAvgSquaredDiff = weightedMean(weightedSquaredDiffs, weights);
  return Math.sqrt(weightedAvgSquaredDiff);
}

/**
 * Sigmoid function for normalization
 */
export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate percentile
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

// ============================================
// Vector/Math Utilities for Embeddings
// ============================================

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimensions');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculate Euclidean distance between two vectors
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimensions');
  }
  
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }
  
  return Math.sqrt(sum);
}

/**
 * Calculate centroid of a set of vectors
 */
export function calculateCentroid(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  
  const dimensions = vectors[0].length;
  const centroid = new Array(dimensions).fill(0);
  
  for (const vector of vectors) {
    for (let i = 0; i < dimensions; i++) {
      centroid[i] += vector[i];
    }
  }
  
  return centroid.map(sum => sum / vectors.length);
}

/**
 * Calculate average distance from centroid (coherence)
 */
export function calculateCoherence(vectors: number[][]): number {
  if (vectors.length <= 1) return 1.0;
  
  const centroid = calculateCentroid(vectors);
  const distances = vectors.map(v => euclideanDistance(v, centroid));
  const avgDistance = mean(distances);
  
  // Normalize to 0-1 scale (lower distance = higher coherence)
  // Using sigmoid-like transformation
  return 1 / (1 + avgDistance);
}

// ============================================
// Validation Utilities
// ============================================

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string, maxLength: number = 500): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>\"']/g, '');
}

// ============================================
// Date/Time Utilities
// ============================================

/**
 * Add hours to a date
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Check if deadline has passed
 */
export function isDeadlinePassed(deadline: Date): boolean {
  return new Date() > deadline;
}

/**
 * Format duration in human readable format
 */
export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} minutes`;
  if (hours < 24) return `${Math.round(hours)} hours`;
  return `${Math.round(hours / 24)} days`;
}

// ============================================
// JSON Utilities
// ============================================

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Canonicalize object for consistent hashing
 */
export function canonicalize(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalize).join(',') + ']';
  }
  
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(k => `${JSON.stringify(k)}:${canonicalize(obj[k])}`);
  return '{' + pairs.join(',') + '}';
}
