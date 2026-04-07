import {QuestionCategory, SearchResult, SourceType} from "../types/search";

const MAX_MESSAGE_LENGTH = 2000;
const SNIPPET_MAX_LENGTH = 150;

const SOURCE_BADGES: Record<SourceType, string> = {
    pdf: "📄PDF",
    github: "🧵Foro",
};

function truncate(text:string, max: number) {
    if(text.length <= max) return text;
    return text.slice(0, max - 3).trimEnd() + "...";
}

function formatSourceBadge(sourceType: SourceType): string {
    return SOURCE_BADGES[sourceType] || "📄Fuente";
}

function formatGithubMetadata(result: SearchResult): string {
    const meta = result.metadata as Record<string, unknown>;
    if(!meta) return "";

    const issueNumber = meta.issueNumber as number | undefined;
    const labels = meta.labels as string[] | undefined;
    const htmlUrl = meta.htmlUrl as string | undefined;

    if(!issueNumber) return "";

    const parts: string[] = [];

    if(issueNumber) parts.push(`#${issueNumber}`);

    if(labels && labels.length > 0){
        const labelStr = labels
            .slice(0,3)
            .map(l => `\`${l}\``)
            .join(" ");
        parts.push(labelStr);
    }

    if(htmlUrl){
        parts.push(`[🔗Ver](${htmlUrl})`);
    }

    return parts.length > 0 ? "\n" + parts.join(" ") : "";
}

export function formatSearchResult(result: SearchResult, index: number, questionCategory?: QuestionCategory): string {
    const badge = formatSourceBadge(result.sourceType);
    const snippet = truncate(result.snippet, SNIPPET_MAX_LENGTH);
    const githubMeta = result.sourceType === 'github'
        ? formatGithubMetadata(result)
        : "";

    return `${index + 1}. ${badge}\n**${result.title}**${githubMeta}\n> ${snippet}`;
}

export function buildPreguntarResponse(results: SearchResult[], totalMatches: number, query: string, questionCategory?: QuestionCategory): string{
    const limit = 3;
    const displayResults = results.slice(0,limit);

    const header = `📚 Resultados para "${truncate(query, 30)}"\n\n`;
    const body = displayResults
        .map((r,i) => formatSearchResult(r,i))
        .join("\n\n");
    const footer = results.length > 0 && totalMatches > limit
        ? `\n\n_Mostrando ${displayResults.length} de ${totalMatches} resultados_`
        : "";

    let response = header + body + footer;

    // Proteccion contra limite de Discord
    if(response.length > MAX_MESSAGE_LENGTH){
        const maxBodyLength = MAX_MESSAGE_LENGTH - header.length - footer.length - 10;
        response = header + truncate(body, maxBodyLength) + footer;
    }

    return response;
}
