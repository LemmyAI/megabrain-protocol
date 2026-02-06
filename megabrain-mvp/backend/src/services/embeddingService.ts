import axios from 'axios';
import axiosRetry from 'axios-retry';
import { OpenAI } from 'openai';
import config from '../config';
import logger from '../utils/logger';
import type { EmbeddingResult } from '../types';

// Configure axios with retry
axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           error.response?.status === 429;
  },
});

class EmbeddingService {
  private openai: OpenAI | null = null;
  private localServiceUrl: string;
  private provider: 'openai' | 'local';
  private model: string;
  private dimensions: number;

  constructor() {
    this.provider = config.embeddings.provider;
    this.model = config.embeddings.model;
    this.dimensions = config.embeddings.dimensions;
    this.localServiceUrl = config.embeddings.serviceUrl;

    if (this.provider === 'openai') {
      if (!config.embeddings.apiKey) {
        logger.warn('OpenAI API key not configured, falling back to local embeddings');
        this.provider = 'local';
      } else {
        this.openai = new OpenAI({
          apiKey: config.embeddings.apiKey,
        });
      }
    }
  }

  /**
   * Generate embedding for a text string
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    // Clean and truncate text
    const cleanedText = this.cleanText(text);
    
    try {
      if (this.provider === 'openai' && this.openai) {
        return await this.generateOpenAIEmbedding(cleanedText);
      } else {
        return await this.generateLocalEmbedding(cleanedText);
      }
    } catch (error) {
      logger.error('Failed to generate embedding:', error);
      throw new Error(`Embedding generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    const cleanedTexts = texts.map(t => this.cleanText(t));
    
    try {
      if (this.provider === 'openai' && this.openai) {
        return await this.generateOpenAIEmbeddingsBatch(cleanedTexts);
      } else {
        // For local provider, process sequentially
        const results: EmbeddingResult[] = [];
        for (const text of cleanedTexts) {
          results.push(await this.generateLocalEmbedding(text));
        }
        return results;
      }
    } catch (error) {
      logger.error('Failed to generate embeddings batch:', error);
      throw new Error(`Batch embedding generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generate embedding using OpenAI API
   */
  private async generateOpenAIEmbedding(text: string): Promise<EmbeddingResult> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const response = await this.openai.embeddings.create({
      model: this.model,
      input: text,
      dimensions: this.dimensions,
    });

    return {
      embedding: response.data[0].embedding,
      dimensions: response.data[0].embedding.length,
      model: this.model,
    };
  }

  /**
   * Generate embeddings batch using OpenAI API
   */
  private async generateOpenAIEmbeddingsBatch(texts: string[]): Promise<EmbeddingResult[]> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const response = await this.openai.embeddings.create({
      model: this.model,
      input: texts,
      dimensions: this.dimensions,
    });

    return response.data.map(item => ({
      embedding: item.embedding,
      dimensions: item.embedding.length,
      model: this.model,
    }));
  }

  /**
   * Generate embedding using local service
   */
  private async generateLocalEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      const response = await axios.post(this.localServiceUrl, {
        text,
        model: this.model,
      }, {
        timeout: 30000,
      });

      return {
        embedding: response.data.embedding,
        dimensions: response.data.embedding.length,
        model: response.data.model || 'local-model',
      };
    } catch (error) {
      // Fallback to simple embedding if local service fails
      logger.warn('Local embedding service failed, using fallback:', error);
      return this.generateFallbackEmbedding(text);
    }
  }

  /**
   * Fallback embedding using simple hashing (not semantic, but consistent)
   * This is a last resort for testing without external services
   */
  private generateFallbackEmbedding(text: string): EmbeddingResult {
    // Create a simple embedding based on character n-grams
    const dimensions = 256;
    const embedding = new Array(dimensions).fill(0);
    
    // Simple hashing approach
    for (let i = 0; i < text.length - 2; i++) {
      const trigram = text.slice(i, i + 3);
      let hash = 0;
      for (let j = 0; j < trigram.length; j++) {
        hash = ((hash << 5) - hash) + trigram.charCodeAt(j);
        hash = hash & hash; // Convert to 32bit integer
      }
      const index = Math.abs(hash) % dimensions;
      embedding[index] += 1;
    }
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    const normalized = magnitude > 0 ? embedding.map(v => v / magnitude) : embedding;
    
    return {
      embedding: normalized,
      dimensions,
      model: 'fallback-hash',
    };
  }

  /**
   * Clean and prepare text for embedding
   */
  private cleanText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?-]/g, '') // Remove special characters
      .slice(0, 8000); // Truncate to reasonable length
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have same dimensions');
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
   * Get embedding length
   */
  calculateEmbeddingLength(embedding: number[]): number {
    return Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  }
}

// Singleton instance
export const embeddingService = new EmbeddingService();
export default embeddingService;
