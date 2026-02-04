import { FailureMode, RAGConfig, Recommendation } from './types';

/**
 * Generate actionable recommendations based on failure patterns
 */
export function generateRecommendations(
    failureCounts: Record<FailureMode, number>,
    config: RAGConfig
): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Retrieval miss recommendations
    if (failureCounts.retrieval_miss > 0) {
        const fixes: string[] = [];

        if (config.searchType === 'semantic') {
            fixes.push('Switch to Hybrid search (combines semantic + keyword)');
        } else if (config.searchType === 'keyword') {
            fixes.push('Switch to Hybrid or Semantic search for better context understanding');
        }

        if (config.topK < 8) {
            fixes.push(`Increase Top-K from ${config.topK} to 8 to retrieve more chunks`);
        }

        if (config.chunkSize > 500) {
            fixes.push('Reduce chunk size to capture more specific context');
        }

        if (fixes.length > 0) {
            recommendations.push({
                problem: `${failureCounts.retrieval_miss} retrieval miss${failureCounts.retrieval_miss > 1 ? 'es' : ''}`,
                fixes,
                tradeoff: 'Higher Top-K = +50% cost, +0.3s latency'
            });
        }
    }

    // Context dilution recommendations
    if (failureCounts.context_dilution > 0) {
        const fixes: string[] = [];

        if (config.chunkSize > 500) {
            fixes.push(`Reduce chunk size from ${config.chunkSize} to 500 chars`);
        }

        if (config.topK > 3) {
            fixes.push(`Decrease Top-K from ${config.topK} to 3 chunks`);
        }

        if (config.searchType !== 'semantic') {
            fixes.push('Use pure Semantic search (more precise)');
        }

        if (fixes.length > 0) {
            recommendations.push({
                problem: `${failureCounts.context_dilution} context dilution issue${failureCounts.context_dilution > 1 ? 's' : ''}`,
                fixes,
                tradeoff: 'Smaller chunks = may miss context across boundaries'
            });
        }
    }

    // Hallucination recommendations
    if (failureCounts.hallucination > 0) {
        const fixes: string[] = [];

        if (!config.strictCitations) {
            fixes.push('Enable Strict Citations mode');
        }

        if (config.abstainThreshold < 0.6) {
            fixes.push(`Increase Abstain Threshold from ${config.abstainThreshold} to 0.6`);
        }

        if (config.searchType !== 'hybrid') {
            fixes.push('Use Hybrid search for better grounding');
        }

        if (fixes.length > 0) {
            recommendations.push({
                problem: `${failureCounts.hallucination} hallucination${failureCounts.hallucination > 1 ? 's' : ''}`,
                fixes,
                tradeoff: 'Higher threshold = more "I don\'t know" answers'
            });
        }
    }

    // Over-abstain recommendations
    if (failureCounts.over_abstain > 0) {
        const fixes: string[] = [];

        if (config.abstainThreshold > 0.4) {
            fixes.push(`Lower Abstain Threshold from ${config.abstainThreshold} to 0.4`);
        }

        if (config.topK < 5) {
            fixes.push('Increase Top-K to provide more evidence');
        }

        if (config.searchType !== 'hybrid') {
            fixes.push('Switch to Hybrid search for better recall');
        }

        if (fixes.length > 0) {
            recommendations.push({
                problem: `${failureCounts.over_abstain} over-abstention${failureCounts.over_abstain > 1 ? 's' : ''}`,
                fixes,
                tradeoff: 'Lower threshold = risk of less confident answers'
            });
        }
    }

    return recommendations;
}
