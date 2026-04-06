import { SearchAdapter, SearchQuery, SearchResponse } from "../../types/search";
import {pdfSearchAdapter} from "./adapters/pdfSearchAdapter";
import {githubIssuesSearchAdapter} from "./adapters/githubIssuesSearchAdapter";

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
            .sort((a, b) => b.score - a.score)
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
