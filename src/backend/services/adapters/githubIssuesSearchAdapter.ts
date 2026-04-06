import {SearchAdapter, SearchResponse, SearchResult} from "../../../types/search";
import {prisma} from "../../../database/prisma/client";

// TODO: refactor para funciones ( revisar pdfService.ts )

const STOP_WORDS = [
    "que", "de", "la", "el", "los", "las", "y", "o", "un", "una",
    "para", "en", "es", "son", "del", "al", "por", "con", "hay"
];

function normalizeText(text: string): string {
    return text.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}
function processQuery(query: string): string[] {
    const normalized = normalizeText(query);
    if (!normalized) return [];
    return [...new Set(
        normalized.split(" ")
            .filter(w => w.length > 0 && !STOP_WORDS.includes(w))
    )];
}
function calculateScore(content: string, queryWords: string[]): number {
    const normalizedContent = normalizeText(content);
    if (!normalizedContent) return 0;
    const contentWords = new Set(normalizedContent.split(" "));
    return queryWords.filter(w => contentWords.has(w)).length;
}
function generateSnippet(content: string, queryWords: string[]): string {
    if (!content?.trim()) return "...";
    const normalized = normalizeText(content);
    const radius = 80;

    for (const word of queryWords) {
        const index = normalized.indexOf(word);
        if (index !== -1) {
            const start = Math.max(0, index - radius);
            const end = Math.min(content.length, index + radius);
            const prefix = start > 0 ? "..." : "";
            const suffix = end < content.length ? "..." : "";
            return prefix + content.slice(start, end).trim() + suffix;
        }
    }
    return content.slice(0, 120) + (content.length > 120 ? "..." : "");
}
export const githubIssuesSearchAdapter: SearchAdapter = {
    sourceType: 'github',
    async search({ guildId, query }): Promise<SearchResponse> {
        const queryWords = processQuery(query);
        if (queryWords.length === 0) {
            return { results: [], totalMatches: 0 };
        }
        const documents = await prisma.knowledgeSource.findMany({
            where: {
                guildId,
                sourceType: 'GITHUB_ISSUES',
                isActive: true,
                extractedText: { not: null },
            },
            select: {
                id: true,
                title: true,
                extractedText: true,
                metadataJson: true,
                createdAt: true,
            },
        });
        // 1. Filtrar por score > 0
        const scored = documents
            .map(doc => {
                const content = doc.extractedText ?? "";
                const score = calculateScore(content, queryWords);
                return { doc, score };
            })
            .filter(item => item.score > 0);
        // 2. Guardar totalMatches ANTES del slice
        const totalMatches = scored.length;
        // 3. Luego ordenar y limitar
        const topResults = scored
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
        const results: SearchResult[] = topResults.map(({ doc, score }) => {
            let metadata: Record<string, unknown> = {};
            if (doc.metadataJson) {
                try { metadata = JSON.parse(doc.metadataJson); } catch {}
            }

            return {
                sourceType: 'github' as const,
                sourceId: doc.id,
                title: doc.title,
                snippet: generateSnippet(doc.extractedText ?? "", queryWords),
                score,
                url: (metadata as any)?.htmlUrl,
                metadata,
            };
        });
        return { results, totalMatches };
    },
};

