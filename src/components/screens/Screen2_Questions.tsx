'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAppStore } from '@/lib/store';
import { SAMPLE_QUESTIONS, SAMPLE_QUESTIONS_DESCRIPTION } from '@/lib/sample-questions';

export function Screen2Questions() {
    const {
        questions,
        useSampleQuestions,
        setQuestions,
        setUseSampleQuestions,
        setScreen
    } = useAppStore();

    const [customText, setCustomText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleQuestionModeChange = (value: string) => {
        const useSample = value === 'sample';
        setUseSampleQuestions(useSample);
        if (useSample) {
            setError(null);
        }
    };

    const handleCustomTextChange = (text: string) => {
        setCustomText(text);
        const parsed = text
            .split('\n')
            .map(q => q.trim())
            .filter(q => q.length > 0);
        setQuestions(parsed);

        if (parsed.length > 0 && parsed.length < 3) {
            setError('Please provide at least 3 questions');
        } else if (parsed.length > 5) {
            setError('Maximum 5 questions allowed (to avoid rate limits)');
        } else {
            setError(null);
        }
    };

    const canProceed = useSampleQuestions || (questions.length >= 3 && questions.length <= 5);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setScreen('upload')}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Choose Test Questions</h1>
                    <p className="text-muted-foreground text-sm">
                        Select sample questions or provide your own
                    </p>
                </div>
            </div>

            <RadioGroup
                value={useSampleQuestions ? 'sample' : 'custom'}
                onValueChange={handleQuestionModeChange}
                className="space-y-4"
            >
                {/* Sample Questions Option */}
                <Card className={`cursor-pointer transition-all ${useSampleQuestions ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                    }`}>
                    <label className="cursor-pointer">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <RadioGroupItem value="sample" id="sample" className="mt-1" />
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-primary" />
                                        <span className="font-medium">Quick Start: Use Sample Questions</span>
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                            Recommended
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {SAMPLE_QUESTIONS_DESCRIPTION}
                                    </p>
                                    <ul className="space-y-1">
                                        {SAMPLE_QUESTIONS.map((q, i) => (
                                            <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                                                <span className="text-primary">•</span>
                                                {q}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </label>
                </Card>

                {/* Custom Questions Option */}
                <Card className={`cursor-pointer transition-all ${!useSampleQuestions ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                    }`}>
                    <label className="cursor-pointer">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <RadioGroupItem value="custom" id="custom" className="mt-1" />
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                                        <span className="font-medium">Custom: Paste Your Questions</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        One question per line (3-5 questions)
                                    </p>

                                    {!useSampleQuestions && (
                                        <div className="space-y-2">
                                            <textarea
                                                value={customText}
                                                onChange={(e) => handleCustomTextChange(e.target.value)}
                                                placeholder="What are the main conclusions?&#10;How does the system work?&#10;What are the limitations?"
                                                className="w-full h-40 p-3 text-sm bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            {error && (
                                                <p className="text-sm text-destructive">{error}</p>
                                            )}
                                            {!error && questions.length > 0 && (
                                                <p className="text-sm text-muted-foreground">
                                                    {questions.length} question{questions.length !== 1 ? 's' : ''} detected
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </label>
                </Card>
            </RadioGroup>

            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={() => setScreen('upload')}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
                <Button
                    onClick={() => setScreen('dashboard')}
                    disabled={!canProceed}
                    size="lg"
                    className="gap-2"
                >
                    Next: Configure Pipeline
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
