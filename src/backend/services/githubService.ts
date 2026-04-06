import {prisma} from "../../database/prisma/client";

interface GithubIssue {
    number: number;
    title: string;
    body: string | null;
    html_url: string;
    created_at: string;
    updated_at: string;
    state: string;
    user: {login: string};
    labels: {name: string}[];
    pull_request?: object;
}

interface SyncOptions {
    owner: string;
    repo: string;
    guildId: string;
    token: string;
}

interface SyncResult {
    added: number;
    updated: number;
    skipped: number;
}

export async function syncGithubIssues(options: SyncOptions): Promise<SyncResult> {
    const { owner, repo, guildId, token } = options;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    let page = 1;
    let hasNextPage = true;

    const stats = { added: 0, updated: 0, skipped: 0 };

    while (hasNextPage) {
        const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100&page=${page}`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "AyudinBot",
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }

        const issues: GithubIssue[] = await response.json();

        if (issues.length === 0) {
            // hasNextPage = false;
            break;
        }

        for (const issue of issues) {
            // excluimos pull requests
            if(issue.pull_request) {
                stats.skipped++;
                continue;
            }

            // filtramos por fecha de creacion (ventana de 6 meses)
            if(new Date(issue.created_at) < sixMonthsAgo) {
                hasNextPage = false;
                break;
            }

            const externalSourceKey = `github:${owner}/${repo}#${issue.number}`;

            const extractedText = [
                issue.title,
                issue.body || "",
            ].filter(Boolean).join("\n\n");

            const metadataJson = JSON.stringify({
                issueNumber: issue.number,
                state: issue.state,
                labels: issue.labels.map(l=>l.name),
                author: issue.user.login,
                githubCreated_at: issue.created_at,
                githubUpdated_at: issue.updated_at,
                htmlUrl: issue.html_url,
            });

            try{
                const existing = await prisma.knowledgeSource.findFirst({
                    where: {
                        guildId,
                        externalSourceKey,
                    }
                });

                if(existing) {
                    await prisma.knowledgeSource.update({
                        where:{id: existing.id},
                        data: {
                            title: issue.title,
                            extractedText,
                            metadataJson,
                            isActive: true,
                            questionCategory: "TP",
                        },
                    });
                    stats.updated++;
                }else{
                    await prisma.knowledgeSource.create({
                        data:{
                            guildId,
                            title: issue.title,
                            sourceType: "GITHUB_ISSUES",
                            extractedText,
                            externalSourceKey,
                            metadataJson,
                            reliability: "MEDIUM",
                            priority: 100,
                            isActive: true,
                            questionCategory: "TP",
                        },
                    });
                    stats.added++;
                }
            }catch(err) {
                console.error(`Error sincronizando issue #${issue.number}: `, err);
                stats.skipped++;
            }
        }

        if(!hasNextPage) {
            break;
        }

        // verificamos si hay mas paginas
        const linkHeader = response.headers.get("Link");
        hasNextPage = linkHeader?.includes('rel="next"') ?? false;
        page++;

    }
    return stats;
}
