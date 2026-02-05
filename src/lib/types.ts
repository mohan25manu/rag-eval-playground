export interface RAGConfig {
  chunkSize: 300 | 500 | 800 | 1200;
  chunkOverlap: number; // Percentage (e.g., 10, 20, 30)
  searchType: 'semantic' | 'keyword' | 'hybrid';
  topK: 3 | 5 | 8;
  abstainThreshold: number;
  strictCitations: boolean;
}

export interface Document {
  id: string;
  name: string;
  text: string;
  size: number;
}

export interface Chunk {
  id: string;
  text: string;
  docId: string;
  docName: string;
  start: number;
  end: number;
  embedding?: number[];
}

export interface RetrievedChunk extends Chunk {
  score: number;
}

export interface EvaluationResult {
  question: string;
  answer: string;
  abstained: boolean;
  confidence: number;
  citations: number[];
  retrievedChunks: RetrievedChunk[];
  failureMode: FailureMode;
  latency: number;
}

export type FailureMode =
  | 'retrieval_miss'
  | 'context_dilution'
  | 'hallucination'
  | 'over_abstain'
  | 'perfect';

export interface Metrics {
  quality: number;
  groundedness: number;
  avgCost: number;
  avgLatency: number;
  failureCounts: Record<FailureMode, number>;
}

export interface Recommendation {
  problem: string;
  fixes: string[];
  tradeoff: string;
}

export interface EvaluationResponse {
  results: EvaluationResult[];
  metrics: Metrics;
  baselineMetrics: Metrics;
  recommendations: Recommendation[];
}
