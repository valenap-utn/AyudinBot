import {SearchAdapter, SearchResponse} from "../../../types/search";
import {searchRelevantDocuments} from "../pdfService";

export const pdfSearchAdapter: SearchAdapter = {
    sourceType: 'pdf',

    async search({guildId, query}): Promise<SearchResponse> {
        // Llamamos al servicio especifico de pdfs
        const { results, totalMatches } = await searchRelevantDocuments(guildId, query);

        return { // Mapeo de resultados
            results: results.map((r)=>({
                sourceType: 'pdf' as const,
                sourceId: r.id,
                title: r.originalName,
                snippet: r.snippet,
                score: r.score ?? 0, // fallback por si viene undefined
            })),
            totalMatches,
        };
    },
};
