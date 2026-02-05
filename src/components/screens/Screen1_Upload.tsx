'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Loader2, ArrowRight, Key, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/lib/store';

export function Screen1Upload() {
    const { documents, setDocuments, setScreen, groqApiKey, setGroqApiKey } = useAppStore();
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showApiKey, setShowApiKey] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        // Validate file count
        if (documents.length + acceptedFiles.length > 3) {
            setError('Maximum 3 files allowed');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            acceptedFiles.forEach((file) => {
                formData.append('files', file);
            });

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            setDocuments([...documents, ...data.documents]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    }, [documents, setDocuments]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'text/plain': ['.txt'],
            'text/markdown': ['.md'],
        },
        maxSize: 5 * 1024 * 1024, // 5MB
        disabled: isUploading || documents.length >= 3,
    });

    const removeDocument = (docId: string) => {
        setDocuments(documents.filter(d => d.id !== docId));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    RAG Evaluation Playground
                </h1>
                <p className="text-muted-foreground">
                    Test and debug your RAG pipelines with failure mode diagnosis
                </p>
            </div>

            <Card className="border-dashed border-2 bg-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Upload Your Documents
                    </CardTitle>
                    <CardDescription>
                        PDF, TXT, or Markdown files (Max 3 files, 5MB each)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div
                        {...getRootProps()}
                        className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive
                                ? 'border-primary bg-primary/10'
                                : 'border-muted-foreground/25 hover:border-primary/50'
                            }
              ${documents.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}
            `}
                    >
                        <input {...getInputProps()} />
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="text-muted-foreground">Processing files...</p>
                            </div>
                        ) : isDragActive ? (
                            <div className="flex flex-col items-center gap-2">
                                <Upload className="h-10 w-10 text-primary" />
                                <p className="text-primary font-medium">Drop files here</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <Upload className="h-10 w-10 text-muted-foreground" />
                                <p className="text-muted-foreground">
                                    {documents.length >= 3
                                        ? 'Maximum files reached'
                                        : 'Drag & drop files here, or click to select'
                                    }
                                </p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    {documents.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                Uploaded ({documents.length}/3):
                            </p>
                            {documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <File className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="font-medium text-sm">{doc.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatFileSize(doc.size)} • {doc.text.length.toLocaleString()} chars
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeDocument(doc.id)}
                                        className="h-8 w-8"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-card/50 border-indigo-500/20">
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Key className="h-4 w-4 text-indigo-400" />
                        API Key (Groq, OpenAI, Anthropic, Gemini) <span className="text-muted-foreground font-normal">(Optional)</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="relative">
                            <Input
                                type={showApiKey ? "text" : "password"}
                                placeholder="sk-..., gsk_..., sk-ant-..., or AIza..."
                                value={groqApiKey || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGroqApiKey(e.target.value)}
                                className="bg-transparent border-indigo-500/20 focus:border-indigo-500/50 pr-10"
                            />
                            <button
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {groqApiKey && (
                            <div className="flex items-center gap-2 animate-in fade-in duration-300">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Detected:</span>
                                {groqApiKey.startsWith('gsk_') && <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded border border-orange-500/20 font-bold">Groq</span>}
                                {groqApiKey.startsWith('sk-ant-') && <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-bold">Anthropic</span>}
                                {groqApiKey.startsWith('sk-') && !groqApiKey.startsWith('sk-ant-') && <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20 font-bold">OpenAI</span>}
                                {groqApiKey.startsWith('AIza') && <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold">Gemini</span>}
                            </div>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                            Providing your own key avoids shared rate limits. Your key is only used for this session and never stored.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button
                    onClick={() => setScreen('questions')}
                    disabled={documents.length === 0}
                    size="lg"
                    className="gap-2"
                >
                    Next: Add Test Questions
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
