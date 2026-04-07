// Tipos de fuente soportadas en la busqueda
export type SourceType = 'pdf' | 'github';
export type QuestionCategory = 'TP' | 'ADMINISTRATIVA' | 'TEORIA'

export interface SearchResult {
    sourceType: SourceType;
    sourceId: string;
    title: string;
    snippet: string;
    score: number;
    url?: string;
    metadata?: Record<string, unknown>;
}

// Query que recibe cualquier adapter
export interface SearchQuery {
    guildId: string;
    query: string; // texto de busqueda del usuario
    questionCategory?: QuestionCategory;
}

// Rta. estandar de busqueda
export interface SearchResponse{
    results: SearchResult[];
    totalMatches: number;
}

export interface SearchAdapter {
    readonly sourceType: SourceType;
    search(query: SearchQuery): Promise<SearchResponse>;
}
