import config from '../config';
import logger from '../utils/logger';
import {
  mean,
  stdDev,
  weightedMean,
  weightedStdDev,
  clamp,
  sigmoid,
} from '../utils/helpers';
import type { 
  Evaluation, 
  Submission, 
  ClusterData, 
  ConsensusData,
  PaymentDistribution,
  WorkerPayment,
  EvaluatorPayment,
  Agent,
} from '../types';

// ============================================
// Consensus Service
// Calculates consensus from evaluator scores
// Implements weighted aggregation and outlier detection
// ============================================

class ConsensusService {
  /**
   * Calculate consensus from evaluations
   * Returns consensus data with outlier detection
   */
  calculateConsensus(
    evaluations: Evaluation[],
    submissions: Submission[],
    clusters: Map<number, ClusterData>,
    dominantClusterId: number | undefined,
    agents: Map<string, Agent>
  ): ConsensusData {
    if (evaluations.length === 0) {
      return {
        consensusScore: 0,
        confidence: 0,
        dominantClusterHash: '',
        clusterSizes: [],
        noiseRatio: 0,
        outliers: [],
        supportRatio: 0,
      };
    }

    // Group evaluations by submission
    const submissionEvaluations = this.groupEvaluationsBySubmission(evaluations);
    
    // Calculate weighted scores for each submission
    const submissionScores = this.calculateSubmissionScores(
      submissionEvaluations,
      agents
    );

    // Identify dominant cluster and calculate consensus
    const dominantCluster = dominantClusterId !== undefined 
      ? clusters.get(dominantClusterId)
      : undefined;

    if (!dominantCluster) {
      return {
        consensusScore: 0,
        confidence: 0,
        dominantClusterHash: '',
        clusterSizes: Array.from(clusters.values()).map(c => c.size),
        noiseRatio: 0,
        outliers: [],
        supportRatio: 0,
      };
    }

    // Calculate consensus score from dominant cluster
    const dominantScores = dominantCluster.submissionIds
      .map(id => submissionScores.get(id))
      .filter((s): s is number => s !== undefined);

    const consensusScore = dominantScores.length > 0 ? mean(dominantScores) : 0;

    // Identify outlier evaluators
    const outlierEvaluators = this.identifyOutlierEvaluators(
      evaluations,
      submissionScores,
      agents
    );

    // Calculate confidence based on evaluator agreement
    const confidence = this.calculateConfidence(evaluations, outlierEvaluators);

    // Calculate support ratio (evaluators agreeing with consensus / total)
    const supportRatio = this.calculateSupportRatio(evaluations, outlierEvaluators);

    // Generate cluster hash
    const clusterHash = this.generateClusterHash(dominantCluster);

    return {
      consensusScore,
      confidence,
      dominantClusterHash: clusterHash,
      clusterSizes: Array.from(clusters.values()).map(c => c.size),
      noiseRatio: 0, // Will be set from clustering result
      outliers: outlierEvaluators,
      supportRatio,
    };
  }

  /**
   * Group evaluations by submission
   */
  private groupEvaluationsBySubmission(
    evaluations: Evaluation[]
  ): Map<string, Evaluation[]> {
    const grouped = new Map<string, Evaluation[]>();

    for (const eval of evaluations) {
      if (!grouped.has(eval.submission_id)) {
        grouped.set(eval.submission_id, []);
      }
      grouped.get(eval.submission_id)!.push(eval);
    }

    return grouped;
  }

  /**
   * Calculate weighted scores for each submission
   */
  private calculateSubmissionScores(
    submissionEvaluations: Map<string, Evaluation[]>,
    agents: Map<string, Agent>
  ): Map<string, number> {
    const scores = new Map<string, number>();

    for (const [submissionId, evals] of submissionEvaluations) {
      if (evals.length === 0) continue;

      const weightedScores = evals.map(e => ({
        score: e.score,
        weight: this.calculateEvaluatorWeight(e, agents.get(e.evaluator_id)),
      }));

      const weights = weightedScores.map(w => w.weight);
      const values = weightedScores.map(w => w.score);

      const weightedScore = weightedMean(values, weights);
      scores.set(submissionId, weightedScore);
    }

    return scores;
  }

  /**
   * Calculate weight for an evaluator based on reputation and confidence
   */
  private calculateEvaluatorWeight(
    evaluation: Evaluation,
    evaluator: Agent | undefined
  ): number {
    if (!evaluator) return evaluation.confidence;

    const reputationWeight = Math.sqrt(evaluator.evaluator_reputation);
    return evaluation.confidence * reputationWeight;
  }

  /**
   * Identify outlier evaluators (those > 2σ from consensus)
   */
  private identifyOutlierEvaluators(
    evaluations: Evaluation[],
    submissionScores: Map<string, number>,
    agents: Map<string, Agent>
  ): string[] {
    // Calculate weighted mean and std dev of evaluator scores
    const evaluatorDeviations: { evaluatorId: string; deviation: number; weight: number }[] = [];

    for (const eval of evaluations) {
      const submissionScore = submissionScores.get(eval.submission_id);
      if (submissionScore === undefined) continue;

      const deviation = Math.abs(eval.score - submissionScore);
      const weight = this.calculateEvaluatorWeight(eval, agents.get(eval.evaluator_id));

      evaluatorDeviations.push({
        evaluatorId: eval.evaluator_id,
        deviation,
        weight,
      });
    }

    if (evaluatorDeviations.length === 0) return [];

    const weights = evaluatorDeviations.map(e => e.weight);
    const deviations = evaluatorDeviations.map(e => e.deviation);

    const meanDeviation = weightedMean(deviations, weights);
    const stdDeviation = weightedStdDev(deviations, weights);

    const threshold = meanDeviation + config.consensus.outlierThresholdSigma * stdDeviation;

    // Find unique outlier evaluators
    const outliers = new Set<string>();
    for (const eval of evaluatorDeviations) {
      if (eval.deviation > threshold) {
        outliers.add(eval.evaluatorId);
      }
    }

    return Array.from(outliers);
  }

  /**
   * Calculate confidence in the consensus
   */
  private calculateConfidence(
    evaluations: Evaluation[],
    outliers: string[]
  ): number {
    if (evaluations.length === 0) return 0;

    // Filter out outlier evaluations
    const validEvals = evaluations.filter(e => !outliers.includes(e.evaluator_id));

    if (validEvals.length === 0) return 0;

    // Calculate average confidence of non-outlier evaluators
    const avgConfidence = mean(validEvals.map(e => e.confidence));

    // Calculate agreement ratio
    const agreementRatio = validEvals.length / evaluations.length;

    // Weight confidence by agreement
    return avgConfidence * agreementRatio;
  }

  /**
   * Calculate support ratio (proportion of evaluators in agreement)
   */
  private calculateSupportRatio(
    evaluations: Evaluation[],
    outliers: string[]
  ): number {
    if (evaluations.length === 0) return 0;
    const validCount = evaluations.filter(e => !outliers.includes(e.evaluator_id)).length;
    return validCount / evaluations.length;
  }

  /**
   * Calculate payment distribution for workers and evaluators
   */
  calculatePaymentDistribution(
    task: any,
    submissions: Submission[],
    evaluations: Evaluation[],
    consensus: ConsensusData,
    clusters: Map<number, ClusterData>,
    agents: Map<string, Agent>,
    dominantClusterId: number | undefined
  ): PaymentDistribution {
    const workerPayments: WorkerPayment[] = [];
    const evaluatorPayments: EvaluatorPayment[] = [];

    // Calculate worker payments
    const dominantCluster = dominantClusterId !== undefined
      ? clusters.get(dominantClusterId)
      : undefined;

    if (dominantCluster) {
      const inConsensusSubmissions = submissions.filter(s =>
        dominantCluster.submissionIds.includes(s.id)
      );

      const totalScore = inConsensusSubmissions.reduce((sum, s) => sum + (s.final_score || 0), 0);

      for (const submission of inConsensusSubmissions) {
        const agent = agents.get(submission.worker_id);
        if (!agent) continue;

        const score = submission.final_score || 0;
        const scoreRatio = totalScore > 0 ? score / totalScore : 1 / inConsensusSubmissions.length;

        // Base payment proportional to score
        const basePayment = task.worker_pool * scoreRatio;

        // Determine bonus eligibility (top 10% scores)
        const scores = inConsensusSubmissions.map(s => s.final_score || 0).sort((a, b) => b - a);
        const thresholdIndex = Math.floor(scores.length * 0.1);
        const bonusThreshold = scores[thresholdIndex] || 0;
        const bonusEligible = score >= bonusThreshold && scores.length > 1;

        // Calculate bonus
        const bonusCount = scores.filter(s => s >= bonusThreshold).length;
        const bonusPayment = bonusEligible && bonusCount > 0
          ? task.bonus_pool / bonusCount
          : 0;

        workerPayments.push({
          workerId: submission.worker_id,
          address: agent.address || '',
          basePayment,
          bonusPayment,
          totalPayment: basePayment + bonusPayment,
          score,
          inConsensus: true,
        });
      }

      // Workers not in consensus get slashed (no payment)
      const outOfConsensusSubmissions = submissions.filter(s =>
        !dominantCluster.submissionIds.includes(s.id)
      );

      for (const submission of outOfConsensusSubmissions) {
        const agent = agents.get(submission.worker_id);
        if (!agent) continue;

        workerPayments.push({
          workerId: submission.worker_id,
          address: agent.address || '',
          basePayment: 0,
          bonusPayment: 0,
          totalPayment: 0,
          score: submission.final_score || 0,
          inConsensus: false,
        });
      }
    }

    // Calculate evaluator payments
    for (const evaluation of evaluations) {
      const agent = agents.get(evaluation.evaluator_id);
      if (!agent) continue;

      const isOutlier = consensus.outliers.includes(evaluation.evaluator_id);

      // Calculate alignment with consensus
      const alignment = isOutlier 
        ? 0 
        : 1 - (evaluation.consensus_distance || 0) / 100;

      // Payment based on alignment and confidence
      const payment = isOutlier
        ? 0
        : task.evaluator_pool * alignment * evaluation.confidence / evaluations.length;

      evaluatorPayments.push({
        evaluatorId: evaluation.evaluator_id,
        address: agent.address || '',
        payment,
        alignment,
        confidence: evaluation.confidence,
        isOutlier,
      });
    }

    const totalWorkerPayments = workerPayments.reduce((sum, p) => sum + p.totalPayment, 0);
    const totalEvaluatorPayments = evaluatorPayments.reduce((sum, p) => sum + p.payment, 0);

    // Calculate slashed amount
    const totalSlashed = task.total_budget - totalWorkerPayments - totalEvaluatorPayments;

    return {
      workers: workerPayments,
      evaluators: evaluatorPayments,
      totalWorkerPayments,
      totalEvaluatorPayments,
      totalSlashed,
    };
  }

  /**
   * Generate cluster hash for on-chain reference
   */
  private generateClusterHash(cluster: ClusterData): string {
    const crypto = require('crypto');
    const data = {
      id: cluster.id,
      submissionIds: cluster.submissionIds.sort(),
      centroid: cluster.centroid.map(v => Math.round(v * 1000) / 1000),
    };
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  /**
   * Check if consensus threshold is met
   */
  isConsensusReached(consensus: ConsensusData): boolean {
    return (
      consensus.confidence >= config.consensus.minEvaluatorAlignment &&
      consensus.supportRatio >= config.consensus.threshold
    );
  }
}

// Singleton instance
export const consensusService = new ConsensusService();
export default consensusService;
