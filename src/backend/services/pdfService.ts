import { prisma } from "../../database/prisma/client";
import * as fs from "node:fs";
import path from "node:path";

// Almacena y recupera los metadatos del PDF

export interface DocumentMetadata {
    guildId: string;
    originalName: string;
    storedName: string;
    path: string;
    uploadedAt?: Date;
    uploadedByUserId: string;
}

export const saveDocument = async (data: DocumentMetadata): Promise<DocumentMetadata & { id: string}> => {
    const source = await prisma.knowledgeSource.create({
        data:{
            guildId: data.guildId,
            title: data.originalName,
            storageKey: data.storedName,
            filePath: data.path,
            sourceType: "PDF",
            reliability: "MEDIUM",
            priority: 100,
            isActive: true,
            uploadedByUserId: data.uploadedByUserId,
        },
    });

    return {
        id: source.id,
        guildId: source.guildId,
        originalName: source.title,
        storedName: source.storageKey || "",
        path: source.filePath || "",
        uploadedAt: source.createdAt,
        uploadedByUserId: source.uploadedByUserId || "",
    };
};

export const getDocumentsByGuild = async (guildId: string) => {
    return prisma.knowledgeSource.findMany({
        where: {
            guildId,
            sourceType: "PDF",
            isActive: true,
        },
    });
};

// Obtiene los últimos 10 documentos ordenados por uploadedAt DESC
export const getRecentDocumentsByGuild = async (guildId: string, limit: number): Promise<DocumentMetadata[]> => {
    const sources = await prisma.knowledgeSource.findMany({
        where: {
            guildId,
            sourceType: "PDF",
            isActive: true,
        },
        orderBy:{ createdAt: "desc" },
        take: limit,
    });

    return sources.map((source) => ({
        guildId: source.guildId,
        originalName: source.title,
        storedName: source.storageKey || "",
        path: source.filePath || "",
        uploadedAt: source.createdAt,
        uploadedByUserId: source.uploadedByUserId || "",
    }));
};

// Eliminar un documento específico por guildId y originalName
export const deleteDocumentByName = async (
    guildId: string,
    originalName: string
): Promise<"not_found" | "duplicated" | "deleted"> => {

    const documents = await prisma.knowledgeSource.findMany({
        where: {
            guildId,
            title: originalName,
            sourceType: "PDF",
            isActive: true,
        },
    });

    if (documents.length === 0) {
        return "not_found"; // No se encontró el documento
    }

    if (documents.length > 1) {
        return "duplicated"; // Existen múltiples documentos con el mismo nombre
    }

    const document = documents[0];

    // Eliminar archivo físico
    // @ts-ignore
    const filePath = path.join(__dirname, "../../../storage/pdfs", document.storageKey || "");
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (err) {
            // @ts-ignore
            console.error(`Error al eliminar archivo físico: ${document.storageKey}`, err);
        }
    }

    // Eliminar registro en la base de datos
    // @ts-ignore
    await prisma.knowledgeSource.delete({ where: { id: document.id } });

    return "deleted"; // Eliminación exitosa
};

// Actualiza el contenido de un Documento en la base de datos
export const updateDocumentContent = async (documentId: string, content: string) => {
    try {
        return await prisma.knowledgeSource.update({
            where: { id: documentId },
            data: { extractedText: content },
        });
    } catch (error) {
        console.error(`Error al actualizar contenido del documento con ID ${documentId}`, error);
        throw error;
    }
};

// Busca documentos por contenido textual en base al guildId
export const searchDocumentsByContent = async (guildId: string, searchTerm: string) => {
    return prisma.knowledgeSource.findMany({
        where: {
            guildId,
            sourceType: "PDF",
            isActive: true,
            extractedText: {
                contains: searchTerm,
            },
        },
        select: {
            title: true,
        },
        take: 10,
        orderBy: {
            createdAt: "desc",
        },
    });
};

// ------------------------- FUNCIONES PARA BUSQUEDA ------------------------- //

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

// Escapa caracteres especiales para usar en RegExp
// Ej: C++ => C\+\+
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


//
function findBestSnippetStart(content: string, queryWords: string[], windowSize = 120): number {
    const normalizedContent = removeAccents(content.toLowerCase());

    const candidateIndexes: number[] = [];

    for (const word of queryWords) {
        const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, "gi");
        let match: RegExpExecArray | null;

        while((match = regex.exec(normalizedContent)) !== null) {
            candidateIndexes.push(match.index);
        }
    }

    if(candidateIndexes.length === 0) return -1;

    let bestIndex = candidateIndexes[0] ?? -1;
    let bestScore = -1;

    for(const index of candidateIndexes) {
        const start = Math.max(0, index - Math.floor(windowSize / 2));
        const end = Math.min(normalizedContent.length, start + windowSize);
        const windowText = normalizedContent.slice(start, end);

        let score = 0;

        for(const word of queryWords) {
            const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, "i");
            if(regex.test(windowText)) {
                score += 1;
            }
        }

        if(score > bestScore) {
            bestScore = score;
            bestIndex = index;
        }
    }
    return bestIndex;
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
function generateHighlightedSnippet(content: string, queryWords: string[]): string{
    if(!content?.trim()) return "...";

    // Intentamos obtener la oración mas relevante
    const bestSentence = findBestSentence(content, queryWords);
    if(bestSentence) return highlightSnippet(bestSentence, queryWords);

    // Fallback => snippet por ventana
    const bestMatchIndex = findBestSnippetStart(content, queryWords);
    const snippetRadius = 60;

    if(bestMatchIndex === -1) {
        const fallback = content.slice(0,80).trim();
        return fallback.length < content.length ? `${fallback}...` : fallback;
    }

    const start = Math.max(0, bestMatchIndex - snippetRadius);
    const end = Math.min(content.length, bestMatchIndex + snippetRadius);

    const rawSnippet = content.slice(start, end).trim();

    const prefix = start > 0 ? "..." : "";
    const suffix = end < content.length ? "..." : "";

    return `${prefix}${highlightSnippet(rawSnippet,queryWords)}${suffix}`;
}


// Funcion de busqueda (genera snippet)
export async function searchRelevantDocuments(guildId: string, query: string) {
    const queryWords = processQuery(query);

    if(queryWords.length === 0) return {
        results: [],
        totalMatches: 0,
    };

    const documents = await prisma.knowledgeSource.findMany({
        where: {
            guildId,
            sourceType: "PDF",
            isActive: true,
            extractedText: {
                not: null,
            },
        },
        select: {
            title: true,
            extractedText: true,
            createdAt: true,
        },
    });

    const scoredDocuments = documents.map((doc)=>{
        const content = doc.extractedText ?? "";
        const score = calculateScore(content, queryWords);

        return {
            originalName: doc.title,
            uploadedAt: doc.createdAt,
            score,
            snippet: generateHighlightedSnippet(content, queryWords),
        };
    })
        .filter((doc)=> doc.score > 0)
        .sort((a,b) => {
            if(b.score !== a.score){
                return b.score - a.score;
            }
            return b.uploadedAt.getTime() - a.uploadedAt.getTime();
        });
        // .slice(0,3);

    const totalMatches = scoredDocuments.length;
    const top3 = scoredDocuments.slice(0,3);

    return {
        results: top3.map((doc)=> ({
            originalName: doc.originalName,
            snippet: doc.snippet,
        })),
        totalMatches,
    }
}
