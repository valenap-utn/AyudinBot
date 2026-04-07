import { SearchAdapter, SearchQuery, SearchResponse } from "../../types/search";
import {pdfSearchAdapter} from "./adapters/pdfSearchAdapter";
import {githubIssuesSearchAdapter} from "./adapters/githubIssuesSearchAdapter";
import type { SourceType, QuestionCategory } from "../../types/search";

const SOURCE_BOOST: Record<QuestionCategory, Record<SourceType, number>> = {
    TP: {github:2, pdf: 1},
    TEORIA: {pdf: 2, github: 1},
    ADMINISTRATIVA: {pdf: 2, github: 1},
};

function calculateBoost(sourceType: SourceType, questionCategory?: QuestionCategory): number {
    if(!questionCategory) return 0;
    return SOURCE_BOOST[questionCategory]?.[sourceType] ?? 0;
}

class SearchService {
    private adapters: SearchAdapter[] = []; // Lista de fuentes registradas

    constructor() {
        this.registerAdapter(pdfSearchAdapter); // se registra el adapter de pdfs por defecto
        this.registerAdapter(githubIssuesSearchAdapter);
    }

    // Permite agregar nuevas fuentes
    registerAdapter(adapter: SearchAdapter): void {
        const alreadyRegister = this.adapters.some((existing) =>
                existing.sourceType === adapter.sourceType
        );
        if (!alreadyRegister) {
            this.adapters.push(adapter);
        }
    }

    // Ejecuta la busqueda en todos los adapters
    async search(query: SearchQuery) : Promise<SearchResponse> {
        // ejecuta todas las busquedas en paralelo
        const responses = await Promise.all(
            this.adapters.map(adapter => adapter.search(query))
        );

        const results = responses
            .flatMap(result => result.results)
            .sort((a, b) => {
                const boostA = calculateBoost(a.sourceType, query.questionCategory);
                const boostB = calculateBoost(b.sourceType, query.questionCategory);
                const scoreA = a.score + boostA;
                const scoreB = b.score + boostB;
                return scoreB - scoreA;
            })
            .slice(0, 5);

        // une todos los resultados y los ordena por score
        const totalMatches = responses.reduce((sum,r) =>
            sum + r.totalMatches, 0
        );

        return { results, totalMatches };
    }
}

// instancia única del servicio
export const searchService = new SearchService();
