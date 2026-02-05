'use client';

import { ArrowLeft, RotateCcw, Download, ChevronDown, ChevronUp, Info, Play, Sliders, Eye, EyeOff, Lock } from 'lucide-react';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppStore } from '@/lib/store';
import { getFailureModeInfo } from '@/lib/evaluator';
import { compareMetrics } from '@/lib/metrics';
import { FailureMode, RAGConfig } from '@/lib/types';

function MetricBar({
    label,
    value,
    diff,
    better,
    suffix = '%',
    format = (v: number) => v.toFixed(0)
}: {
    label: string;
    value: number;
    diff: number;
    better: boolean;
    suffix?: string;
    format?: (v: number) => string;
}) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{label}</span>
                <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{format(value)}{suffix}</span>
                    {diff !== 0 && (
                        <span className={`text-xs ${better ? 'text-green-500' : 'text-red-500'}`}>
                            {diff > 0 ? '⬆' : '⬇'} {Math.abs(diff).toFixed(1)}{suffix.includes('%') ? 'pp' : suffix}
                        </span>
                    )}
                </div>
            </div>
            <Progress value={Math.min(value, 100)} className="h-2" />
        </div>
    );
}

function FailureCountCard({ mode, count, total }: { mode: FailureMode; count: number; total: number }) {
    const info = getFailureModeInfo(mode);
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
                <span>{info.icon}</span>
                <div>
                    <p className="text-sm font-medium">{info.label}</p>
                    <p className="text-xs text-muted-foreground">{info.description}</p>
                </div>
            </div>
            <span className="font-mono font-bold">{count}/{total}</span>
        </div>
    );
}

function ConfigKnob({
    label,
    description,
    children
}: {
    label: string;
    description: string;
    children: React.ReactNode
}) {
    return (
        <div className="space-y-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-2">
                <Label className="text-sm font-bold text-slate-200">{label}</Label>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-slate-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[200px]">
                            <p className="text-xs">{description}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            {children}
        </div>
    );
}

export function Screen3Dashboard() {
    const {
        documents,
        questions,
        config,
        setConfig,
        isEvaluating,
        evaluationResults,
        evaluationError,
        evaluationHint,
        setIsEvaluating,
        setEvaluationResults,
        setEvaluationError,
        setScreen,
        reset,
        groqApiKey,
        setGroqApiKey
    } = useAppStore();

    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
    const [showApiKey, setShowApiKey] = useState(false);

    const toggleQuestion = (index: number) => {
        const newExpanded = new Set(expandedQuestions);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedQuestions(newExpanded);
    };

    const handleRunEvaluation = useCallback(async () => {
        setIsEvaluating(true);
        setEvaluationError(null);

        try {
            const response = await fetch('/api/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documents, questions, config, apiKey: groqApiKey })
            });

            if (!response.ok) {
                const data = await response.json();
                setEvaluationError(data.error || 'Failed to run evaluation', data.hint);
                return;
            }

            const data = await response.json();
            setEvaluationResults(data);
        } catch (err: any) {
            setEvaluationError(err.message);
        } finally {
            setIsEvaluating(false);
        }
    }, [documents, questions, config, setIsEvaluating, setEvaluationResults, setEvaluationError]);

    const handleExport = () => {
        if (!evaluationResults) return;
        const blob = new Blob([JSON.stringify(evaluationResults, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rag-eval-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const comparison = evaluationResults ? compareMetrics(evaluationResults.metrics, evaluationResults.baselineMetrics) : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setScreen('questions')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                            RAG Dashboard
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Adjust parameters and analyze results
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={handleRunEvaluation}
                        disabled={isEvaluating}
                        className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {isEvaluating ? (
                            <RotateCcw className="h-4 w-4 animate-spin" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                        {evaluationResults ? 'Re-run Evaluation' : 'Run Evaluation'}
                    </Button>
                    {evaluationResults && (
                        <Button variant="outline" onClick={handleExport} className="gap-2">
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                    )}
                </div>
            </div>

            {/* Config Knobs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ConfigKnob
                    label="Chunk Size"
                    description="Number of words per chunk. Larger chunks = more context but higher cost."
                >
                    <RadioGroup
                        value={config.chunkSize.toString()}
                        onValueChange={(v) => setConfig({ chunkSize: parseInt(v) as any })}
                        className="flex gap-4"
                    >
                        {[300, 500, 800, 1200].map(size => (
                            <div key={size} className="flex items-center gap-1">
                                <RadioGroupItem value={size.toString()} id={`size-${size}`} />
                                <Label htmlFor={`size-${size}`} className="text-xs cursor-pointer">{size}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </ConfigKnob>

                <ConfigKnob
                    label="Chunk Overlap %"
                    description="Percentage of overlap between adjacent chunks to maintain context continuity."
                >
                    <div className="pt-2">
                        <Slider
                            value={[config.chunkOverlap]}
                            onValueChange={([v]) => setConfig({ chunkOverlap: v })}
                            max={40}
                            min={5}
                            step={5}
                            className="mb-1"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                            <span>5%</span>
                            <span className="text-primary font-bold">{config.chunkOverlap}%</span>
                            <span>40%</span>
                        </div>
                    </div>
                </ConfigKnob>

                <ConfigKnob
                    label="Search Type"
                    description="Semantic (AI meaning), Keyword (exact match), or Hybrid (best of both)."
                >
                    <RadioGroup
                        value={config.searchType}
                        onValueChange={(v) => setConfig({ searchType: v as any })}
                        className="flex gap-4"
                    >
                        {['semantic', 'keyword', 'hybrid'].map(type => (
                            <div key={type} className="flex items-center gap-1">
                                <RadioGroupItem value={type} id={`type-${type}`} />
                                <Label htmlFor={`type-${type}`} className="text-xs capitalize cursor-pointer">{type}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </ConfigKnob>

                <ConfigKnob
                    label="Top-K"
                    description="Number of chunks to retrieve for each question."
                >
                    <RadioGroup
                        value={config.topK.toString()}
                        onValueChange={(v) => setConfig({ topK: parseInt(v) as any })}
                        className="flex gap-4"
                    >
                        {[3, 5, 8].map(k => (
                            <div key={k} className="flex items-center gap-1">
                                <RadioGroupItem value={k.toString()} id={`k-${k}`} />
                                <Label htmlFor={`k-${k}`} className="text-xs cursor-pointer">{k}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </ConfigKnob>

                <ConfigKnob
                    label="Abstain Threshold"
                    description="Confidence level below which the agent refuses to answer to avoid hallucinations."
                >
                    <div className="pt-2">
                        <Slider
                            value={[config.abstainThreshold * 100]}
                            onValueChange={([v]) => setConfig({ abstainThreshold: v / 100 })}
                            max={90}
                            min={10}
                            step={5}
                            className="mb-1"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                            <span>Low</span>
                            <span className="text-primary font-bold">{(config.abstainThreshold * 100).toFixed(0)}%</span>
                            <span>Strict</span>
                        </div>
                    </div>
                </ConfigKnob>

                <ConfigKnob
                    label="Strict Citations"
                    description="If enabled, the agent must cite a specific chunk for every claim."
                >
                    <div className="flex items-center gap-4 pt-1">
                        <Button
                            variant={config.strictCitations ? "default" : "outline"}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setConfig({ strictCitations: true })}
                        >
                            Enabled
                        </Button>
                        <Button
                            variant={!config.strictCitations ? "default" : "outline"}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setConfig({ strictCitations: false })}
                        >
                            Disabled
                        </Button>
                    </div>
                </ConfigKnob>

                <div className="md:col-span-2 lg:col-span-3 p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                            <Lock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-200">API Key (Autodetect) <span className="text-slate-500 font-normal">(Optional)</span></p>
                            <p className="text-[11px] text-slate-500">Supports Groq, OpenAI, Anthropic, or Gemini keys.</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        <div className="relative min-w-[300px]">
                            <input
                                type={showApiKey ? "text" : "password"}
                                value={groqApiKey || ''}
                                onChange={(e) => setGroqApiKey(e.target.value || null)}
                                placeholder="sk-..., gsk_..., or AIza..."
                                className="w-full h-9 bg-slate-950 border border-slate-800 rounded-md px-3 pr-10 text-xs font-mono focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700"
                            />
                            <button
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {groqApiKey && (
                            <div className="flex items-center gap-2 px-1">
                                {groqApiKey.startsWith('gsk_') && <span className="text-[9px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20 font-bold uppercase tracking-wider">Detected: Groq</span>}
                                {groqApiKey.startsWith('sk-ant-') && <span className="text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 font-bold uppercase tracking-wider">Detected: Anthropic</span>}
                                {groqApiKey.startsWith('sk-') && !groqApiKey.startsWith('sk-ant-') && <span className="text-[9px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20 font-bold uppercase tracking-wider">Detected: OpenAI</span>}
                                {groqApiKey.startsWith('AIza') && <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold uppercase tracking-wider">Detected: Gemini</span>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Evaluation Content */}
            {isEvaluating ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 bg-slate-900/30 rounded-2xl border border-dashed border-slate-700">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-indigo-500/20 rounded-full" />
                        <div className="absolute inset-0 w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-lg font-medium text-slate-300">Running A/B Evaluation...</p>
                    <p className="text-sm text-slate-500">
                        Evaluating {questions.length} questions across baseline and current configs (max 5)
                    </p>
                </div>
            ) : evaluationError ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4 bg-red-900/10 rounded-2xl border border-red-900/20">
                    <div className="text-6xl">❌</div>
                    <p className="text-lg font-medium text-red-500">{evaluationError}</p>
                    {evaluationHint && (
                        <p className="text-sm text-slate-400 max-w-md text-center px-4 bg-red-900/20 p-3 rounded-lg border border-red-900/30">
                            <span className="font-bold text-red-400">Hint:</span> {evaluationHint}
                        </p>
                    )}
                    <Button onClick={handleRunEvaluation} variant="outline" className="mt-2 border-red-900/50 hover:bg-red-900/20">
                        Try Again
                    </Button>
                </div>
            ) : evaluationResults && comparison ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Left Column: Metrics & Recommendations */}
                    <div className="lg:col-span-12 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="bg-slate-900/50 border-slate-800">
                                <CardContent className="pt-6">
                                    <MetricBar
                                        label="Answer Quality"
                                        value={comparison.quality.value}
                                        diff={comparison.quality.diff}
                                        better={comparison.quality.better}
                                    />
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-900/50 border-slate-800">
                                <CardContent className="pt-6">
                                    <MetricBar
                                        label="Groundedness"
                                        value={comparison.groundedness.value}
                                        diff={comparison.groundedness.diff}
                                        better={comparison.groundedness.better}
                                    />
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-900/50 border-slate-800">
                                <CardContent className="pt-6">
                                    <MetricBar
                                        label="Avg Cost"
                                        value={comparison.avgCost.value * 1000}
                                        diff={comparison.avgCost.diff}
                                        better={comparison.avgCost.better}
                                        suffix=" mills"
                                        format={(v) => `$${(v / 1000).toFixed(4)}`}
                                    />
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-900/50 border-slate-800">
                                <CardContent className="pt-6">
                                    <MetricBar
                                        label="Avg Latency"
                                        value={comparison.avgLatency.value}
                                        diff={comparison.avgLatency.diff}
                                        better={comparison.avgLatency.better}
                                        suffix="s"
                                        format={(v) => v.toFixed(1)}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recommendations */}
                        {evaluationResults.recommendations.length > 0 && (
                            <Card className="border-indigo-500/30 bg-indigo-500/5 overflow-hidden">
                                <CardHeader className="bg-indigo-500/10">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        💡 Actionable Recommendations
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {evaluationResults.recommendations.map((rec, i) => (
                                            <div key={i} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                                                <p className="text-sm font-bold text-indigo-400">To fix {rec.problem}:</p>
                                                <ul className="space-y-1">
                                                    {rec.fixes.map((fix, j) => (
                                                        <li key={j} className="text-xs text-slate-300 flex items-start gap-2">
                                                            <span className="text-indigo-500 font-bold">→</span>
                                                            {fix}
                                                        </li>
                                                    ))}
                                                </ul>
                                                <p className="text-[10px] text-slate-500 italic mt-2 border-t border-slate-800 pt-2">
                                                    ⚖️ Tradeoff: {rec.tradeoff}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Breakdown & Results */}
                    <div className="lg:col-span-4 space-y-4">
                        <Card className="bg-slate-900/50 border-slate-800 h-full">
                            <CardHeader>
                                <CardTitle className="text-sm">Failure Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {(['perfect', 'retrieval_miss', 'context_dilution', 'hallucination', 'over_abstain'] as FailureMode[]).map(mode => (
                                    <FailureCountCard
                                        key={mode}
                                        mode={mode}
                                        count={evaluationResults.metrics.failureCounts[mode] || 0}
                                        total={evaluationResults.results.length}
                                    />
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-8 space-y-4">
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-sm">Detailed Queries</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {evaluationResults.results.map((result, index) => {
                                    const info = getFailureModeInfo(result.failureMode);
                                    const isExpanded = expandedQuestions.has(index);

                                    return (
                                        <Collapsible key={index} open={isExpanded} onOpenChange={() => toggleQuestion(index)}>
                                            <CollapsibleTrigger asChild>
                                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <span>{info.icon}</span>
                                                        <span className="text-xs font-medium truncate text-slate-200">{result.question}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 ml-2">
                                                        <Badge variant={result.failureMode === 'perfect' ? 'default' : 'secondary'} className="text-[10px] h-5">
                                                            {info.label}
                                                        </Badge>
                                                        {isExpanded ? (
                                                            <ChevronUp className="h-4 w-4 text-slate-500" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 text-slate-500" />
                                                        )}
                                                    </div>
                                                </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <div className="p-4 space-y-4 bg-slate-900/40 border-x border-b border-slate-800 rounded-b-lg -mt-1 mx-px">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Generated Answer</p>
                                                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                                                            {result.answer}
                                                        </p>
                                                    </div>

                                                    {result.retrievedChunks.length > 0 && (
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                                Top Evidence Chunks
                                                            </p>
                                                            <div className="space-y-2">
                                                                {result.retrievedChunks.map((chunk, ci) => (
                                                                    <div key={ci} className="text-[10px] p-2 rounded bg-slate-950/30 border border-slate-800/50">
                                                                        <div className="flex justify-between items-center mb-1">
                                                                            <span className="text-indigo-400 font-bold">[{ci + 1}] {chunk.docName}</span>
                                                                            <span className="text-slate-500 font-mono">Score: {(chunk.score ?? 0).toFixed(3)}</span>
                                                                        </div>
                                                                        <p className="text-slate-400 italic">"{chunk.text.slice(0, 180)}..."</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex gap-4 pt-2 border-t border-slate-800">
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] text-slate-500 uppercase">Confidence</span>
                                                            <span className="text-xs font-mono text-slate-300">{(result.confidence * 100).toFixed(0)}%</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] text-slate-500 uppercase">Latency</span>
                                                            <span className="text-xs font-mono text-slate-300">{result.latency.toFixed(2)}s</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 bg-slate-900/30 rounded-2xl border border-dashed border-slate-700">
                    <Sliders className="h-12 w-12 text-slate-700 mb-2" />
                    <p className="text-lg font-medium text-slate-400 text-center px-8">
                        Configure your parameters above and click <br />
                        <span className="text-indigo-400">"Run Evaluation"</span> to see how your RAG pipeline performs.
                    </p>
                    <Button
                        onClick={handleRunEvaluation}
                        size="lg"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white mt-4"
                    >
                        Start First Run
                    </Button>
                </div>
            )}

            {/* Global Actions */}
            <div className="flex justify-between items-center pt-8 border-t border-slate-800">
                <Button variant="outline" onClick={() => setScreen('questions')} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Questions
                </Button>
                <div className="flex gap-4 items-center">
                    <p className="text-xs text-slate-500">
                        Documents: <span className="text-slate-300 font-bold">{documents.length}</span> |
                        Questions: <span className="text-slate-300 font-bold">{questions.length}</span>
                    </p>
                    <Button onClick={reset} variant="ghost" className="text-slate-500 hover:text-red-400">
                        Reset Application
                    </Button>
                </div>
            </div>
        </div>
    );
}
