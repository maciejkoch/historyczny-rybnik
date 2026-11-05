import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
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
  styleUrls: ['./atlas.css', './atlas-mobile.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Atlas {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly params = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  readonly locations = inject(Locations);
  readonly query = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  readonly screen = computed<'map' | 'search' | 'place'>(() => this.params()['screen'] ?? 'map');
  readonly hasDetails = computed(() => this.screen() === 'place');
  readonly sheetOpen = signal(this.route.snapshot.data['screen'] === 'place');
  readonly sheetAnimating = signal(false);
  readonly headerHeight = signal(74);
  private readonly lastSelectedSlug = signal<string | null>(
    this.route.snapshot.data['slug'] ?? null,
  );
  readonly places = computed<readonly Place[]>(() =>
    PLACES.map((place) => {
      const current = this.locations.current().find((value) => value.id === place.id);
      return current
        ? { ...place, ...current }
        : this.locations.status() === 'ready'
          ? {
              ...place,
              location: {
                coordinates: null,
                precision: 'unknown',
                explanation: place.location.explanation,
              },
            }
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
  private readonly brandHeader = viewChild<ElementRef<HTMLElement>>('brandHeader');
  private readonly searchLayout = viewChild<PanelLayout>('searchLayout');
  private readonly detailsLayout = viewChild<PanelLayout>('detailsLayout');
  private readonly scanDialog = viewChild<ElementRef<HTMLDialogElement>>('scanDialog');
  private currentPath = '/' + this.route.snapshot.url.map((segment) => segment.path).join('/');
  private restoringHistory = false;
  private animateNextNavigation = false;
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
    afterNextRender(() => {
      void this.locations.refresh();
      const header = this.brandHeader()?.nativeElement;
      const observer = new ResizeObserver(() => {
        if (header) this.headerHeight.set(header.getBoundingClientRect().height);
      });
      if (header) observer.observe(header);
      const desktop = window.matchMedia('(min-width: 1100px)');
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      const settle = () => {
        this.sheetAnimating.set(false);
        this.sheetOpen.set(this.hasDetails());
      };
      desktop.addEventListener('change', settle);
      reducedMotion.addEventListener('change', settle);
      this.destroyRef.onDestroy(() => {
        observer.disconnect();
        desktop.removeEventListener('change', settle);
        reducedMotion.removeEventListener('change', settle);
      });
    });
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (typeof window === 'undefined') return;
      if (event instanceof NavigationStart) {
        this.scrollPositions.set(this.currentPath, window.scrollY);
        this.restoringHistory = event.navigationTrigger === 'popstate';
        const target = event.url.split(/[?#]/)[0];
        this.animateNextNavigation =
          !this.isDesktop() &&
          !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
          ((this.screen() === 'map' && target.startsWith('/miejsca/')) ||
            (this.screen() === 'place' && target === '/'));
      }
      if (event instanceof NavigationEnd) {
        if (this.route.snapshot.data['screen'] === 'search') {
          this.query.set(this.route.snapshot.queryParamMap.get('q') ?? '');
        }
        const path = event.urlAfterRedirects.split(/[?#]/)[0];
        if (path === this.currentPath) return; // Typing changes q without moving the page or focus.
        this.currentPath = path;
        this.sheetAnimating.set(this.animateNextNavigation);
        if (!this.animateNextNavigation) this.sheetOpen.set(this.hasDetails());
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
        if (this.destroyRef.destroyed || this.navigation() !== navigation) return;
        if (this.sheetAnimating()) {
          // Commit the previous layout before transitioning to the URL's new state.
          this.mapRegion()?.nativeElement.getBoundingClientRect();
          if (this.sheetOpen() === this.hasDetails()) this.sheetAnimating.set(false);
          this.sheetOpen.set(this.hasDetails());
        }
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

  finishSheetTransition(event: TransitionEvent): void {
    if (
      event.target === event.currentTarget &&
      (event.propertyName === 'height' || event.propertyName === 'grid-template-rows')
    ) {
      this.sheetAnimating.set(false);
    }
  }

  closeFromMap(): void {
    if (!this.isDesktop() && this.hasDetails()) void this.router.navigate(['/']);
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
