import Groq from 'groq-sdk';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RetrievedChunk } from './types';

export type LLMProvider = 'groq' | 'openai' | 'anthropic' | 'gemini';

export interface AnswerResult {
    answer: string;
    abstained: boolean;
    confidence: number;
    citations: number[];
    provider?: LLMProvider;
}

/**
 * Detect LLM provider based on API key prefix
 */
export function detectProvider(apiKey: string): LLMProvider {
    if (apiKey.startsWith('gsk_')) return 'groq';
    if (apiKey.startsWith('sk-ant-')) return 'anthropic';
    if (apiKey.startsWith('sk-')) return 'openai';
    if (apiKey.startsWith('AIza')) return 'gemini';

    // Default to groq if unknown but present (for backwards compatibility with env vars)
    return 'groq';
}

/**
 * Generate an answer using the RAG pipeline
 */
export async function answerQuestion(
    question: string,
    relevantChunks: RetrievedChunk[],
    strictCitations: boolean,
    abstainThreshold: number,
    apiKey: string | null = null
): Promise<AnswerResult> {
    if (relevantChunks.length === 0) {
        return {
            answer: "I don't have enough information to answer this question.",
            abstained: true,
            confidence: 0,
            citations: []
        };
    }

    const effectiveKey = apiKey || process.env.GROQ_API_KEY || '';
    const provider = detectProvider(effectiveKey);

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

    let answer = '';

    try {
        if (provider === 'groq') {
            const client = new Groq({ apiKey: effectiveKey });
            const response = await client.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.2,
                max_tokens: 1024,
            });
            answer = response.choices[0]?.message?.content || '';
        } else if (provider === 'openai') {
            const client = new OpenAI({ apiKey: effectiveKey });
            const response = await client.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.2,
            });
            answer = response.choices[0]?.message?.content || '';
        } else if (provider === 'anthropic') {
            const client = new Anthropic({ apiKey: effectiveKey });
            const response = await client.messages.create({
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 1024,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }],
                temperature: 0.2,
            });
            answer = response.content[0].type === 'text' ? response.content[0].text : '';
        } else if (provider === 'gemini') {
            const genAI = new GoogleGenerativeAI(effectiveKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
            const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
            const result = await model.generateContent(fullPrompt);
            answer = result.response.text();
        }

        // Extract citations [1], [2], etc.
        const citationMatches = answer.match(/\[(\d+)\]/g) || [];
        const citations: number[] = [...new Set(
            citationMatches
                .map((m: string) => parseInt(m.replace(/[\[\]]/g, '')))
                .filter((n: number) => n > 0 && n <= relevantChunks.length)
        )];

        // Calculate confidence based on citations and retrieval scores
        const citationCoverage = citations.length / Math.min(relevantChunks.length, 3);
        const avgRetrievalScore = relevantChunks.slice(0, 3).reduce((sum, c) => sum + (c.score || 0), 0) / 3;
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
                citations: [],
                provider
            };
        }

        return {
            answer,
            abstained: false,
            confidence,
            citations,
            provider
        };
    } catch (error: any) {
        console.error(`Error calling ${provider} API:`, error);
        throw error;
    }
}

/**
 * Estimate token count for cost calculation
 */
export function estimateTokens(text: string): number {
    // Rough estimate: ~1.3 tokens per word
    return Math.ceil((text || '').split(/\s+/).length * 1.3);
}

