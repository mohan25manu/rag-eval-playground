import { Chunk, RetrievedChunk } from './types';

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Simple BM25-like keyword scoring
 */
function keywordScore(query: string, text: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const textLower = text.toLowerCase();

    if (queryTerms.length === 0) return 0;

    let matchCount = 0;
    for (const term of queryTerms) {
        if (textLower.includes(term)) {
            matchCount++;
        }
    }

    return matchCount / queryTerms.length;
}

/**
 * Semantic search using embeddings
 */
export async function semanticSearch(
    queryEmbedding: number[],
    chunks: Chunk[],
    topK: number
): Promise<RetrievedChunk[]> {
    const scored = chunks
        .filter(chunk => chunk.embedding && chunk.embedding.length > 0)
        .map(chunk => ({
            ...chunk,
            score: cosineSimilarity(queryEmbedding, chunk.embedding!)
        }));

    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
}

/**
 * Keyword-based search (BM25-like)
 */
export function keywordSearch(
    query: string,
    chunks: Chunk[],
    topK: number
): RetrievedChunk[] {
    const scored = chunks.map(chunk => ({
        ...chunk,
        score: keywordScore(query, chunk.text)
    }));

    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
}

/**
 * Hybrid search combining semantic and keyword
 */
export async function hybridSearch(
    query: string,
    queryEmbedding: number[],
    chunks: Chunk[],
    topK: number
): Promise<RetrievedChunk[]> {
    // Get semantic results
    const semanticResults = await semanticSearch(queryEmbedding, chunks, topK * 2);

    // Get keyword results
    const keywordResults = keywordSearch(query, chunks, topK * 2);

    // Merge results using Reciprocal Rank Fusion (RRF)
    const k = 60; // RRF constant
    const scores = new Map<string, { chunk: Chunk; score: number }>();

    // Add semantic scores
    semanticResults.forEach((chunk, rank) => {
        const rrfScore = 1 / (k + rank + 1);
        scores.set(chunk.id, { chunk, score: rrfScore });
    });

    // Add keyword scores
    keywordResults.forEach((chunk, rank) => {
        const rrfScore = 1 / (k + rank + 1);
        const existing = scores.get(chunk.id);
        if (existing) {
            existing.score += rrfScore;
        } else {
            scores.set(chunk.id, { chunk, score: rrfScore });
        }
    });

    // Sort by combined score
    const merged = Array.from(scores.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map(({ chunk, score }) => ({
            ...chunk,
            score
        }));

    return merged;
}

/**
 * Main retrieval function
 */
export async function retrieveChunks(
    query: string,
    queryEmbedding: number[],
    chunks: Chunk[],
    searchType: 'semantic' | 'keyword' | 'hybrid',
    topK: number
): Promise<RetrievedChunk[]> {
    switch (searchType) {
        case 'semantic':
            return semanticSearch(queryEmbedding, chunks, topK);
        case 'keyword':
            return keywordSearch(query, chunks, topK);
        case 'hybrid':
            return hybridSearch(query, queryEmbedding, chunks, topK);
    }
}
