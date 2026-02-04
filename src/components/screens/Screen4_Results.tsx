'use client';

import { ArrowLeft, RotateCcw, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAppStore } from '@/lib/store';
import { getFailureModeInfo } from '@/lib/evaluator';
import { compareMetrics } from '@/lib/metrics';
import { FailureMode } from '@/lib/types';

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

export function Screen4Results() {
    const {
        evaluationResults,
        evaluationError,
        isEvaluating,
        questions,
        setScreen,
        reset
    } = useAppStore();

    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

    const toggleQuestion = (index: number) => {
        const newExpanded = new Set(expandedQuestions);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedQuestions(newExpanded);
    };

    // Loading state
    if (isEvaluating) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-primary/20 rounded-full" />
                    <div className="absolute inset-0 w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-lg font-medium">Running A/B Evaluation...</p>
                <p className="text-sm text-muted-foreground">
                    Evaluating {questions.length} questions with both configurations
                </p>
            </div>
        );
    }

    // Error state
    if (evaluationError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="text-6xl">❌</div>
                <p className="text-lg font-medium text-destructive">Evaluation Failed</p>
                <p className="text-sm text-muted-foreground">{evaluationError}</p>
                <Button onClick={() => setScreen('configure')} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Configure
                </Button>
            </div>
        );
    }

    // No results
    if (!evaluationResults) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <p className="text-lg font-medium">No results yet</p>
                <Button onClick={() => setScreen('configure')}>
                    Run Evaluation
                </Button>
            </div>
        );
    }

    const { results, metrics, baselineMetrics, recommendations } = evaluationResults;
    const comparison = compareMetrics(metrics, baselineMetrics);

    const handleExport = () => {
        const blob = new Blob([JSON.stringify(evaluationResults, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rag-eval-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setScreen('configure')}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Evaluation Results</h1>
                        <p className="text-muted-foreground text-sm">
                            Comparing your config vs baseline
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setScreen('configure')} className="gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Run Again
                    </Button>
                    <Button variant="outline" onClick={handleExport} className="gap-2">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Primary Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle>Primary Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <MetricBar
                        label="Answer Quality"
                        value={comparison.quality.value}
                        diff={comparison.quality.diff}
                        better={comparison.quality.better}
                    />
                    <MetricBar
                        label="Groundedness"
                        value={comparison.groundedness.value}
                        diff={comparison.groundedness.diff}
                        better={comparison.groundedness.better}
                    />
                    <MetricBar
                        label="Avg Cost/Query"
                        value={comparison.avgCost.value * 1000}
                        diff={comparison.avgCost.diff}
                        better={comparison.avgCost.better}
                        suffix=" mills"
                        format={(v) => `$${(v / 1000).toFixed(4)}`}
                    />
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

            {/* Failure Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Failure Breakdown ({results.length} Questions)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {(['perfect', 'retrieval_miss', 'context_dilution', 'hallucination', 'over_abstain'] as FailureMode[]).map(mode => (
                        <FailureCountCard
                            key={mode}
                            mode={mode}
                            count={metrics.failureCounts[mode] || 0}
                            total={results.length}
                        />
                    ))}
                </CardContent>
            </Card>

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <Card className="border-primary/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            💡 Recommendations
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {recommendations.map((rec, i) => (
                            <div key={i} className="p-4 rounded-lg bg-muted/50 space-y-2">
                                <p className="font-medium">To fix {rec.problem}:</p>
                                <ul className="space-y-1">
                                    {rec.fixes.map((fix, j) => (
                                        <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                                            <span className="text-primary">→</span>
                                            {fix}
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-xs text-muted-foreground italic">
                                    ⚖️ Tradeoff: {rec.tradeoff}
                                </p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Detailed Results */}
            <Card>
                <CardHeader>
                    <CardTitle>Detailed Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {results.map((result, index) => {
                        const info = getFailureModeInfo(result.failureMode);
                        const isExpanded = expandedQuestions.has(index);

                        return (
                            <Collapsible key={index} open={isExpanded} onOpenChange={() => toggleQuestion(index)}>
                                <CollapsibleTrigger asChild>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <span>{info.icon}</span>
                                            <span className="text-sm font-medium truncate">{result.question}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={result.failureMode === 'perfect' ? 'default' : 'secondary'}>
                                                {info.label}
                                            </Badge>
                                            {isExpanded ? (
                                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="p-4 space-y-3 bg-muted/25 rounded-b-lg -mt-1">
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase mb-1">Answer</p>
                                            <p className="text-sm">{result.answer}</p>
                                        </div>
                                        {result.retrievedChunks.length > 0 && (
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase mb-1">
                                                    Evidence ({result.retrievedChunks.length} chunks)
                                                </p>
                                                {result.retrievedChunks.map((chunk, ci) => (
                                                    <div key={ci} className="text-xs bg-background/50 p-2 rounded mt-1">
                                                        <span className="text-primary font-medium">[{ci + 1}] {chunk.docName}:</span>{' '}
                                                        <span className="text-muted-foreground">
                                                            {chunk.text.slice(0, 150)}...
                                                        </span>
                                                        <span className="text-muted-foreground ml-2">(score: {(chunk.score ?? 0).toFixed(2)})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex gap-4 text-xs text-muted-foreground">
                                            <span>Confidence: {(result.confidence * 100).toFixed(0)}%</span>
                                            <span>Latency: {result.latency.toFixed(2)}s</span>
                                        </div>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between">
                <Button variant="outline" onClick={() => setScreen('configure')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Try Different Config
                </Button>
                <Button onClick={reset} variant="ghost">
                    Start Over
                </Button>
            </div>
        </div>
    );
}
