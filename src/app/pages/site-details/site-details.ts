import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  PLATFORM_ID,
  TransferState,
  computed,
  inject,
  makeStateKey,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { Subject, catchError, map, of, startWith, switchMap, tap } from 'rxjs';
import { SITE_DETAILS_API_URL } from '../../tokens';

type ItemCollection<T> = {
  item?: T | T[];
};

type SectionItem = {
  title_s?: string | null;
  targetURL_s?: string | null;
  content_html?: string | null;
  image_s?: string | null;
};

type CarouselItem = {
  title_s?: string | null;
  webImage_s?: string | null;
  mobileImage_s?: string | null;
  mapping_s?: string | null;
  delay_i?: string | null;
};

type PageData = {
  'internal-name'?: string | null;
  lastModifiedDate?: string | null;
  ourCompany_o?: ItemCollection<SectionItem>;
  ourPlatforms_o?: ItemCollection<SectionItem>;
  carousel_o?: ItemCollection<CarouselItem>;
};

type SiteDetailsResponse = {
  name?: string;
  url?: string;
  descriptorDom?: {
    page?: PageData;
  };
};

const SITE_DETAILS_STATE_KEY = makeStateKey<SiteDetailsResponse>('siteDetails');

function toArray<T>(collection: ItemCollection<T> | undefined): T[] {
  if (!collection?.item) {
    return [];
  }

  return Array.isArray(collection.item) ? collection.item : [collection.item];
}

@Component({
  selector: 'app-site-details',
  imports: [],
  templateUrl: './site-details.html',
  styleUrl: './site-details.css',
})
export class SiteDetails implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrl = inject(SITE_DETAILS_API_URL);
  private readonly reloadTrigger$ = new Subject<void>();

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly payload = signal<SiteDetailsResponse | null>(null);

  protected readonly page = computed(() => this.payload()?.descriptorDom?.page ?? null);
  protected readonly pageName = computed(() => this.payload()?.name ?? 'index.xml');
  protected readonly pageUrl = computed(() => this.payload()?.url ?? '/site/website/index.xml');
  protected readonly internalName = computed(() => this.page()?.['internal-name'] ?? 'Home');
  protected readonly lastUpdated = computed(() => this.page()?.lastModifiedDate ?? 'Unavailable');
  protected readonly companyItems = computed(() => toArray(this.page()?.ourCompany_o).slice(0, 4));
  protected readonly platformItems = computed(() =>
    toArray(this.page()?.ourPlatforms_o).slice(0, 5),
  );
  protected readonly carouselItems = computed(() => toArray(this.page()?.carousel_o));
  protected readonly carouselCount = computed(() => this.carouselItems().length);

  ngOnInit(): void {
    this.applySeoDefaults();

    const cached = isPlatformBrowser(this.platformId)
      ? this.transferState.get(SITE_DETAILS_STATE_KEY, null)
      : null;

    if (cached) {
      this.transferState.remove(SITE_DETAILS_STATE_KEY);
      this.payload.set(cached);
      this.applySeoFromData();
    }

    // When the server already rendered the data, skip the initial client fetch
    // (that relative call would hit the CrafterCMS preview origin and 404).
    const trigger$ = cached ? this.reloadTrigger$ : this.reloadTrigger$.pipe(startWith(undefined));

    trigger$
      .pipe(
        switchMap(() =>
          this.http.get<SiteDetailsResponse>(this.apiUrl).pipe(
            tap((response) => {
              if (isPlatformServer(this.platformId)) {
                this.transferState.set(SITE_DETAILS_STATE_KEY, response);
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

        this.errorMessage.set('Unable to load API data right now. Please try again in a moment.');
        this.payload.set(null);
        this.applySeoErrorState();
      });
  }

  protected reload(): void {
    this.reloadTrigger$.next();
  }

  private applySeoDefaults(): void {
    const title = 'Site Details | Northstar Studio';
    const description =
      'Live SSR-rendered page that shows structured details from CrafterCMS content API.';

    this.title.setTitle(title);
    this.updateMetaTags(title, description);
  }

  private applySeoFromData(): void {
    const section = this.internalName();
    const carouselCount = this.carouselCount();
    const title = `${section} API Details | Northstar Studio`;
    const description = `SSR view of /site/website/index.xml with ${carouselCount} carousel items and curated section summaries.`;

    this.title.setTitle(title);
    this.updateMetaTags(title, description);
  }

  private applySeoErrorState(): void {
    const title = 'Site Details Unavailable | Northstar Studio';
    const description =
      'The API-backed site details page is temporarily unavailable. Please try again shortly.';

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
