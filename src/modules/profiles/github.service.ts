import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface GithubRepo {
  name: string;
  description: string | null;
  url: string;
  stars: number;
  language: string | null;
  updatedAt: string;
}

@Injectable()
export class GitHubService {
  private readonly log = new Logger(GitHubService.name);
  private readonly token: string | null;

  constructor(private readonly config: ConfigService) {
    this.token = this.config.get<string>('GITHUB_TOKEN')?.trim() || null;
  }

  /** Возвращает до 6 публичных репозиториев пользователя, отсортированных по звёздам. */
  async getTopRepos(username: string): Promise<GithubRepo[]> {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      };
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
      const { data } = await axios.get<any[]>(
        `https://api.github.com/users/${encodeURIComponent(username)}/repos`,
        {
          params: { per_page: 100, sort: 'updated', type: 'owner' },
          headers,
          timeout: 8000,
        },
      );
      return data
        .filter((r) => !r.fork && !r.archived)
        .sort((a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0))
        .slice(0, 6)
        .map((r) => ({
          name: r.name as string,
          description: r.description as string | null,
          url: r.html_url as string,
          stars: (r.stargazers_count as number) ?? 0,
          language: r.language as string | null,
          updatedAt: r.updated_at as string,
        }));
    } catch (e) {
      this.log.warn(
        `GitHub fetch failed for ${username}: ${e instanceof Error ? e.message : String(e)}`,
      );
      return [];
    }
  }
}
