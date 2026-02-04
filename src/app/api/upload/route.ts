import { NextRequest, NextResponse } from 'next/server';
import { Document } from '@/lib/types';
import { extractText, getDocumentProxy } from 'unpdf';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
    try {
        const pdf = await getDocumentProxy(new Uint8Array(buffer));
        const { text } = await extractText(pdf, { mergePages: true });
        return text;
    } catch (error) {
        console.error('PDF extraction error:', error);
        throw new Error('Failed to extract text from PDF');
    }
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const files = formData.getAll('files') as File[];

        if (files.length === 0) {
            return NextResponse.json(
                { error: 'No files provided' },
                { status: 400 }
            );
        }

        if (files.length > 3) {
            return NextResponse.json(
                { error: 'Maximum 3 files allowed' },
                { status: 400 }
            );
        }

        const documents: Document[] = [];

        for (const file of files) {
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                return NextResponse.json(
                    { error: `File ${file.name} exceeds 5MB limit` },
                    { status: 400 }
                );
            }

            const arrayBuffer = await file.arrayBuffer();
            let text = '';

            if (file.name.toLowerCase().endsWith('.pdf')) {
                try {
                    text = await extractTextFromPDF(arrayBuffer);
                } catch (pdfError) {
                    console.error('PDF parsing error:', pdfError);
                    return NextResponse.json(
                        { error: `Failed to parse PDF: ${file.name}. Try uploading a TXT file instead.` },
                        { status: 400 }
                    );
                }
            } else if (
                file.name.toLowerCase().endsWith('.txt') ||
                file.name.toLowerCase().endsWith('.md')
            ) {
                const buffer = Buffer.from(arrayBuffer);
                text = buffer.toString('utf-8');
            } else {
                return NextResponse.json(
                    { error: `Unsupported file type: ${file.name}. Use PDF or TXT files.` },
                    { status: 400 }
                );
            }

            // Clean up text
            text = text
                .replace(/\r\n/g, '\n')
                .replace(/\n{3,}/g, '\n\n')
                .replace(/\s{3,}/g, ' ')
                .trim();

            if (text.length === 0) {
                return NextResponse.json(
                    { error: `File ${file.name} appears to be empty or could not extract text.` },
                    { status: 400 }
                );
            }

            documents.push({
                id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                text,
                size: file.size
            });
        }

        return NextResponse.json({
            documents,
            message: `Successfully parsed ${documents.length} document(s)`
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to process files' },
            { status: 500 }
        );
    }
}
