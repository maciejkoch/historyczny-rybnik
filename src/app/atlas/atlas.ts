import { Account } from '../places/account';
import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { PanelLayout } from './panel-layout';
import { AtlasMap } from '../atlas-map/atlas-map';
import { markerCategory, markerIcon } from '../atlas-map/place-markers';
import { PublicPlaces } from '../places/public-places';
import { Locations } from '../places/locations';
import { Place, PlaceSummary } from '../places/place';
import { filterPlaces } from '../places/place-filter';
import { PlaceSearchPanel } from './place-search-panel';
import { PlaceDetailsPanel } from './place-details-panel';
import { PlaceEditor } from './place-editor';
import { MobileNavigation } from '../layout/mobile-navigation/mobile-navigation';
import { PortalHeader } from '../layout/portal-header/portal-header';
@Component({
  selector: 'app-atlas',
  imports: [
    AtlasMap,
    PanelLayout,
    PlaceSearchPanel,
    PlaceDetailsPanel,
    PlaceEditor,
    MobileNavigation,
    PortalHeader,
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
  readonly account = inject(Account);
  readonly markerCategory = markerCategory;
  readonly markerIcon = markerIcon;
  readonly editing = signal(false);
  readonly creatingPlace = signal(false);
  readonly editorPlace = signal<Place | null>(null);
  readonly mapPointPicking = signal(false);
  readonly placeOverride = signal<Place | null>(null);
  readonly draftPoint = signal<{ lat: number; lng: number } | null>(null);
  readonly panelVisible = computed(() => this.hasDetails() || this.editing());
  async startEditing(): Promise<void> {
    if (!this.account.user()) {
      await this.account.toggle();
      return;
    }
    if (!this.account.admin()) return;
    const place = this.selected();
    if (!place) return;
    this.editorPlace.set(place);
    this.creatingPlace.set(false);
    this.mapPointPicking.set(false);
    this.draftPoint.set(null);
    this.editing.set(true);
    this.detailsLayout()?.expand();
    if (!this.isDesktop()) this.sheetOpen.set(true);
    requestAnimationFrame(() => this.focusDetails());
  }

  async startCreatingPlace(): Promise<void> {
    if (!this.account.user()) {
      await this.account.toggle();
      return;
    }
    if (!this.account.admin()) return;
    this.returnToSearch = this.screen() !== 'map';
    this.editorPlace.set(null);
    this.creatingPlace.set(true);
    this.mapPointPicking.set(false);
    this.draftPoint.set(null);
    this.editing.set(true);
    this.detailsLayout()?.expand();
    if (!this.isDesktop()) this.sheetOpen.set(true);
    requestAnimationFrame(() => this.focusDetails());
  }

  cancelEditing(): void {
    this.editing.set(false);
    this.creatingPlace.set(false);
    this.editorPlace.set(null);
    this.mapPointPicking.set(false);
    this.draftPoint.set(null);
  }

  pickPoint(point: { lat: number; lng: number }): void {
    if (this.mapPointPicking()) {
      this.draftPoint.set(point);
      this.mapPointPicking.set(false);
    }
  }

  async savePlace(place: Place): Promise<void> {
    if (!this.account.admin()) return;
    const wasNew = this.creatingPlace();
    const previousSlug = this.editorPlace()?.slug;
    this.publicPlaces.upsert(place);
    this.placeOverride.set(place);
    this.cancelEditing();
    if (wasNew || (previousSlug !== undefined && previousSlug !== place.slug))
      await this.router.navigate(['/miejsca', place.slug]);
  }
  readonly locations = inject(Locations);
  readonly publicPlaces = inject(PublicPlaces);
  readonly withoutLocation = signal(false);
  readonly selectedTag = signal('');
  private returnToSearch = false;
  readonly query = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  readonly screen = computed<'map' | 'search' | 'place'>(() => this.params()['screen'] ?? 'map');
  readonly hasDetails = computed(() => this.screen() === 'place');
  readonly sheetOpen = signal(this.route.snapshot.data['screen'] === 'place');
  readonly sheetAnimating = signal(false);
  readonly headerHeight = signal(74);
  readonly places = computed<readonly PlaceSummary[]>(() =>
    this.publicPlaces.summaries().map((place) => {
      const current = this.locations.current().find((value) => value.id === place.id);
      return current ? { ...place, ...current } : place;
    }),
  );
  readonly selected = computed<Place | null>(() => {
    const place = this.params()['place'] as Place | null | undefined;
    if (!place) return null;
    const override = this.placeOverride();
    if (override?.id === place.id) return override;
    const current = this.locations.current().find((value) => value.id === place.id);
    return current ? { ...place, ...current } : place;
  });
  readonly tags = computed(() => {
    const tags = new Map<string, { id: string; name: string }>();
    for (const place of this.places()) {
      const tag = place.tags[0];
      if (tag) tags.set(tag.id, tag);
    }
    return [...tags.values()].sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  });
  readonly allTags = computed(() => {
    const tags = new Map<string, { id: string; name: string }>();
    for (const place of this.places()) for (const tag of place.tags) tags.set(tag.id, tag);
    return [...tags.values()].sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  });
  readonly results = computed(() =>
    filterPlaces(this.places(), this.query(), this.selectedTag(), this.withoutLocation()),
  );
  readonly enlarged = signal<{ url: string; alt: string } | null>(null);
  private readonly searchPanel = viewChild<ElementRef<HTMLElement>>('searchPanel');
  private readonly detailsPanel = viewChild<ElementRef<HTMLElement>>('detailsPanel');
  private readonly mapRegion = viewChild<ElementRef<HTMLElement>>('mapRegion');
  private readonly brandHeader = viewChild<PortalHeader, ElementRef<HTMLElement>>('brandHeader', {
    read: ElementRef,
  });
  private readonly searchLayout = viewChild<PanelLayout>('searchLayout');
  private readonly detailsLayout = viewChild<PanelLayout>('detailsLayout');
  private readonly scanDialog = viewChild<ElementRef<HTMLDialogElement>>('scanDialog');
  private currentPath = '/' + this.route.snapshot.url.map((segment) => segment.path).join('/');
  private animateNextNavigation = false;
  private readonly navigation = signal<{ path: string } | null>(null);
  private handledNavigation: object | null = null;
  constructor() {
    this.route.data.pipe(takeUntilDestroyed()).subscribe((data) => {
      const place = data['place'] as Place | null | undefined;
      const title = place
        ? `${place.name} — Historyczny Rybnik`
        : data['screen'] === 'search'
          ? 'Miejsca — Historyczny Rybnik'
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
      void this.publicPlaces.load();
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
    effect(() => {
      if (!this.account.admin()) this.cancelEditing();
    });
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (typeof window === 'undefined') return;
      if (event instanceof NavigationStart) {
        this.cancelEditing();
        const target = event.url.split(/[?#]/)[0];
        if (this.placeOverride()?.slug !== target.split('/').at(-1)) this.placeOverride.set(null);
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
        this.navigation.set({ path });
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
          (screen === 'search' ? this.searchPanel() : this.mapRegion())?.nativeElement.focus({
            preventScroll: true,
          });
        } else if (screen === 'place') {
          this.detailsPanel()?.nativeElement.scrollTo({ top: 0 });
          this.focusDetails();
        } else if (screen === 'search') {
          this.searchPanel()?.nativeElement.scrollTo({ top: 0 });
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
    if (this.editing()) return;
    if (!this.isDesktop() && this.hasDetails()) void this.router.navigate(['/']);
  }

  private focusDetails(): void {
    this.detailsPanel()
      ?.nativeElement.querySelector<HTMLElement>('#place-title')
      ?.focus({ preventScroll: true });
    this.detailsPanel()
      ?.nativeElement.querySelector<HTMLElement>('#place-editor-title')
      ?.focus({ preventScroll: true });
  }

  select(place: PlaceSummary): void {
    if (this.editing()) return;
    this.cancelEditing();
    if (this.screen() !== 'place') this.returnToSearch = this.screen() === 'search';
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
    void this.router.navigate([this.returnToSearch ? '/szukaj' : '/'], {
      queryParams: this.returnToSearch ? { q: this.query() || null } : {},
    });
  }
}
