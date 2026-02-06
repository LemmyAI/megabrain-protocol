/**
 * Agent Authentication Middleware
 * 
 * Provides headless authentication for AI agents using API keys and JWT tokens.
 * Integrates with the MegaBrain Registry for agent identity verification.
 */

import { Request, Response, NextFunction } from 'express';
import { ethers } from 'ethers';
import crypto from 'crypto';
import knex from '../database/connection';

// API Key scopes
export type PermissionScope = 
  | 'read' 
  | 'tasks:submit' 
  | 'tasks:claim' 
  | 'tasks:evaluate' 
  | 'pay' 
  | 'admin';

// API Key structure
export interface ApiKey {
  id: string;
  keyHash: string;
  agentAddress: string;
  scopes: PermissionScope[];
  createdAt: Date;
  lastUsedAt: Date | null;
  isActive: boolean;
  rateLimitPerMinute: number;
}

// Authenticated agent info attached to request
export interface AgentAuth {
  address: string;
  apiKeyId: string;
  scopes: PermissionScope[];
  reputation: {
    workerScore: number;
    evaluatorScore: number;
  };
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      agent?: AgentAuth;
    }
  }
}

/**
 * Hash an API key for storage (using SHA-256)
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Generate a new API key
 */
export function generateApiKey(): string {
  // Format: mbp_live_<random>
  const random = crypto.randomBytes(32).toString('base64url');
  return `mbp_live_${random}`;
}

/**
 * Generate a test API key
 */
export function generateTestApiKey(): string {
  const random = crypto.randomBytes(32).toString('base64url');
  return `mbp_test_${random}`;
}

/**
 * Verify API key middleware
 */
export async function verifyApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'MISSING_API_KEY',
          message: 'Authorization header with Bearer token required'
        }
      });
    }

    const apiKey = authHeader.slice(7); // Remove "Bearer "
    const keyHash = hashApiKey(apiKey);

    // Look up API key in database
    const keyRecord = await knex('api_keys')
      .where({ key_hash: keyHash, is_active: true })
      .first();

    if (!keyRecord) {
      return res.status(401).json({
        error: {
          code: 'INVALID_API_KEY',
          message: 'API key is invalid or has been revoked'
        }
      });
    }

    // Check if testnet key is being used on mainnet (or vice versa)
    const isTestKey = apiKey.startsWith('mbp_test_');
    const isTestnet = req.headers['x-network'] === 'testnet' || 
                      req.hostname.includes('testnet');
    
    if (isTestKey && !isTestnet) {
      return res.status(403).json({
        error: {
          code: 'TEST_KEY_ON_MAINNET',
          message: 'Test API keys cannot be used on mainnet'
        }
      });
    }

    // Update last used timestamp
    await knex('api_keys')
      .where({ id: keyRecord.id })
      .update({ last_used_at: new Date() });

    // Parse scopes (stored as JSON string)
    let scopes: PermissionScope[] = [];
    try {
      scopes = Array.isArray(keyRecord.scopes) ? keyRecord.scopes : JSON.parse(keyRecord.scopes);
    } catch {
      scopes = [];
    }

    // Get agent reputation from registry (via database cache)
    const agent = await knex('agents')
      .where({ address: keyRecord.agent_address })
      .first();

    // Attach agent info to request
    req.agent = {
      address: keyRecord.agent_address,
      apiKeyId: keyRecord.id,
      scopes,
      reputation: {
        workerScore: agent?.worker_score || 0,
        evaluatorScore: agent?.evaluator_score || 0
      }
    };

    next();
  } catch (error) {
    console.error('API key verification error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to verify API key'
      }
    });
  }
}

/**
 * Require specific permission scope
 */
export function requireScope(...requiredScopes: PermissionScope[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.agent) {
      return res.status(401).json({
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Agent authentication required'
        }
      });
    }

    const hasScope = requiredScopes.some(scope => 
      req.agent!.scopes.includes(scope) || req.agent!.scopes.includes('admin')
    );

    if (!hasScope) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `This operation requires one of: ${requiredScopes.join(', ')}`,
          details: {
            required: requiredScopes,
            granted: req.agent.scopes
          }
        }
      });
    }

    next();
  };
}

/**
 * Rate limiting middleware
 */
export function rateLimit(requestsPerMinute: number = 100) {
  const requests = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.agent?.apiKeyId || req.ip;
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute ago

    // Get requests in current window
    const keyRequests = requests.get(key) || [];
    const recentRequests = keyRequests.filter(time => time > windowStart);

    if (recentRequests.length >= requestsPerMinute) {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded: ${requestsPerMinute} requests per minute`,
          details: {
            limit: requestsPerMinute,
            window: '1 minute',
            retryAfter: Math.ceil((recentRequests[0] + 60000 - now) / 1000)
          }
        }
      });
    }

    // Add current request
    recentRequests.push(now);
    requests.set(key, recentRequests);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', requestsPerMinute);
    res.setHeader('X-RateLimit-Remaining', requestsPerMinute - recentRequests.length);
    res.setHeader('X-RateLimit-Reset', Math.ceil((now + 60000) / 1000));

    next();
  };
}

/**
 * Create a new API key for an agent
 */
export async function createApiKey(
  agentAddress: string,
  scopes: PermissionScope[] = ['read'],
  isTest: boolean = false
): Promise<{ key: string; id: string }> {
  const key = isTest ? generateTestApiKey() : generateApiKey();
  const keyHash = hashApiKey(key);
  const id = crypto.randomUUID();

  await knex('api_keys').insert({
    id,
    key_hash: keyHash,
    agent_address: agentAddress.toLowerCase(),
    scopes: JSON.stringify(scopes),
    is_active: true,
    rate_limit_per_minute: isTest ? 1000 : 100,
    created_at: new Date()
  });

  return { key, id };
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(keyId: string, agentAddress: string): Promise<boolean> {
  const result = await knex('api_keys')
    .where({ 
      id: keyId, 
      agent_address: agentAddress.toLowerCase() 
    })
    .update({ is_active: false });

  return result > 0;
}

/**
 * List API keys for an agent
 */
export async function listApiKeys(agentAddress: string) {
  const keys = await knex('api_keys')
    .where({ 
      agent_address: agentAddress.toLowerCase(),
      is_active: true 
    })
    .select('id', 'scopes', 'created_at', 'last_used_at', 'rate_limit_per_minute');

  return keys.map(key => ({
    id: key.id,
    scopes: JSON.parse(key.scopes),
    createdAt: key.created_at,
    lastUsedAt: key.last_used_at,
    rateLimitPerMinute: key.rate_limit_per_minute,
    isTest: false // Would need to check key prefix, but we only store hash
  }));
}

/**
 * Verify agent signature for headless registration
 */
export async function verifyAgentSignature(
  agentAddress: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === agentAddress.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Generate registration message for agents to sign
 */
export function generateRegistrationMessage(
  agentAddress: string,
  timestamp: number,
  nonce: string
): string {
  return `MegaBrain Agent Registration

Address: ${agentAddress}
Timestamp: ${timestamp}
Nonce: ${nonce}

Sign this message to register your AI agent with MegaBrain Protocol.
This signature does not authorize any transactions.`;
}
