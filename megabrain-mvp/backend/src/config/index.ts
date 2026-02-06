import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  apiVersion: process.env.API_VERSION || 'v1',
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Database
  database: {
    url: process.env.DATABASE_URL || 'sqlite:./data/megabrain.db',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'megabrain_protocol',
    user: process.env.DB_USER || 'megabrain',
    password: process.env.DB_PASSWORD || 'megabrain',
  },
  
  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    enabled: process.env.REDIS_ENABLED === 'true',
  },
  
  // Blockchain
  blockchain: {
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    chainId: parseInt(process.env.CHAIN_ID || '11155111'),
    contractAddress: process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    oraclePrivateKey: process.env.ORACLE_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000',
  },
  
  // Settlement
  settlement: {
    enabled: process.env.SETTLEMENT_ENABLED === 'true',
    intervalMinutes: parseInt(process.env.SETTLEMENT_INTERVAL_MINUTES || '5'),
    minConfirmations: parseInt(process.env.MIN_CONFIRMATIONS || '2'),
  },
  
  // AI/Embeddings
  embeddings: {
    provider: (process.env.EMBEDDING_PROVIDER || 'openai') as 'openai' | 'local',
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.EMBEDDING_MODEL || 'text-embedding-3-large',
    dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS || '3072'),
    serviceUrl: process.env.EMBEDDING_SERVICE_URL || 'http://localhost:8000/embed',
  },
  
  // Clustering
  clustering: {
    algorithm: (process.env.CLUSTERING_ALGORITHM || 'hdbscan') as 'hdbscan' | 'dbscan',
    hdbscanMinClusterSize: parseInt(process.env.HDBSCAN_MIN_CLUSTER_SIZE || '2'),
    hdbscanMinSamples: parseInt(process.env.HDBSCAN_MIN_SAMPLES || '1'),
    dbscanEps: parseFloat(process.env.DBSCAN_EPS || '0.3'),
    dbscanMinPoints: parseInt(process.env.DBSCAN_MIN_POINTS || '2'),
    enabled: process.env.ENABLE_CLUSTERING !== 'false',
  },
  
  // IPFS
  ipfs: {
    provider: (process.env.IPFS_PROVIDER || 'pinata') as 'pinata' | 'nftstorage',
    enabled: process.env.ENABLE_IPFS === 'true',
    pinata: {
      apiKey: process.env.PINATA_API_KEY || '',
      secretKey: process.env.PINATA_SECRET_KEY || '',
      jwt: process.env.PINATA_JWT || '',
    },
    nftStorage: {
      apiKey: process.env.NFT_STORAGE_API_KEY || '',
    },
    gateway: process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
  },
  
  // Webhooks
  webhooks: {
    enabled: process.env.ENABLE_WEBHOOKS === 'true',
    secret: process.env.WEBHOOK_SECRET || 'default-secret-change-in-production',
    timeoutMs: parseInt(process.env.WEBHOOK_TIMEOUT_MS || '10000'),
    retryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3'),
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // Consensus
  consensus: {
    threshold: parseFloat(process.env.CONSENSUS_THRESHOLD || '0.66'),
    minEvaluatorAlignment: parseFloat(process.env.MIN_EVALUATOR_ALIGNMENT || '0.5'),
    maxStdDev: parseFloat(process.env.MAX_CONSENSUS_STD_DEV || '20'),
    outlierThresholdSigma: parseFloat(process.env.OUTLIER_THRESHOLD_SIGMA || '2'),
  },
  
  // Task defaults
  taskDefaults: {
    workerCount: parseInt(process.env.DEFAULT_WORKER_COUNT || '3'),
    evaluatorCount: parseInt(process.env.DEFAULT_EVALUATOR_COUNT || '2'),
    workerStakePercent: parseFloat(process.env.WORKER_STAKE_PERCENT || '5'),
    evaluatorStakePercent: parseFloat(process.env.EVALUATOR_STAKE_PERCENT || '3'),
    workerPoolPercent: parseFloat(process.env.WORKER_POOL_PERCENT || '70'),
    evaluatorPoolPercent: parseFloat(process.env.EVALUATOR_POOL_PERCENT || '20'),
    bonusPoolPercent: parseFloat(process.env.BONUS_POOL_PERCENT || '10'),
    workerWindowHours: parseInt(process.env.DEFAULT_WORKER_WINDOW_HOURS || '24'),
    evaluatorWindowHours: parseInt(process.env.DEFAULT_EVALUATOR_WINDOW_HOURS || '12'),
    disputeWindowHours: parseInt(process.env.DEFAULT_DISPUTE_WINDOW_HOURS || '6'),
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  
  // Security
  security: {
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    trustProxy: process.env.TRUST_PROXY === 'true',
  },
  
  // Features
  features: {
    enableSettlementWorker: process.env.ENABLE_SETTLEMENT_WORKER !== 'false',
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT || '9090'),
  },
};

export default config;
