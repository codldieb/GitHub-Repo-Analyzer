import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

// types.ts
export interface Repository {
  id: number;
  name: string;
  stars: number;
  forks: number;
  language: string | null;
}

export interface LanguageStat {
  language: string;
  count: number;
  totalStars: number;
  averageStars: number;
}

export interface ReturnedRepo {
    id: number;
    name: string;
    stargazers_count: number;
    forks: number;
    language: string | null;
}

export class RateLimitError extends Error {
    public status: number;
    
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = "RateLimitError";
        Object.setPrototypeOf(this, RateLimitError.prototype);
    }
}

// analyzer.ts

/**
 * Task 1: Fetch and filter repositories from GitHub API
 */
export async function getPopularRepositories(orgName: string, minStars: number): Promise<Repository[]> {
  // TODO: Implement API call and filtering
    const url = "https://api.github.com/orgs/" + orgName + "/repos?type=public&per_page=100";
    const response = await fetch(url);
    let link = response.headers.get("link");
    
    if (response.status === 404) {
        throw new Error("Organization could not be found");
    } else if (response.status === 403 || response.status === 429) {
        throw new RateLimitError("Rate limit has been hit", response.status);
    } else if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
    }
    const data: unknown = await response.json();
    
    if (!Array.isArray(data)) {
        throw new Error("GitHub returned an unexpected repository list.");
    }
    let repos = data as ReturnedRepo[];

    let pageIncrementer = 2;
    while (link?.includes('rel="next"')) {
        const urlLoop = "https://api.github.com/orgs/" + orgName + "/repos?type=public&per_page=100&page=" + pageIncrementer;
        const responseLoop = await fetch(urlLoop);
        link = responseLoop.headers.get("link");
        pageIncrementer++;
        if (responseLoop.status === 404) {
            throw new Error("Organization could not be found");
        } else if (responseLoop.status === 403 || responseLoop.status === 429) {
            throw new RateLimitError("Rate limit has been hit", responseLoop.status);
        } else if (!responseLoop.ok) {
            throw new Error(`HTTP error! Status: ${responseLoop.status}`)
        }
        const dataLoop: unknown = await responseLoop.json();
    
        if (!Array.isArray(dataLoop)) {
            throw new Error("GitHub returned an unexpected repository list.");
        }
        const reposLoop = dataLoop as ReturnedRepo[];
        repos.push(...reposLoop);
    }

    const filteredRepos = repos.filter(repo => repo.stargazers_count >= minStars);

    const finalRepos = filteredRepos.map(repo => ({
          id: repo.id,
          name: repo.name,
          stars: repo.stargazers_count,
          forks: repo.forks,
          language: repo.language

    }))
    return finalRepos;

    
}

/**
 * Task 2: Aggregate metrics by language
 */
export function getLanguageStats(repositories: Repository[]): Record<string, LanguageStat> {
  // TODO: Implement data aggregation
  let languages: Record<string, LanguageStat> = {};
  repositories.forEach(repo => {
    if (repo.language && Object.hasOwn(languages, repo.language)) {
        const currentLanguage = repo.language;
        languages[currentLanguage].count = languages[currentLanguage].count + 1;
        languages[currentLanguage].totalStars = languages[currentLanguage].totalStars + repo.stars;
        languages[currentLanguage].averageStars = languages[currentLanguage].totalStars / languages[currentLanguage].count;
    } else if (repo.language) {
        const repositLanguage = repo.language;
        let languageObject = {
            language: repo.language,
            count: 1,
            totalStars: repo.stars,
            averageStars: repo.stars,
        }
        languages[repositLanguage] = languageObject;
    }
  })
  return languages;
}

async function main() {
    const rl = createInterface({input, output});
    const orgName = await rl.question("What is the name of the org you wish to see? ");
    const minStars = Number(await rl.question("What is the minimum number of stars you wish to see? "));
    rl.close();

    try {
        const popularRepos = await getPopularRepositories(orgName, minStars);
        console.log(popularRepos);
        console.log("---------------------------------------------------------------")
        const languageStats = getLanguageStats(popularRepos);
        console.log(JSON.stringify(languageStats, null, 2));
    } catch (error) {
        if (error instanceof RateLimitError) {
            console.error(`Status ${error.status}: ${error.message}`);
        } else if (error instanceof Error) {
            console.error(`Standard Error: ${error.message}`);
        } else {
            console.error("An unexpected, non-Error exception occurred.")
        }
    }
    
}
main();