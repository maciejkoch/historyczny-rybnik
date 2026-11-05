import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  ActivatedRoute,
  NavigationEnd,
  NavigationStart,
  Router,
  RouterLink,
} from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { PanelLayout } from './panel-layout';
import { AtlasMap } from '../atlas-map/atlas-map';
import { PLACES } from '../places/catalog.generated';
import { Locations } from '../places/locations';
import { normalizeSearch, Place } from '../places/place';
import { PlaceSearchPanel } from './place-search-panel';
import { PlaceDetailsPanel } from './place-details-panel';
import { MobileNavigation } from './mobile-navigation';
@Component({
  selector: 'app-atlas',
  imports: [
    RouterLink,
    AtlasMap,
    PanelLayout,
    PlaceSearchPanel,
    PlaceDetailsPanel,
    MobileNavigation,
  ],
  templateUrl: './atlas.html',
  styleUrl: './atlas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Atlas {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly params = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  readonly locations = inject(Locations);
  readonly query = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  readonly screen = computed<'map' | 'search' | 'place'>(() => this.params()['screen'] ?? 'map');
  readonly hasDetails = computed(() => this.screen() === 'place');
  private readonly lastSelectedSlug = signal<string | null>(
    this.route.snapshot.data['slug'] ?? null,
  );
  readonly places = computed(() =>
    PLACES.map((place) => {
      const current = this.locations.current().find((value) => value.id === place.id);
      return current
        ? { ...place, ...current }
        : this.locations.status() === 'ready'
          ? { ...place, location: { ...place.location, coordinates: null } }
          : place;
    }),
  );
  readonly selected = computed(
    () =>
      this.places().find(
        (place) => place.slug === (this.params()['slug'] ?? this.lastSelectedSlug()),
      ) ?? null,
  );
  readonly results = computed(() => {
    const words = normalizeSearch(this.query()).trim().split(/\s+/);
    return this.places().filter((place) => {
      const haystack = normalizeSearch(
        [
          place.name,
          ...place.aliases,
          ...place.addresses.map((a) => a.text),
          place.district ?? '',
        ].join(' '),
      );
      return words.every((word) => haystack.includes(word));
    });
  });
  readonly enlarged = signal<{ url: string; alt: string } | null>(null);
  private readonly searchPanel = viewChild<ElementRef<HTMLElement>>('searchPanel');
  private readonly detailsPanel = viewChild<ElementRef<HTMLElement>>('detailsPanel');
  private readonly mapRegion = viewChild<ElementRef<HTMLElement>>('mapRegion');
  private readonly searchLayout = viewChild<PanelLayout>('searchLayout');
  private readonly detailsLayout = viewChild<PanelLayout>('detailsLayout');
  private readonly scanDialog = viewChild<ElementRef<HTMLDialogElement>>('scanDialog');
  private currentPath = '/' + this.route.snapshot.url.map((segment) => segment.path).join('/');
  private restoringHistory = false;
  private readonly scrollPositions = new Map<string, number>();
  private readonly navigation = signal<{ path: string; top: number } | null>(null);
  private handledNavigation: object | null = null;
  constructor() {
    this.route.data.pipe(takeUntilDestroyed()).subscribe((data) => {
      const place = PLACES.find((p) => p.slug === data['slug']);
      if (place) this.lastSelectedSlug.set(place.slug);
      const title = place
        ? `${place.name} — Historyczny Rybnik`
        : data['screen'] === 'search'
          ? 'Znajdź miejsce — Historyczny Rybnik'
          : 'Historyczny Rybnik — miejsca i ich historie';
      const description =
        place?.description ??
        'Odkrywaj miejsca Rybnika, ich historię i źródła na mapie współczesnej oraz planie z 1932 roku.';
      const url =
        'https://historyczny-rybnik-dev.web.app' +
        (place ? '/miejsca/' + place.slug : data['screen'] === 'search' ? '/szukaj' : '/');
      this.title.setTitle(title);
      this.meta.updateTag({ name: 'description', content: description });
      for (const [property, content] of Object.entries({
        'og:title': title,
        'og:description': description,
        'og:url': url,
        'og:type': 'website',
      }))
        this.meta.updateTag({ property, content });
      let canonical = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!canonical) {
        canonical = this.document.createElement('link');
        canonical.rel = 'canonical';
        this.document.head.appendChild(canonical);
      }
      canonical.href = url;
    });
    afterNextRender(() => void this.locations.refresh());
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (typeof window === 'undefined') return;
      if (event instanceof NavigationStart) {
        this.scrollPositions.set(this.currentPath, window.scrollY);
        this.restoringHistory = event.navigationTrigger === 'popstate';
      }
      if (event instanceof NavigationEnd) {
        if (this.route.snapshot.data['screen'] === 'search') {
          this.query.set(this.route.snapshot.queryParamMap.get('q') ?? '');
        }
        const path = event.urlAfterRedirects.split(/[?#]/)[0];
        if (path === this.currentPath) return; // Typing changes q without moving the page or focus.
        this.currentPath = path;
        this.navigation.set({
          path,
          top:
            this.restoringHistory || path === '/szukaj' ? (this.scrollPositions.get(path) ?? 0) : 0,
        });
      }
    });
    afterRenderEffect(() => {
      const navigation = this.navigation();
      if (!navigation || navigation === this.handledNavigation) return;
      this.handledNavigation = navigation;
      const screen = this.screen();
      if (screen === 'place') this.detailsLayout()?.expand();
      if (screen === 'search') this.searchLayout()?.expand();
      requestAnimationFrame(() => {
        if (!this.isDesktop()) {
          window.scrollTo({ top: navigation.top, behavior: 'instant' });
          (screen === 'search' ? this.searchPanel() : this.mapRegion())?.nativeElement.focus({
            preventScroll: true,
          });
        } else if (screen === 'place') {
          this.detailsPanel()?.nativeElement.scrollTo({ top: 0 });
          this.focusDetails();
        } else if (screen === 'search') {
          this.searchPanel()
            ?.nativeElement.querySelector<HTMLElement>('#place-search')
            ?.focus({ preventScroll: true });
        }
      });
    });
    afterRenderEffect(() => {
      const dialog = this.scanDialog()?.nativeElement;
      if (this.enlarged() && dialog && !dialog.open) dialog.showModal();
      else if (!this.enlarged() && dialog?.open) dialog.close();
    });
  }
  private isDesktop(): boolean {
    return window.matchMedia('(min-width: 1100px)').matches;
  }

  private focusDetails(): void {
    this.detailsPanel()
      ?.nativeElement.querySelector<HTMLElement>('#place-title')
      ?.focus({ preventScroll: true });
  }

  select(place: Place): void {
    const path = '/miejsca/' + place.slug;
    if (this.currentPath === path) {
      this.detailsLayout()?.expand();
      if (this.isDesktop()) this.focusDetails();
      else window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    void this.router.navigate(['/miejsca', place.slug]);
  }

  updateQuery(value: string): void {
    this.query.set(value);
    // Desktop keeps its current three-panel route; the mobile search page owns q.
    if (this.screen() === 'search') {
      void this.router.navigate(['/szukaj'], {
        queryParams: { q: value || null },
        replaceUrl: true,
      });
    }
  }

  showDetails(): void {
    this.detailsPanel()?.nativeElement.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'start',
    });
    this.focusDetails();
  }

  close(): void {
    this.searchLayout()?.expand();
    void this.router.navigate(['/']);
  }
}
