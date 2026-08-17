import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';

interface GithubRepository {
  readonly name: string;
  readonly description: string | null;
  readonly html_url: string;
  readonly language: string | null;
  readonly stargazers_count: number;
  readonly fork: boolean;
  readonly archived: boolean;
}

type LoadState = 'loading' | 'ready' | 'unavailable';
const API_URL = 'https://api.github.com/users/connor-patterson/repos?sort=pushed&per_page=12';
const CACHE_KEY = 'patteros.github-pulse.v1';
const CACHE_LIFETIME_MS = 10 * 60 * 1000;

@Component({
  selector: 'app-github-panel',
  templateUrl: './github-panel.component.html',
  styleUrl: './github-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GithubPanelComponent {
  private readonly destroyRef = inject(DestroyRef);
  private controller: AbortController | null = new AbortController();

  protected readonly state = signal<LoadState>('loading');
  protected readonly repositories = signal<readonly GithubRepository[]>([]);

  constructor() {
    this.destroyRef.onDestroy(() => this.controller?.abort());
    void this.load();
  }

  protected async retry(): Promise<void> {
    this.controller?.abort();
    this.controller = new AbortController();
    await this.load(true);
  }

  private async load(force = false): Promise<void> {
    this.state.set('loading');
    if (!force) {
      const cached = this.readCache();
      if (cached.length) {
        this.repositories.set(cached);
        this.state.set('ready');
        return;
      }
    }
    try {
      const response = await fetch(API_URL, {
        headers: { Accept: 'application/vnd.github+json' },
        signal: this.controller?.signal,
      });
      if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
      const payload = (await response.json()) as unknown;
      if (!Array.isArray(payload)) throw new Error('Unexpected GitHub response');

      const repositories = payload
        .filter((value): value is GithubRepository => this.isRepository(value))
        .filter(({ fork, archived }) => !fork && !archived)
        .slice(0, 6);
      this.repositories.set(repositories);
      this.storeCache(repositories);
      this.state.set(repositories.length ? 'ready' : 'unavailable');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      this.state.set('unavailable');
    }
  }

  private isRepository(value: unknown): value is GithubRepository {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Partial<GithubRepository>;
    return (
      typeof candidate.name === 'string' &&
      typeof candidate.html_url === 'string' &&
      candidate.html_url.startsWith('https://github.com/connor-patterson/') &&
      typeof candidate.stargazers_count === 'number' &&
      typeof candidate.fork === 'boolean' &&
      typeof candidate.archived === 'boolean'
    );
  }

  private readCache(): readonly GithubRepository[] {
    try {
      const value = globalThis.sessionStorage?.getItem(CACHE_KEY);
      if (!value) return [];
      const parsed = JSON.parse(value) as { timestamp?: unknown; repositories?: unknown };
      if (
        typeof parsed.timestamp !== 'number' ||
        Date.now() - parsed.timestamp > CACHE_LIFETIME_MS ||
        !Array.isArray(parsed.repositories)
      ) {
        return [];
      }
      return parsed.repositories.filter((repository): repository is GithubRepository =>
        this.isRepository(repository),
      );
    } catch {
      return [];
    }
  }

  private storeCache(repositories: readonly GithubRepository[]): void {
    try {
      globalThis.sessionStorage?.setItem(
        CACHE_KEY,
        JSON.stringify({ timestamp: Date.now(), repositories }),
      );
    } catch {
      // A private session can block storage. The live view still works without a cache.
    }
  }
}
