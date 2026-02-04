'use client';

import { ArrowLeft, Play, Settings, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppStore } from '@/lib/store';
import { BASELINE_CONFIG } from '@/lib/config';
import { RAGConfig } from '@/lib/types';

interface ConfigRowProps {
    label: string;
    tooltip: string;
    baselineValue: string;
    children: React.ReactNode;
}

function ConfigRow({ label, tooltip, baselineValue, children }: ConfigRowProps) {
    return (
        <div className="grid grid-cols-3 gap-4 items-center py-3 border-b last:border-0">
            <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{label}</span>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[250px]">
                            <p className="text-sm">{tooltip}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div className="text-sm text-muted-foreground text-center">
                {baselineValue}
            </div>
            <div className="flex justify-end">
                {children}
            </div>
        </div>
    );
}

export function Screen3Configure() {
    const {
        config,
        setConfig,
        documents,
        questions,
        setScreen,
        setIsEvaluating,
        setEvaluationResults,
        setEvaluationError
    } = useAppStore();

    const handleEvaluate = async () => {
        setIsEvaluating(true);
        setEvaluationError(null);
        setScreen('results');

        try {
            const response = await fetch('/api/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documents,
                    questions,
                    config
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Evaluation failed');
            }

            setEvaluationResults(data);
        } catch (err) {
            setEvaluationError(err instanceof Error ? err.message : 'Evaluation failed');
        } finally {
            setIsEvaluating(false);
        }
    };

    // Estimate costs
    const estimatedQueries = questions.length * 2; // baseline + user config
    const estimatedTime = Math.ceil(questions.length * 3); // ~3s per question

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setScreen('questions')}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Configure Your RAG Pipeline</h1>
                    <p className="text-muted-foreground text-sm">
                        Adjust settings and compare against the baseline
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Settings className="h-5 w-5" />
                        A/B Comparison
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Header */}
                    <div className="grid grid-cols-3 gap-4 pb-3 border-b font-medium text-sm">
                        <div>Setting</div>
                        <div className="text-center text-muted-foreground">Baseline</div>
                        <div className="text-right text-primary">Your Config</div>
                    </div>

                    {/* Chunk Size */}
                    <ConfigRow
                        label="Chunk Size"
                        tooltip="How to split documents into pieces. Smaller chunks = more precise but may lose context."
                        baselineValue={`${BASELINE_CONFIG.chunkSize} chars`}
                    >
                        <RadioGroup
                            value={String(config.chunkSize)}
                            onValueChange={(v) => setConfig({ chunkSize: parseInt(v) as RAGConfig['chunkSize'] })}
                            className="flex gap-2"
                        >
                            {[300, 500, 800, 1200].map((size) => (
                                <div key={size} className="flex items-center">
                                    <RadioGroupItem value={String(size)} id={`chunk-${size}`} className="sr-only" />
                                    <label
                                        htmlFor={`chunk-${size}`}
                                        className={`px-2 py-1 text-xs rounded cursor-pointer transition-colors ${config.chunkSize === size
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted hover:bg-muted/80'
                                            }`}
                                    >
                                        {size}
                                    </label>
                                </div>
                            ))}
                        </RadioGroup>
                    </ConfigRow>

                    {/* Search Type */}
                    <ConfigRow
                        label="Search Type"
                        tooltip="Semantic uses AI embeddings. Keyword uses exact matches. Hybrid combines both."
                        baselineValue={BASELINE_CONFIG.searchType}
                    >
                        <RadioGroup
                            value={config.searchType}
                            onValueChange={(v) => setConfig({ searchType: v as RAGConfig['searchType'] })}
                            className="flex gap-2"
                        >
                            {['semantic', 'keyword', 'hybrid'].map((type) => (
                                <div key={type} className="flex items-center">
                                    <RadioGroupItem value={type} id={`search-${type}`} className="sr-only" />
                                    <label
                                        htmlFor={`search-${type}`}
                                        className={`px-2 py-1 text-xs rounded cursor-pointer capitalize transition-colors ${config.searchType === type
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted hover:bg-muted/80'
                                            }`}
                                    >
                                        {type}
                                    </label>
                                </div>
                            ))}
                        </RadioGroup>
                    </ConfigRow>

                    {/* Top-K */}
                    <ConfigRow
                        label="Top-K Results"
                        tooltip="How many chunks to retrieve. More chunks = better coverage but more noise."
                        baselineValue={String(BASELINE_CONFIG.topK)}
                    >
                        <RadioGroup
                            value={String(config.topK)}
                            onValueChange={(v) => setConfig({ topK: parseInt(v) as RAGConfig['topK'] })}
                            className="flex gap-2"
                        >
                            {[3, 5, 8].map((k) => (
                                <div key={k} className="flex items-center">
                                    <RadioGroupItem value={String(k)} id={`topk-${k}`} className="sr-only" />
                                    <label
                                        htmlFor={`topk-${k}`}
                                        className={`px-3 py-1 text-xs rounded cursor-pointer transition-colors ${config.topK === k
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted hover:bg-muted/80'
                                            }`}
                                    >
                                        {k}
                                    </label>
                                </div>
                            ))}
                        </RadioGroup>
                    </ConfigRow>

                    {/* Abstain Threshold */}
                    <ConfigRow
                        label="Abstain Threshold"
                        tooltip="When confidence is below this, the model says 'I don't know'. Higher = safer but more abstentions."
                        baselineValue={String(BASELINE_CONFIG.abstainThreshold)}
                    >
                        <div className="flex items-center gap-3 w-40">
                            <Slider
                                value={[config.abstainThreshold]}
                                onValueChange={([v]) => setConfig({ abstainThreshold: v })}
                                min={0.3}
                                max={0.7}
                                step={0.1}
                                className="flex-1"
                            />
                            <span className="text-sm font-mono w-8">{config.abstainThreshold}</span>
                        </div>
                    </ConfigRow>

                    {/* Strict Citations */}
                    <ConfigRow
                        label="Strict Citations"
                        tooltip="Require the model to cite sources for every claim. Reduces hallucinations but may limit responses."
                        baselineValue={BASELINE_CONFIG.strictCitations ? 'On' : 'Off'}
                    >
                        <button
                            onClick={() => setConfig({ strictCitations: !config.strictCitations })}
                            className={`relative w-12 h-6 rounded-full transition-colors ${config.strictCitations ? 'bg-primary' : 'bg-muted'
                                }`}
                        >
                            <span
                                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config.strictCitations ? 'left-7' : 'left-1'
                                    }`}
                            />
                        </button>
                    </ConfigRow>
                </CardContent>
            </Card>

            {/* Estimate */}
            <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-4">
                    <span>📊 {questions.length} questions</span>
                    <span>📄 {documents.length} document{documents.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span>⏱️ ~{estimatedTime}s estimated</span>
                    <span>💰 ~$0.00 (Groq free tier)</span>
                </div>
            </div>

            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={() => setScreen('questions')}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
                <Button
                    onClick={handleEvaluate}
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                    <Play className="h-4 w-4" />
                    Run A/B Evaluation
                </Button>
            </div>
        </div>
    );
}
