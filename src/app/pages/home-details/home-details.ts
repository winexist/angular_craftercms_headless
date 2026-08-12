import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  TransferState,
  computed,
  inject,
  makeStateKey,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { Subject, catchError, map, of, startWith, switchMap, tap } from 'rxjs';
import { CRAFTER_SITE_NAME, HOME_DETAILS_API_URL } from '../../tokens';

type CrafterPage = {
  title_t?: string | null;
  body_html?: string | null;
  'internal-name'?: string | null;
};

type HomeDetailsResponse = {
  url?: string;
  descriptorDom?: {
    page?: CrafterPage;
  };
};

const HOME_DETAILS_STATE_KEY = makeStateKey<HomeDetailsResponse>('homeDetails');
const CONTENT_PATH = '/site/website/index.xml';

@Component({
  selector: 'app-home-details',
  imports: [],
  templateUrl: './home-details.html',
  styleUrl: './home-details.css',
})
export class HomeDetails implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrl = inject(HOME_DETAILS_API_URL);
  private readonly defaultCrafterSite = inject(CRAFTER_SITE_NAME);
  private readonly reloadTrigger$ = new Subject<void>();

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly payload = signal<HomeDetailsResponse | null>(null);

  protected readonly page = computed(() => this.payload()?.descriptorDom?.page ?? null);
  protected readonly pageUrl = computed(() => this.payload()?.url ?? '/site/website/index.xml');
  protected readonly heading = computed(
    () => this.page()?.title_t ?? this.page()?.['internal-name'] ?? 'Home page',
  );
  protected readonly bodyHtml = computed(() => this.page()?.body_html ?? '');

  ngOnInit(): void {
    this.applySeoDefaults();

    const cached = isPlatformBrowser(this.platformId)
      ? this.transferState.get(HOME_DETAILS_STATE_KEY, null)
      : null;

    if (cached) {
      this.transferState.remove(HOME_DETAILS_STATE_KEY);
      this.payload.set(cached);
      this.applySeoFromData();
    }

    const trigger$ = cached ? this.reloadTrigger$ : this.reloadTrigger$.pipe(startWith(undefined));

    trigger$
      .pipe(
        switchMap(() =>
          this.fetchHomeDetails().pipe(
            tap((response) => {
              if (isPlatformServer(this.platformId)) {
                this.transferState.set(HOME_DETAILS_STATE_KEY, response);
              }
            }),
            map((response) => ({ state: 'success' as const, response })),
            catchError(() => of({ state: 'error' as const })),
            startWith({ state: 'loading' as const }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (result.state === 'loading') {
          this.isLoading.set(true);
          this.errorMessage.set('');
          return;
        }

        this.isLoading.set(false);

        if (result.state === 'success') {
          this.payload.set(result.response);
          this.applySeoFromData();
          return;
        }

        this.payload.set(null);
        this.errorMessage.set('Unable to load CrafterCMS home content right now.');
        this.applySeoErrorState();
      });
  }

  protected reload(): void {
    this.reloadTrigger$.next();
  }

  private fetchHomeDetails() {
    if (isPlatformBrowser(this.platformId)) {
      const preferredSite = this.getPreviewSiteFromContext() || this.defaultCrafterSite;
      if (preferredSite) {
        return this.http.get<HomeDetailsResponse>(this.buildCrafterContentUrl(preferredSite)).pipe(
          catchError(() => this.http.get<HomeDetailsResponse>(this.apiUrl)),
        );
      }

      return this.http.get<HomeDetailsResponse>(this.apiUrl);
    }

    return this.http.get<HomeDetailsResponse>(this.apiUrl).pipe(
      catchError((error: HttpErrorResponse) => {
        if (isPlatformBrowser(this.platformId) && error.status === 404) {
          return this.http.get<HomeDetailsResponse>(
            this.buildCrafterContentUrl(this.defaultCrafterSite),
          );
        }

        throw error;
      }),
    );
  }

  private getPreviewSiteFromContext(): string {
    const currentSite = this.readSiteFromLocation(globalThis.location);
    if (currentSite) {
      return currentSite;
    }

    try {
      if (globalThis.top && globalThis.top !== globalThis.window && globalThis.top.location) {
        return this.readSiteFromLocation(globalThis.top.location);
      }
    } catch {
      // Ignore cross-origin access errors.
    }

    const referrer = globalThis.document.referrer;
    if (referrer) {
      const fromReferrer = this.readSiteFromUrlString(referrer);
      if (fromReferrer) {
        return fromReferrer;
      }
    }

    return '';
  }

  private readSiteFromUrlString(urlString: string): string {
    try {
      const parsedUrl = new URL(urlString);
      return this.readSiteFromLocation(parsedUrl as unknown as Location);
    } catch {
      return '';
    }
  }

  private readSiteFromLocation(locationRef: Location): string {
    const fromSearch = new URLSearchParams(locationRef.search).get('site')?.trim() ?? '';
    if (fromSearch) {
      return fromSearch;
    }

    const hash = locationRef.hash;
    const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
    return new URLSearchParams(hashQuery).get('site')?.trim() ?? '';
  }

  private buildCrafterContentUrl(site: string): string {
    const params = new URLSearchParams({
      url: CONTENT_PATH,
      crafterSite: site,
    });

    return `/api/1/site/content_store/item.json?${params.toString()}`;
  }

  private applySeoDefaults(): void {
    const title = 'Home Details | Northstar Studio';
    const description =
      'SSR-rendered CrafterCMS home page content with body_html extracted from the content API.';

    this.title.setTitle(title);
    this.updateMetaTags(title, description);
  }

  private applySeoFromData(): void {
    const pageTitle = this.heading();
    const title = `${pageTitle} | Northstar Studio`;
    const description = `SSR content preview for ${this.pageUrl()} from CrafterCMS.`;

    this.title.setTitle(title);
    this.updateMetaTags(title, description);
  }

  private applySeoErrorState(): void {
    const title = 'Home Details Unavailable | Northstar Studio';
    const description =
      'CrafterCMS home content is temporarily unavailable. Please refresh and try again.';

    this.title.setTitle(title);
    this.updateMetaTags(title, description);
  }

  private updateMetaTags(title: string, description: string): void {
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
  }
}
