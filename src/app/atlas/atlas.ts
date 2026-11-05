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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { AtlasMap } from '../atlas-map/atlas-map';
import { PLACES } from '../places/catalog.generated';
import { Locations } from '../places/locations';
import { normalizeSearch, PartialDate, Place } from '../places/place';
import { FIREBASE_DEV } from '../places/runtime-config';
@Component({
  selector: 'app-atlas',
  imports: [AtlasMap, RouterLink],
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
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private listScroll = 0;
  private previousSlug: string | undefined;
  private readonly scanDialog = viewChild<ElementRef<HTMLDialogElement>>('scanDialog');
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
      if (slug) {
        this.listScroll = window.scrollY;
        window.scrollTo({ top: 0 });
        this.panel()
          ?.nativeElement.querySelector<HTMLElement>('#place-title')
          ?.focus({ preventScroll: true });
      } else {
        window.scrollTo({ top: this.listScroll });
      }
      this.previousSlug = slug;
    });
    afterRenderEffect(() => {
      const dialog = this.scanDialog()?.nativeElement;
      if (this.enlarged() && dialog && !dialog.open) dialog.showModal();
      else if (!this.enlarged() && dialog?.open) dialog.close();
    });
  }
  select(place: Place): void {
    if (!this.selected()) this.listScroll = window.scrollY;
    void this.router
      .navigate(['/miejsca', place.slug])
      .then(() =>
        this.panel()
          ?.nativeElement.querySelector<HTMLElement>('#place-title')
          ?.focus({ preventScroll: true }),
      );
  }
  close(): void {
    const id = this.selected()?.id;
    void this.router.navigate(['/']).then(() => {
      window.scrollTo({ top: this.listScroll });
      this.panel()
        ?.nativeElement.querySelector<HTMLElement>(`[data-place="${id}"]`)
        ?.focus({ preventScroll: true });
    });
  }
  date(value: PartialDate | null): string {
    return value
      ? `${value.approximate ? 'około ' : ''}${value.from}${value.to ? ' – ' + value.to : ''}`
      : 'Data nieustalona';
  }
  imageUrl(path: string): string {
    return FIREBASE_DEV
      ? `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_DEV.storageBucket}/o/${encodeURIComponent(path)}?alt=media`
      : '';
  }
}
