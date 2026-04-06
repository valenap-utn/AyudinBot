import {SearchAdapter, SearchResponse, SearchResult} from "../../../types/search";
import {prisma} from "../../../database/prisma/client";

// Lista de palabras irrelevantes
const STOP_WORDS = [
    "que", "de", "la", "el", "los", "las", "y", "o", "un", "una",
    "para", "en", "es", "son", "del", "al", "por", "con", "hay"
];

// Elimina acentos de un texto
function removeAccents(text: string): string {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Normaliza texto para busqueda
function normalizeText(text: string): string {
    return removeAccents(text.toLowerCase())
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim()
}

function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Procesa la query de busqueda en palabras utiles
function processQuery(query: string): string[] {
    const normalized = normalizeText(query);

    if(!normalized) return [];

    return [
        ...new Set(
            normalized
                .split(" ")
                .filter((word)=> word.length > 0 && !STOP_WORDS.includes(word))
        )
    ];
}

// Calcula un score de relevancia de un doc basado en la coincidencia de palabras clave
function calculateScore(content: string, queryWords: string[]): number {
    const normalizedContent = normalizeText(content);
    if(!normalizedContent) return 0;

    // Para evitar duplicados usamos Set =>
    const contentWords = new Set(normalizedContent.split(" "));

    let score = 0;

    for(const word of queryWords) {
        if(contentWords.has(word)) {
            score += 1;
        }
    }

    return score;
}

// Devuelve la oración que mejor matchee
function findBestSentence(content: string, queryWords: string[]): string | null {
    const sentences = content.replace(/\n/g, " ")
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 20);

    if(sentences.length === 0) return null;

    let bestSentence: string | null = null;
    let bestScore = 0;

    for(const sentence of sentences) {
        const score = calculateScore(sentence, queryWords);

        if(score > bestScore) {
            bestScore = score;
            bestSentence = sentence;
        }
    }

    return bestScore > 0 ? bestSentence : null;
}

// Pone en **negrita**
function highlightSnippet(snippet: string, queryWords: string[]): string {
    let highlighted = snippet;
    for (const word of queryWords) {
        const regex = new RegExp(`\\b(${escapeRegExp(word)})\\b`, "gi");
        highlighted = highlighted.replace(regex, "**$1**");
    }
    return highlighted;
}

// Pone en **negrita**  a la primera coincidencia
function generateHighlightedSnippet(content: string, queryWords: string[]): string {
    if (!content?.trim()) return "...";

    // Intentamos obtener la oración mas relevante
    const bestSentence = findBestSentence(content, queryWords);
    if (bestSentence) return highlightSnippet(bestSentence, queryWords);

    const fallback = content.slice(0,80).trim();

    return fallback.length < content.length ? `${fallback}...` : fallback;
}

export const pdfSearchAdapter: SearchAdapter = {
    sourceType: 'pdf',

    // Funcion de busqueda (genera snippet)
    async search({guildId, query, questionCategory}): Promise<SearchResponse> {
        const queryWords = processQuery(query);
        if(queryWords.length === 0) return { results: [], totalMatches: 0 };

        const where: any = {
            guildId,
            sourceType: 'PDF',
            isActive: true,
            extractedText: { not: null},
        };

        if(questionCategory) {
            where.questionCategory = questionCategory;
        }

        const documents = await prisma.knowledgeSource.findMany({
            where,
            select: {
                id: true,
                title: true,
                extractedText: true,
                createdAt: true,
            },
        });

        const scored = documents
            .map(doc => {
                const content = doc.extractedText ?? "";
                const score = calculateScore(content, queryWords);
                return { doc, score };
            })
            .filter(item => item.score > 0);

        const totalMatches = scored.length;

        const topResults = scored
            .sort((a, b) => {
                if(b.score !== a.score) return b.score - a.score;
                return b.doc.createdAt.getTime() - a.doc.createdAt.getTime();
            })
            .slice(0, 5);

        const results: SearchResult[] = topResults.map(({doc,score}) => ({
            sourceType: 'pdf' as const,
            sourceId: doc.id,
            title: doc.title,
            snippet: generateHighlightedSnippet(doc.extractedText ?? "", queryWords),
            score,
        }));

        return { results, totalMatches };
    },
};
