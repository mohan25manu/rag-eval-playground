import { EvaluationResult, FailureMode, Metrics } from './types';
import { estimateTokens } from './rag-engine';

/**
 * Calculate aggregate metrics from evaluation results
 */
export function calculateMetrics(results: EvaluationResult[]): Metrics {
    const total = results.length;

    if (total === 0) {
        return {
            quality: 0,
            groundedness: 0,
            avgCost: 0,
            avgLatency: 0,
            failureCounts: {
                retrieval_miss: 0,
                context_dilution: 0,
                hallucination: 0,
                over_abstain: 0,
                perfect: 0
            }
        };
    }

    // Count failure modes
    const failureCounts = results.reduce((acc, r) => {
        acc[r.failureMode] = (acc[r.failureMode] || 0) + 1;
        return acc;
    }, {} as Record<FailureMode, number>);

    // Ensure all failure modes are present
    const allModes: FailureMode[] = [
        'retrieval_miss',
        'context_dilution',
        'hallucination',
        'over_abstain',
        'perfect'
    ];
    for (const mode of allModes) {
        if (!(mode in failureCounts)) {
            failureCounts[mode] = 0;
        }
    }

    // Answer quality: % of non-abstained answers with citations
    const quality = results.filter(r =>
        !r.abstained && r.citations.length > 0
    ).length / total * 100;

    // Groundedness: % of answers with any citations
    const groundedness = results.filter(r =>
        r.citations.length > 0
    ).length / total * 100;

    // Avg cost estimation (Groq pricing: ~$0.05 per 1M input, ~$0.08 per 1M output)
    const avgTokens = results.reduce((sum, r) => {
        const contextTokens = r.retrievedChunks.reduce((s, c) => s + estimateTokens(c.text), 0);
        const answerTokens = estimateTokens(r.answer);
        return sum + contextTokens + answerTokens;
    }, 0) / total;

    // Very rough cost estimate (Groq is essentially free, but we estimate for comparison)
    const avgCost = avgTokens / 1000000 * 0.10; // ~$0.10 per 1M tokens blended rate

    // Avg latency
    const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / total;

    return {
        quality: Math.round(quality),
        groundedness: Math.round(groundedness),
        avgCost,
        avgLatency,
        failureCounts
    };
}

/**
 * Compare two metrics and return relative differences
 */
export function compareMetrics(
    current: Metrics,
    baseline: Metrics
): {
    quality: { value: number; diff: number; better: boolean };
    groundedness: { value: number; diff: number; better: boolean };
    avgCost: { value: number; diff: number; better: boolean };
    avgLatency: { value: number; diff: number; better: boolean };
} {
    return {
        quality: {
            value: current.quality,
            diff: current.quality - baseline.quality,
            better: current.quality >= baseline.quality
        },
        groundedness: {
            value: current.groundedness,
            diff: current.groundedness - baseline.groundedness,
            better: current.groundedness >= baseline.groundedness
        },
        avgCost: {
            value: current.avgCost,
            diff: ((current.avgCost - baseline.avgCost) / baseline.avgCost) * 100,
            better: current.avgCost <= baseline.avgCost
        },
        avgLatency: {
            value: current.avgLatency,
            diff: current.avgLatency - baseline.avgLatency,
            better: current.avgLatency <= baseline.avgLatency
        }
    };
}
