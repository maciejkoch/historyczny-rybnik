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
import { ActivatedRoute, Router } from '@angular/router';
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
  imports: [AtlasMap, PanelLayout, PlaceSearchPanel, PlaceDetailsPanel, MobileNavigation],
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
  readonly query = signal('');
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
    () => this.places().find((place) => place.slug === this.params()['slug']) ?? null,
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
  readonly mobileView = signal<'search' | 'details'>(
    this.route.snapshot.data['slug'] ? 'details' : 'search',
  );
  private readonly searchPanel = viewChild<ElementRef<HTMLElement>>('searchPanel');
  private readonly detailsPanel = viewChild<ElementRef<HTMLElement>>('detailsPanel');
  private readonly mapRegion = viewChild<ElementRef<HTMLElement>>('mapRegion');
  private readonly searchLayout = viewChild<PanelLayout>('searchLayout');
  private readonly detailsLayout = viewChild<PanelLayout>('detailsLayout');
  private readonly scanDialog = viewChild<ElementRef<HTMLDialogElement>>('scanDialog');
  private previousSlug: string | undefined = this.route.snapshot.data['slug'];
  private selectionSource: 'map' | 'search' | null = null;
  private readonly mobileScroll = { search: 0, details: 0 };
  constructor() {
    this.route.data.pipe(takeUntilDestroyed()).subscribe((data) => {
      const place = PLACES.find((p) => p.slug === data['slug']);
      const title = place
        ? `${place.name} — Historyczny Rybnik`
        : 'Historyczny Rybnik — miejsca i ich historie';
      const description =
        place?.description ??
        'Odkrywaj miejsca Rybnika, ich historię i źródła na mapie współczesnej oraz planie z 1932 roku.';
      const url =
        'https://historyczny-rybnik-dev.web.app' + (place ? '/miejsca/' + place.slug : '/');
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
    afterRenderEffect(() => {
      const slug: string | undefined = this.params()['slug'];
      if (slug === this.previousSlug) return;
      this.previousSlug = slug;
      if (slug) {
        this.rememberMobileScroll();
        this.mobileScroll.details = 0;
        this.mobileView.set('details');
        this.detailsLayout()?.expand();
        const scrollToDetails = this.selectionSource !== 'map';
        requestAnimationFrame(() => {
          this.detailsPanel()?.nativeElement.scrollTo({ top: 0 });
          if (this.isDesktop() || scrollToDetails) this.focusDetails(scrollToDetails);
        });
      } else {
        this.mobileView.set('search');
        requestAnimationFrame(() => {
          if (!this.isDesktop()) this.restoreMobileScroll('search');
          this.searchPanel()
            ?.nativeElement.querySelector<HTMLElement>('#place-search')
            ?.focus({ preventScroll: true });
        });
      }
      this.selectionSource = null;
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

  private rememberMobileScroll(): void {
    if (this.isDesktop()) return;
    const view = this.mobileView();
    const panel = view === 'search' ? this.searchPanel() : this.detailsPanel();
    if (!panel) return;
    const top = panel.nativeElement.getBoundingClientRect().top + window.scrollY;
    if (window.scrollY >= top - 2) this.mobileScroll[view] = Math.max(0, window.scrollY - top);
  }

  private restoreMobileScroll(view: 'search' | 'details', reset = false): void {
    const panel = view === 'search' ? this.searchPanel() : this.detailsPanel();
    if (!panel) return;
    const top = panel.nativeElement.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (reset ? 0 : this.mobileScroll[view]), behavior: 'instant' });
  }

  private focusDetails(scroll: boolean): void {
    if (!this.isDesktop() && scroll) this.restoreMobileScroll('details', true);
    this.detailsPanel()
      ?.nativeElement.querySelector<HTMLElement>('#place-title')
      ?.focus({ preventScroll: true });
  }

  select(place: Place, source: 'map' | 'search' = 'map'): void {
    this.rememberMobileScroll();
    if (this.selected()?.id === place.id) {
      this.detailsLayout()?.expand();
      this.mobileView.set('details');
      if (source === 'search' || this.isDesktop())
        requestAnimationFrame(() => this.focusDetails(true));
      return;
    }
    this.selectionSource = source;
    void this.router.navigate(['/miejsca', place.slug]);
  }

  showSearch(): void {
    this.rememberMobileScroll();
    this.mobileView.set('search');
    this.searchLayout()?.expand();
    requestAnimationFrame(() => {
      if (!this.isDesktop()) this.restoreMobileScroll('search');
      this.searchPanel()?.nativeElement.focus({ preventScroll: true });
    });
  }

  showDetails(fromMap = false): void {
    if (!this.selected()) return;
    this.rememberMobileScroll();
    this.mobileView.set('details');
    this.detailsLayout()?.expand();
    requestAnimationFrame(() => {
      if (!this.isDesktop()) this.restoreMobileScroll('details', fromMap);
      this.detailsPanel()
        ?.nativeElement.querySelector<HTMLElement>('#place-title')
        ?.focus({ preventScroll: true });
    });
  }

  showMap(): void {
    this.rememberMobileScroll();
    this.mapRegion()?.nativeElement.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'start',
    });
    this.mapRegion()?.nativeElement.focus({ preventScroll: true });
  }

  close(): void {
    this.rememberMobileScroll();
    this.searchLayout()?.expand();
    void this.router.navigate(['/']);
  }
}
