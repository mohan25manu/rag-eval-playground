import { FailureMode, RetrievedChunk } from './types';

/**
 * Classify the failure mode of a RAG answer
 */
export function classifyFailure(
    question: string,
    answer: string,
    retrievedChunks: RetrievedChunk[],
    abstained: boolean,
    confidence: number,
    citations: number[]
): FailureMode {
    const topScore = retrievedChunks[0]?.score ?? 0;
    const hasCitations = citations.length > 0;

    // Over-abstain: refused when good evidence existed
    if (abstained && retrievedChunks.length > 0 && topScore > 0.5) {
        return 'over_abstain';
    }

    // Hallucination: answered without citing any sources
    if (!abstained && !hasCitations && answer.length > 50) {
        return 'hallucination';
    }

    // Retrieval miss: low retrieval scores indicate relevant content wasn't found
    if (topScore < 0.3) {
        return 'retrieval_miss';
    }

    // Context dilution: retrieved many chunks but most have low relevance
    // This means the context is polluted with irrelevant information
    if (retrievedChunks.length >= 5) {
        const lowScoreChunks = retrievedChunks.slice(2).filter(c => c.score < 0.4);
        if (lowScoreChunks.length >= retrievedChunks.length - 2) {
            return 'context_dilution';
        }
    }

    // Perfect: has citations and good retrieval
    if (hasCitations && topScore > 0.4 && !abstained) {
        return 'perfect';
    }

    // Default to retrieval miss if nothing else matches
    return 'retrieval_miss';
}

/**
 * Get failure mode display info
 */
export function getFailureModeInfo(mode: FailureMode): {
    label: string;
    description: string;
    color: string;
    icon: string;
} {
    switch (mode) {
        case 'perfect':
            return {
                label: 'Perfect Answer',
                description: 'Grounded and correctly cited',
                color: 'green',
                icon: '✅'
            };
        case 'retrieval_miss':
            return {
                label: 'Retrieval Miss',
                description: 'Relevant information not found',
                color: 'orange',
                icon: '❌'
            };
        case 'context_dilution':
            return {
                label: 'Context Dilution',
                description: 'Too much irrelevant context',
                color: 'orange',
                icon: '❌'
            };
        case 'hallucination':
            return {
                label: 'Hallucination',
                description: 'Answer without evidence',
                color: 'red',
                icon: '❌'
            };
        case 'over_abstain':
            return {
                label: 'Over-abstain',
                description: 'Refused when evidence existed',
                color: 'yellow',
                icon: '⚠️'
            };
    }
}
