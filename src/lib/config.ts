import { RAGConfig } from './types';

/**
 * The baseline configuration for comparison
 */
export const BASELINE_CONFIG: RAGConfig = {
    chunkSize: 500,
    searchType: 'semantic',
    topK: 5,
    abstainThreshold: 0.5,
    strictCitations: true
};

/**
 * Default user configuration (same as baseline to start)
 */
export const DEFAULT_CONFIG: RAGConfig = {
    chunkSize: 500,
    searchType: 'semantic',
    topK: 5,
    abstainThreshold: 0.5,
    strictCitations: true
};
