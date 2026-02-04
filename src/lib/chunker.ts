import { Chunk, Document } from './types';

/**
 * Chunk a document into smaller pieces with overlap
 */
export function chunkDocument(
    doc: Document,
    chunkSize: number,
    overlap: number = 100
): Chunk[] {
    const chunks: Chunk[] = [];
    const text = doc.text;

    if (text.length === 0) {
        return [];
    }

    // If text is smaller than chunk size, return single chunk
    if (text.length <= chunkSize) {
        return [{
            id: `${doc.id}-0`,
            text: text.trim(),
            docId: doc.id,
            docName: doc.name,
            start: 0,
            end: text.length
        }];
    }

    let position = 0;
    let chunkIndex = 0;

    while (position < text.length) {
        // Find a good break point (prefer sentence or word boundary)
        let end = Math.min(position + chunkSize, text.length);

        if (end < text.length) {
            // Try to break at sentence boundary
            const sentenceBreak = text.lastIndexOf('.', end);
            if (sentenceBreak > position + chunkSize * 0.5) {
                end = sentenceBreak + 1;
            } else {
                // Try to break at word boundary
                const wordBreak = text.lastIndexOf(' ', end);
                if (wordBreak > position + chunkSize * 0.5) {
                    end = wordBreak;
                }
            }
        }

        const chunkText = text.slice(position, end).trim();

        if (chunkText.length > 0) {
            chunks.push({
                id: `${doc.id}-${chunkIndex}`,
                text: chunkText,
                docId: doc.id,
                docName: doc.name,
                start: position,
                end: end
            });
            chunkIndex++;
        }

        // Move position forward, accounting for overlap
        position = end - overlap;
        if (position >= text.length - overlap) {
            break;
        }
    }

    return chunks;
}

/**
 * Chunk multiple documents
 */
export function chunkDocuments(
    docs: Document[],
    chunkSize: number,
    overlap: number = 100
): Chunk[] {
    return docs.flatMap(doc => chunkDocument(doc, chunkSize, overlap));
}
