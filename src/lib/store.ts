import { create } from 'zustand';
import { Document, RAGConfig, EvaluationResponse } from '@/lib/types';
import { DEFAULT_CONFIG } from '@/lib/config';
import { SAMPLE_QUESTIONS } from '@/lib/sample-questions';

export type Screen = 'upload' | 'questions' | 'configure' | 'results';

interface AppState {
    // Navigation
    currentScreen: Screen;
    setScreen: (screen: Screen) => void;

    // Documents
    documents: Document[];
    setDocuments: (docs: Document[]) => void;
    clearDocuments: () => void;

    // Questions
    questions: string[];
    useSampleQuestions: boolean;
    setQuestions: (questions: string[]) => void;
    setUseSampleQuestions: (use: boolean) => void;

    // Configuration
    config: RAGConfig;
    setConfig: (config: Partial<RAGConfig>) => void;
    resetConfig: () => void;

    // Evaluation
    isEvaluating: boolean;
    evaluationResults: EvaluationResponse | null;
    evaluationError: string | null;
    setIsEvaluating: (isEvaluating: boolean) => void;
    setEvaluationResults: (results: EvaluationResponse | null) => void;
    setEvaluationError: (error: string | null) => void;

    // Reset everything
    reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    // Navigation
    currentScreen: 'upload',
    setScreen: (screen) => set({ currentScreen: screen }),

    // Documents
    documents: [],
    setDocuments: (documents) => set({ documents }),
    clearDocuments: () => set({ documents: [] }),

    // Questions
    questions: SAMPLE_QUESTIONS,
    useSampleQuestions: true,
    setQuestions: (questions) => set({ questions }),
    setUseSampleQuestions: (useSampleQuestions) => set({
        useSampleQuestions,
        questions: useSampleQuestions ? SAMPLE_QUESTIONS : []
    }),

    // Configuration
    config: { ...DEFAULT_CONFIG },
    setConfig: (config) => set((state) => ({
        config: { ...state.config, ...config }
    })),
    resetConfig: () => set({ config: { ...DEFAULT_CONFIG } }),

    // Evaluation
    isEvaluating: false,
    evaluationResults: null,
    evaluationError: null,
    setIsEvaluating: (isEvaluating) => set({ isEvaluating }),
    setEvaluationResults: (evaluationResults) => set({ evaluationResults }),
    setEvaluationError: (evaluationError) => set({ evaluationError }),

    // Reset everything
    reset: () => set({
        currentScreen: 'upload',
        documents: [],
        questions: SAMPLE_QUESTIONS,
        useSampleQuestions: true,
        config: { ...DEFAULT_CONFIG },
        isEvaluating: false,
        evaluationResults: null,
        evaluationError: null
    })
}));
