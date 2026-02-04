import Groq from 'groq-sdk';
import { RetrievedChunk } from './types';

// Lazy-load Groq client to avoid build-time errors
let groqClient: Groq | null = null;
function getGroqClient(): Groq {
    if (!groqClient) {
        groqClient = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });
    }
    return groqClient;
}

export interface AnswerResult {
    answer: string;
    abstained: boolean;
    confidence: number;
    citations: number[];
}

/**
 * Generate an answer using the RAG pipeline
 */
export async function answerQuestion(
    question: string,
    relevantChunks: RetrievedChunk[],
    strictCitations: boolean,
    abstainThreshold: number
): Promise<AnswerResult> {
    if (relevantChunks.length === 0) {
        return {
            answer: "I don't have enough information to answer this question.",
            abstained: true,
            confidence: 0,
            citations: []
        };
    }

    // Format context with source indices
    const context = relevantChunks
        .map((chunk, i) => `[${i + 1}] (${chunk.docName}): ${chunk.text}`)
        .join('\n\n');

    const citationInstruction = strictCitations
        ? "You MUST cite sources using [N] format for every claim. If the evidence is insufficient, respond with 'I don't have enough information to answer this reliably.'"
        : "Cite sources using [N] format when possible.";

    const systemPrompt = `You are a helpful assistant that answers questions based on the provided context. 
${citationInstruction}
Only use information from the provided context. Do not make up information.`;

    const userPrompt = `Context:
${context}

Question: ${question}

Answer:`;

    try {
        const response = await getGroqClient().chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.2,
            max_tokens: 1024,
        });

        const answer = response.choices[0]?.message?.content || '';

        // Extract citations [1], [2], etc.
        const citationMatches = answer.match(/\[(\d+)\]/g) || [];
        const citations: number[] = [...new Set(
            citationMatches
                .map((m: string) => parseInt(m.replace(/[\[\]]/g, '')))
                .filter((n: number) => n > 0 && n <= relevantChunks.length)
        )];

        // Calculate confidence based on citations and retrieval scores
        const citationCoverage = citations.length / Math.min(relevantChunks.length, 3);
        const avgRetrievalScore = relevantChunks.slice(0, 3).reduce((sum, c) => sum + c.score, 0) / 3;
        const confidence = (citationCoverage * 0.5 + avgRetrievalScore * 0.5);

        // Check for abstention indicators
        const abstainPhrases = [
            "don't have enough information",
            "cannot answer",
            "not enough context",
            "no information available",
            "unable to determine"
        ];
        const hasAbstainPhrase = abstainPhrases.some(phrase =>
            answer.toLowerCase().includes(phrase)
        );

        if (hasAbstainPhrase || confidence < abstainThreshold) {
            return {
                answer: "I don't have enough information to answer this reliably.",
                abstained: true,
                confidence,
                citations: []
            };
        }

        return {
            answer,
            abstained: false,
            confidence,
            citations
        };
    } catch (error) {
        console.error('Error calling Groq API:', error);
        throw error;
    }
}

/**
 * Estimate token count for cost calculation
 */
export function estimateTokens(text: string): number {
    // Rough estimate: ~1.3 tokens per word
    return Math.ceil(text.split(/\s+/).length * 1.3);
}
