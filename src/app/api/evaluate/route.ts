import { NextRequest, NextResponse } from 'next/server';
import { chunkDocuments } from '@/lib/chunker';
import { retrieveChunks } from '@/lib/retriever';
import { answerQuestion } from '@/lib/rag-engine';
import { classifyFailure } from '@/lib/evaluator';
import { calculateMetrics } from '@/lib/metrics';
import { generateRecommendations } from '@/lib/recommendations';
import { BASELINE_CONFIG } from '@/lib/config';
import {
    Chunk,
    Document,
    EvaluationResult,
    RAGConfig,
    EvaluationResponse
} from '@/lib/types';

export const maxDuration = 60;

// Simple in-memory embeddings using text similarity
// In production, you'd use @xenova/transformers, but for serverless we use a simpler approach
function simpleEmbed(text: string): number[] {
    // Create a simple bag-of-words style embedding
    const words = text.toLowerCase().split(/\s+/);
    const vocab = new Map<string, number>();
    let vocabIndex = 0;

    // Build vocabulary from common words
    const commonWords = [
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
        'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
        'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
        'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
        'data', 'analysis', 'method', 'result', 'study', 'research', 'system',
        'model', 'process', 'approach', 'information', 'technology', 'development',
        'performance', 'quality', 'application', 'design', 'implementation', 'evaluation',
        'conclusion', 'findings', 'methodology', 'limitations', 'future', 'work'
    ];

    commonWords.forEach((word, idx) => vocab.set(word, idx));

    // Create embedding vector
    const embedding = new Array(commonWords.length).fill(0);
    words.forEach(word => {
        const idx = vocab.get(word);
        if (idx !== undefined) {
            embedding[idx] += 1;
        }
    });

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
        return embedding.map(val => val / magnitude);
    }
    return embedding;
}

async function embedChunks(chunks: Chunk[]): Promise<Chunk[]> {
    return chunks.map(chunk => ({
        ...chunk,
        embedding: simpleEmbed(chunk.text)
    }));
}

async function runEvaluation(
    documents: Document[],
    questions: string[],
    config: RAGConfig
): Promise<EvaluationResult[]> {
    // Chunk documents
    const chunks = chunkDocuments(documents, config.chunkSize, 100);

    // Embed chunks
    const embeddedChunks = await embedChunks(chunks);

    const results: EvaluationResult[] = [];

    for (const question of questions) {
        const startTime = Date.now();

        // Embed query
        const queryEmbedding = simpleEmbed(question);

        // Retrieve relevant chunks
        const retrievedChunks = await retrieveChunks(
            question,
            queryEmbedding,
            embeddedChunks,
            config.searchType,
            config.topK
        );

        // Generate answer
        const answerResult = await answerQuestion(
            question,
            retrievedChunks,
            config.strictCitations,
            config.abstainThreshold
        );

        // Classify failure mode
        const failureMode = classifyFailure(
            question,
            answerResult.answer,
            retrievedChunks,
            answerResult.abstained,
            answerResult.confidence,
            answerResult.citations
        );

        results.push({
            question,
            answer: answerResult.answer,
            abstained: answerResult.abstained,
            confidence: answerResult.confidence,
            citations: answerResult.citations,
            retrievedChunks: retrievedChunks.slice(0, 3), // Top 3 for display
            failureMode,
            latency: (Date.now() - startTime) / 1000
        });
    }

    return results;
}

export async function POST(req: NextRequest) {
    try {
        const { documents, questions, config } = await req.json() as {
            documents: Document[];
            questions: string[];
            config: RAGConfig;
        };

        // Validate inputs
        if (!documents || documents.length === 0) {
            return NextResponse.json(
                { error: 'No documents provided' },
                { status: 400 }
            );
        }

        if (!questions || questions.length === 0) {
            return NextResponse.json(
                { error: 'No questions provided' },
                { status: 400 }
            );
        }

        if (questions.length < 3 || questions.length > 20) {
            return NextResponse.json(
                { error: 'Please provide between 3 and 20 questions' },
                { status: 400 }
            );
        }

        // Run evaluation with user config
        const results = await runEvaluation(documents, questions, config);

        // Run evaluation with baseline config (for comparison)
        const baselineResults = await runEvaluation(documents, questions, BASELINE_CONFIG);

        // Calculate metrics
        const metrics = calculateMetrics(results);
        const baselineMetrics = calculateMetrics(baselineResults);

        // Generate recommendations
        const recommendations = generateRecommendations(metrics.failureCounts, config);

        const response: EvaluationResponse = {
            results,
            metrics,
            baselineMetrics,
            recommendations
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Evaluation error:', error);
        return NextResponse.json(
            { error: 'Failed to run evaluation. Please try again.' },
            { status: 500 }
        );
    }
}
