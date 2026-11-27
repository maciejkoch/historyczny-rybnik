import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { form, FormField, maxLength } from '@angular/forms/signals';
import type { Map as LibreMap, Marker } from 'maplibre-gl';
import { HISTORICAL_MAP, INITIAL_CENTER } from '../../atlas-map/map-config';
import { HISTORY_CORNERS } from '../../atlas-map/history-extent';
import type { CreatorDraft } from '../creator';
type Location = CreatorDraft['data']['location'];
type Point = { lat: number; lng: number };
@Component({
  selector: 'app-location-editor',
  imports: [FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    details:not([open]) > .collapse-content {
      border: 0;
    }
  `,
  template: `<details
    class="collapse collapse-arrow mt-3 rounded-none border-t border-base-300"
    open
  >
    <summary class="collapse-title min-h-0 px-0 py-3 text-lg font-semibold">Lokalizacja</summary>
    <div class="collapse-content rounded-box border border-base-300 bg-base-100">
      <div class="mt-3 flex items-center gap-3">
        <label class="flex items-center gap-2 text-sm font-semibold"
          ><input
            type="checkbox"
            class="toggle toggle-primary toggle-sm"
            [checked]="history()"
            (change)="setHistory($any($event.target).checked)"
          />
          Plan z 1932 r.</label
        >
      </div>
      <label class="mt-2 block text-sm font-semibold"
        >Krycie planu: {{ opacity() }}%<input
          type="range"
          class="range range-primary range-sm w-full"
          min="0"
          max="100"
          [value]="opacity()"
          [disabled]="!history()"
          (input)="setOpacity(+$any($event.target).value)"
      /></label>
      <p class="text-sm text-base-content/70">
        Dopasowanie planu jest przybliżone. Kliknij mapę, aby wskazać lokalizację.
      </p>
      <div
        #canvas
        class="mt-2 h-72 w-full overflow-hidden rounded-box border border-base-300"
        aria-label="Mapa lokalizacji"
      ></div>
      @if (mapError()) {
        <p class="text-error-content" role="alert">Nie udało się wczytać mapy.</p>
      }
      <div class="mt-2 flex flex-wrap gap-2">
        <button type="button" class="btn btn-sm" (click)="pickCenter()">
          Ustaw punkt na środku mapy
        </button>
        @if (point()) {
          <button type="button" class="btn btn-sm" (click)="clear()">Usuń lokalizację</button>
        }
      </div>
      <p class="mt-2 text-sm">
        {{ point() ? 'Punkt wskazany na mapie' : 'Lokalizacja nieustalona' }}
      </p>
      <label class="fieldset"
        ><span class="fieldset-legend text-sm">Dokładność</span
        ><select class="select w-full" [formField]="fields.precision">
          <option value="">Nieustalona</option>
          <option value="exact">Dokładna</option>
          <option value="approximate">Przybliżona</option>
        </select></label
      >
      <label class="fieldset"
        ><span class="fieldset-legend text-sm">Wyjaśnienie lokalizacji</span
        ><textarea class="textarea w-full" [formField]="fields.explanation" rows="2"></textarea>
      </label>
    </div>
  </details>`,
})
export class LocationEditor {
  readonly initial = input<Location>();
  readonly initialized = signal(false);
  readonly point = signal<Point | null>(null);
  readonly model = signal({ precision: '', explanation: '' });
  readonly fields = form(this.model, (p) => maxLength(p.explanation, 2000));
  readonly history = signal(true);
  readonly opacity = signal(100);
  readonly mapError = signal(false);
  private readonly canvas = viewChild.required<ElementRef<HTMLElement>>('canvas');
  private readonly destroy = inject(DestroyRef);
  private map?: LibreMap;
  private marker?: Marker;
  private makeMarker?: (point: Point) => Marker;
  private observer?: ResizeObserver;
  constructor() {
    effect(() => {
      const loc = this.initial();
      if (this.initialized()) return;
      const p = loc?.coordinates;
      if (p && typeof p.lat === 'number' && typeof p.lng === 'number')
        this.point.set({ lat: p.lat, lng: p.lng });
      this.model.set({ precision: loc?.precision ?? '', explanation: loc?.explanation ?? '' });
      this.initialized.set(true);
    });
    effect(() => {
      const point = this.point();
      if (!this.map || !this.makeMarker) return;
      this.marker?.remove();
      this.marker = point ? this.makeMarker(point) : undefined;
    });
    afterNextRender(() => void this.init());
    this.destroy.onDestroy(() => {
      this.observer?.disconnect();
      this.marker?.remove();
      this.map?.remove();
    });
  }
  private async init(): Promise<void> {
    try {
      const libre = await import('maplibre-gl');
      if (this.destroy.destroyed) return;
      libre.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
      libre.setWorkerCount(2);
      const p = this.point();
      const map = new libre.Map({
        container: this.canvas().nativeElement,
        style: '/maps/rybnik-style.json',
        center: p ? [p.lng, p.lat] : INITIAL_CENTER,
        zoom: 14.3,
        minZoom: 10,
        maxZoom: 16.5,
        dragRotate: false,
        pitchWithRotate: false,
        trackResize: false,
      });
      this.map = map;
      map.addControl(new libre.NavigationControl({ showCompass: false }), 'top-right');
      this.makeMarker = (point) =>
        new libre.Marker({ color: '#245947' }).setLngLat([point.lng, point.lat]).addTo(map);
      if (p) this.marker = this.makeMarker(p);
      map.on('click', (e) => this.choose({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
      map.on('load', () => {
        map.addSource('historical', {
          type: 'raster',
          tiles: [`${location.origin}${HISTORICAL_MAP.tiles}`],
          tileSize: 256,
          bounds: HISTORICAL_MAP.bounds,
          minzoom: HISTORICAL_MAP.minzoom,
          maxzoom: HISTORICAL_MAP.maxzoom,
          attribution:
            'Plan 1932: Miejski Urząd Budowlany · <a href="https://cyfrowemazowsze.pl/dlibra/publication/117267/edition/113717" target="_blank" rel="noopener">Mazowiecka Biblioteka Cyfrowa</a>',
        });
        map.addLayer({
          id: 'historical',
          type: 'raster',
          source: 'historical',
          paint: { 'raster-opacity': this.opacity() / 100, 'raster-fade-duration': 0 },
        });
        map.addSource('historical-coverage', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Polygon', coordinates: [[...HISTORY_CORNERS, HISTORY_CORNERS[0]]] },
          },
        });
        map.addLayer({
          id: 'historical-coverage',
          type: 'line',
          source: 'historical-coverage',
          paint: { 'line-color': '#245947', 'line-width': 2, 'line-dasharray': [4, 3] },
        });
        this.apply();
      });
      map.on('error', () => this.mapError.set(true));
      this.observer = new ResizeObserver(([entry]) => {
        if (!entry || entry.contentRect.width === 0 || entry.contentRect.height === 0) return;
        map.resize().redraw();
      });
      this.observer.observe(this.canvas().nativeElement);
    } catch {
      if (!this.destroy.destroyed) this.mapError.set(true);
    }
  }
  private choose(p: Point): void {
    this.point.set(p);
    if (!this.model().precision) this.model.update((v) => ({ ...v, precision: 'approximate' }));
  }
  pickCenter(): void {
    if (this.map) {
      const p = this.map.getCenter();
      this.choose({ lat: p.lat, lng: p.lng });
    }
  }
  clear(): void {
    this.point.set(null);
    this.model.update((v) => ({ ...v, precision: '' }));
  }
  setHistory(v: boolean): void {
    this.history.set(v);
    this.apply();
  }
  setOpacity(v: number): void {
    this.opacity.set(v);
    this.apply();
  }
  private apply(): void {
    if (!this.map?.getLayer('historical')) return;
    this.map.setLayoutProperty('historical', 'visibility', this.history() ? 'visible' : 'none');
    this.map.setLayoutProperty(
      'historical-coverage',
      'visibility',
      this.history() ? 'visible' : 'none',
    );
    this.map.setPaintProperty('historical', 'raster-opacity', this.opacity() / 100);
  }
  value(): Location {
    const initial = this.initial(),
      m = this.model(),
      p = this.point();
    const existing = initial?.coordinates;
    if (
      JSON.stringify(p) === JSON.stringify(existing ?? null) &&
      m.precision === (initial?.precision ?? '') &&
      m.explanation === (initial?.explanation ?? '')
    )
      return initial;
    return {
      ...initial,
      coordinates: p,
      precision: m.precision || null,
      explanation: m.explanation || null,
    };
  }
}
