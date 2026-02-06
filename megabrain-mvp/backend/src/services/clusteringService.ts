import config from '../config';
import logger from '../utils/logger';
import { embeddingService } from './embeddingService';
import { 
  cosineSimilarity, 
  calculateCentroid, 
  calculateCoherence,
  mean 
} from '../utils/helpers';
import type { ClusteringInput, ClusteringResult, ClusterData, Submission } from '../types';

// ============================================
// Clustering Service
// Implements HDBSCAN and DBSCAN clustering algorithms
// for semantic grouping of worker submissions
// ============================================

class ClusteringService {
  private algorithm: 'hdbscan' | 'dbscan';

  constructor() {
    this.algorithm = config.clustering.algorithm;
  }

  /**
   * Perform clustering on submissions
   */
  async clusterSubmissions(submissions: Submission[]): Promise<ClusteringResult> {
    if (!config.clustering.enabled) {
      logger.warn('Clustering is disabled, returning single cluster');
      return this.createSingleCluster(submissions);
    }

    if (submissions.length < 2) {
      logger.info('Not enough submissions for clustering (< 2)');
      return this.createSingleCluster(submissions);
    }

    try {
      // Filter submissions with embeddings
      const validSubmissions = submissions.filter(s => s.embedding && s.embedding.length > 0);
      
      if (validSubmissions.length < 2) {
        logger.info('Not enough valid embeddings for clustering');
        return this.createSingleCluster(submissions);
      }

      // Perform clustering based on selected algorithm
      if (this.algorithm === 'hdbscan') {
        return this.hdbscanCluster(validSubmissions);
      } else {
        return this.dbscanCluster(validSubmissions);
      }
    } catch (error) {
      logger.error('Clustering failed:', error);
      return this.createSingleCluster(submissions);
    }
  }

  /**
   * HDBSCAN clustering implementation
   * Hierarchical Density-Based Spatial Clustering
   */
  private hdbscanCluster(submissions: Submission[]): ClusteringResult {
    const minClusterSize = Math.min(
      config.clustering.hdbscanMinClusterSize,
      Math.floor(submissions.length / 2)
    );
    const minSamples = config.clustering.hdbscanMinSamples;

    // Calculate distance matrix using cosine distance (1 - cosine similarity)
    const distanceMatrix = this.buildDistanceMatrix(submissions);
    
    // Simple HDBSCAN implementation using single-linkage with MST
    // In production, you might want to use a proper HDBSCAN library
    const clusters = this.performHDBSCAN(submissions, distanceMatrix, minClusterSize, minSamples);
    
    return this.buildClusteringResult(submissions, clusters);
  }

  /**
   * DBSCAN clustering implementation
   * Density-Based Spatial Clustering
   */
  private dbscanCluster(submissions: Submission[]): ClusteringResult {
    const eps = config.clustering.dbscanEps;
    const minPoints = Math.min(
      config.clustering.dbscanMinPoints,
      submissions.length
    );

    const embeddings = submissions.map(s => s.embedding!);
    const clusters: number[] = new Array(submissions.length).fill(-1);
    let currentClusterId = 0;

    for (let i = 0; i < submissions.length; i++) {
      if (clusters[i] !== -1) continue; // Already processed

      const neighbors = this.findNeighbors(embeddings, i, eps);

      if (neighbors.length < minPoints) {
        clusters[i] = -1; // Mark as noise
        continue;
      }

      // Start a new cluster
      this.expandCluster(embeddings, clusters, i, neighbors, currentClusterId, eps, minPoints);
      currentClusterId++;
    }

    return this.buildClusteringResult(submissions, clusters);
  }

  /**
   * Find neighbors within epsilon distance using cosine similarity
   */
  private findNeighbors(
    embeddings: number[][], 
    pointIndex: number, 
    eps: number
  ): number[] {
    const neighbors: number[] = [];
    const point = embeddings[pointIndex];

    for (let i = 0; i < embeddings.length; i++) {
      if (i === pointIndex) {
        neighbors.push(i);
        continue;
      }

      const similarity = cosineSimilarity(point, embeddings[i]);
      const distance = 1 - similarity; // Convert similarity to distance

      if (distance <= eps) {
        neighbors.push(i);
      }
    }

    return neighbors;
  }

  /**
   * Expand cluster for DBSCAN
   */
  private expandCluster(
    embeddings: number[][],
    clusters: number[],
    corePointIndex: number,
    neighbors: number[],
    clusterId: number,
    eps: number,
    minPoints: number
  ): void {
    clusters[corePointIndex] = clusterId;

    const queue = [...neighbors];
    let i = 0;

    while (i < queue.length) {
      const currentPoint = queue[i];
      i++;

      if (clusters[currentPoint] === -1) {
        clusters[currentPoint] = clusterId; // Change noise to border point
      }

      if (clusters[currentPoint] !== -1) continue;

      clusters[currentPoint] = clusterId;

      const currentNeighbors = this.findNeighbors(embeddings, currentPoint, eps);
      if (currentNeighbors.length >= minPoints) {
        queue.push(...currentNeighbors);
      }
    }
  }

  /**
   * Simplified HDBSCAN implementation
   * Uses minimum spanning tree and cluster stability
   */
  private performHDBSCAN(
    submissions: Submission[],
    distanceMatrix: number[][],
    minClusterSize: number,
    minSamples: number
  ): number[] {
    // For simplicity, using single-linkage hierarchical clustering
    // A full implementation would use mutual reachability distances
    
    const n = submissions.length;
    const clusters: number[] = new Array(n).fill(-1);
    
    // Use agglomerative clustering with distance threshold
    // This is a simplified version - real HDBSCAN is more complex
    const threshold = 0.5; // Cosine distance threshold
    const visited = new Set<number>();
    let clusterId = 0;

    for (let i = 0; i < n; i++) {
      if (visited.has(i)) continue;

      const cluster = this.findConnectedComponent(distanceMatrix, i, threshold, visited);
      
      if (cluster.length >= minClusterSize) {
        for (const idx of cluster) {
          clusters[idx] = clusterId;
        }
        clusterId++;
      } else {
        for (const idx of cluster) {
          clusters[idx] = -1; // Noise
        }
      }
    }

    return clusters;
  }

  /**
   * Find connected component using BFS
   */
  private findConnectedComponent(
    distanceMatrix: number[][],
    start: number,
    threshold: number,
    visited: Set<number>
  ): number[] {
    const component: number[] = [];
    const queue: number[] = [start];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;

      visited.add(current);
      component.push(current);

      // Find all unvisited neighbors within threshold
      for (let i = 0; i < distanceMatrix.length; i++) {
        if (!visited.has(i) && distanceMatrix[current][i] <= threshold) {
          queue.push(i);
        }
      }
    }

    return component;
  }

  /**
   * Build distance matrix for all embeddings
   */
  private buildDistanceMatrix(submissions: Submission[]): number[][] {
    const n = submissions.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 0;
        } else {
          const sim = cosineSimilarity(submissions[i].embedding!, submissions[j].embedding!);
          const dist = 1 - sim;
          matrix[i][j] = dist;
          matrix[j][i] = dist;
        }
      }
    }

    return matrix;
  }

  /**
   * Build final clustering result
   */
  private buildClusteringResult(
    submissions: Submission[],
    clusterAssignments: number[]
  ): ClusteringResult {
    const clusters = new Map<number, ClusterData>();
    const noise: string[] = [];

    // Group by cluster
    for (let i = 0; i < submissions.length; i++) {
      const clusterId = clusterAssignments[i];
      const submissionId = submissions[i].id;

      if (clusterId === -1) {
        noise.push(submissionId);
        continue;
      }

      if (!clusters.has(clusterId)) {
        clusters.set(clusterId, {
          id: clusterId,
          submissionIds: [],
          centroid: [],
          size: 0,
          coherence: 0,
        });
      }

      clusters.get(clusterId)!.submissionIds.push(submissionId);
    }

    // Calculate centroid and coherence for each cluster
    for (const [clusterId, cluster] of clusters) {
      const clusterSubmissions = submissions.filter(s => 
        cluster.submissionIds.includes(s.id)
      );
      
      cluster.size = clusterSubmissions.length;
      
      if (clusterSubmissions.length > 0) {
        const embeddings = clusterSubmissions.map(s => s.embedding!);
        cluster.centroid = calculateCentroid(embeddings);
        cluster.coherence = calculateCoherence(embeddings);
      }
    }

    // Find dominant cluster
    let dominantClusterId: number | undefined;
    let maxSize = 0;

    for (const [clusterId, cluster] of clusters) {
      if (cluster.size > maxSize) {
        maxSize = cluster.size;
        dominantClusterId = clusterId;
      }
    }

    const noiseRatio = noise.length / submissions.length;

    return {
      clusters,
      noise,
      dominantClusterId,
      noiseRatio,
    };
  }

  /**
   * Create a single cluster for all submissions (fallback)
   */
  private createSingleCluster(submissions: Submission[]): ClusteringResult {
    const cluster: ClusterData = {
      id: 0,
      submissionIds: submissions.map(s => s.id),
      centroid: submissions.length > 0 
        ? calculateCentroid(submissions.map(s => s.embedding || []))
        : [],
      size: submissions.length,
      coherence: 1.0,
    };

    return {
      clusters: new Map([[0, cluster]]),
      noise: [],
      dominantClusterId: 0,
      noiseRatio: 0,
    };
  }

  /**
   * Calculate cluster hash for on-chain reference
   */
  calculateClusterHash(cluster: ClusterData): string {
    const data = {
      id: cluster.id,
      submissionIds: cluster.submissionIds.sort(),
      centroid: cluster.centroid.map(v => Math.round(v * 1000) / 1000), // Round for consistency
    };
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  /**
   * Calculate dominance ratio of a cluster
   */
  calculateDominanceRatio(cluster: ClusterData, totalSubmissions: number): number {
    return totalSubmissions > 0 ? cluster.size / totalSubmissions : 0;
  }
}

// Singleton instance
export const clusteringService = new ClusteringService();
export default clusteringService;
