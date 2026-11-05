import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { Map as LibreMap, Marker } from 'maplibre-gl';
import { Place } from '../places/place';
import { HISTORICAL_MAP, INITIAL_CENTER } from './map-config';
import { HISTORY_CORNERS } from './history-extent';

@Component({
  selector: 'app-atlas-map',
  templateUrl: './atlas-map.html',
  styleUrl: './atlas-map.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtlasMap {
  readonly places = input<readonly Place[]>([]);
  readonly selected = input<Place | null>(null);
  readonly placeSelected = output<Place>();
  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly historyEnabled = signal(false);
  readonly opacity = signal(35);
  readonly historyError = signal(false);
  readonly outsideCoverage = signal(false);
  readonly historyAvailable = HISTORICAL_MAP.available;
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('canvas');
  private readonly destroyRef = inject(DestroyRef);
  private map?: LibreMap;
  private markers: Marker[] = [];
  private resizeObserver?: ResizeObserver;
  private loadingTimeout?: ReturnType<typeof setTimeout>;
  private generation = 0;

  constructor() {
    afterNextRender(() => void this.initialize());
    effect(() => {
      const selected = this.selected();
      this.markers.forEach((marker, i) =>
        marker
          .getElement()
          .setAttribute(
            'aria-pressed',
            String(marker.getElement().dataset['placeId'] === selected?.id),
          ),
      );
      if (selected?.location.coordinates && this.map) {
        this.map.easeTo({
          center: [selected.location.coordinates.lng, selected.location.coordinates.lat],
          duration: this.motionDuration(),
        });
      }
    });
    effect(() => {
      this.places();
      if (this.state() === 'ready') void this.renderMarkers();
    });
    this.destroyRef.onDestroy(() => {
      ++this.generation;
      this.cleanup();
    });
  }

  async initialize(): Promise<void> {
    const generation = ++this.generation;
    const camera = this.map
      ? { center: this.map.getCenter(), zoom: this.map.getZoom() }
      : { center: INITIAL_CENTER, zoom: 14.3 };
    this.cleanup();
    this.state.set('loading');
    this.historyError.set(false);
    try {
      // This module and all WebGL/DOM work are deliberately outside the SSG execution path.
      const libre = await import('maplibre-gl');
      if (this.destroyRef.destroyed || generation !== this.generation) return;
      libre.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
      libre.setWorkerCount(2);
      this.container().nativeElement.replaceChildren();
      const map = new libre.Map({
        container: this.container().nativeElement,
        style: '/maps/rybnik-style.json',
        ...camera,
        minZoom: 10,
        maxZoom: 19,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        canvasContextAttributes: { preserveDrawingBuffer: false },
      });
      this.map = map;
      map.addControl(new libre.AttributionControl({ compact: false }), 'bottom-right');
      map.addControl(new libre.ScaleControl({ unit: 'metric' }), 'bottom-left');
      map
        .getCanvas()
        .setAttribute(
          'aria-label',
          'Mapa Rybnika. Strzałki przesuwają mapę, plus i minus zmieniają przybliżenie. Punkty można również wybrać z listy.',
        );
      map.touchZoomRotate.disableRotation();
      this.resizeObserver = new ResizeObserver(() => map.resize());
      this.resizeObserver.observe(this.container().nativeElement);
      this.loadingTimeout = setTimeout(() => {
        if (generation === this.generation && this.state() === 'loading') this.state.set('error');
      }, 15000);
      map.on('error', (event) => {
        if ('sourceId' in event && event.sourceId === 'historical') this.historyError.set(true);
        else this.state.set('error');
      });
      map.on('load', () => {
        if (generation !== this.generation) return;
        this.state.set('ready');
        clearTimeout(this.loadingTimeout);
        if (HISTORICAL_MAP.available) this.addHistoricalMap();
        void this.renderMarkers();
      });
      map.on('moveend', () => this.updateCoverage());
    } catch {
      if (!this.destroyRef.destroyed && generation === this.generation) this.state.set('error');
    }
  }

  private async renderMarkers(): Promise<void> {
    const map = this.map;
    if (!map || this.state() !== 'ready') return;
    const { Marker } = await import('maplibre-gl');
    if (map !== this.map || this.destroyRef.destroyed) return;
    this.markers.forEach((marker) => marker.remove());
    this.markers = [];
    for (const place of this.places()) {
      const point = place.location.coordinates;
      if (!point) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'place-marker';
      button.dataset['placeId'] = place.id;
      button.textContent = place.location.precision === 'approximate' ? '≈' : '•';
      button.setAttribute(
        'aria-label',
        `${place.name} — ${place.location.precision === 'approximate' ? 'pozycja przybliżona' : 'budynek'}`,
      );
      button.setAttribute('aria-pressed', String(this.selected()?.id === place.id));
      button.addEventListener('click', () => this.placeSelected.emit(place));
      this.markers.push(
        new Marker({ element: button }).setLngLat([point.lng, point.lat]).addTo(map),
      );
    }
  }

  private addHistoricalMap(): void {
    const map = this.map!;
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
      layout: { visibility: 'none' },
      paint: {
        'raster-opacity': this.opacity() / 100,
        'raster-fade-duration': 0,
        'raster-opacity-transition': { duration: 0 },
      },
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
      layout: { visibility: 'none' },
      paint: { 'line-color': '#245947', 'line-width': 2, 'line-dasharray': [4, 3] },
    });
    this.applyHistory();
    this.updateCoverage();
  }

  toggleHistory(event: Event): void {
    this.historyEnabled.set((event.target as HTMLInputElement).checked);
    this.applyHistory();
  }

  changeOpacity(event: Event): void {
    this.opacity.set(Number((event.target as HTMLInputElement).value));
    this.applyHistory();
  }

  private applyHistory(): void {
    const map = this.map;
    if (!map?.getLayer('historical')) return;
    const visibility = this.historyEnabled() ? 'visible' : 'none';
    map.setLayoutProperty('historical', 'visibility', visibility);
    map.setLayoutProperty('historical-coverage', 'visibility', visibility);
    map.setPaintProperty('historical', 'raster-opacity', this.opacity() / 100);
  }

  private updateCoverage(): void {
    if (!this.map) return;
    const c = this.map.getCenter();
    const sides = HISTORY_CORNERS.map(([x, y], index) => {
      const [nextX, nextY] = HISTORY_CORNERS[(index + 1) % HISTORY_CORNERS.length];
      return (nextX - x) * (c.lat - y) - (nextY - y) * (c.lng - x);
    });
    this.outsideCoverage.set(
      !(sides.every((side) => side >= 0) || sides.every((side) => side <= 0)),
    );
  }

  zoom(direction: number): void {
    this.map?.zoomTo(this.map.getZoom() + direction, { duration: this.motionDuration() });
  }
  resetView(): void {
    this.map?.easeTo({ center: INITIAL_CENTER, zoom: 14.3, duration: this.motionDuration() });
  }
  showCoverage(): void {
    this.map?.fitBounds(HISTORICAL_MAP.bounds, { padding: 35, duration: this.motionDuration() });
  }
  private motionDuration(): number {
    return matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300;
  }
  private cleanup(): void {
    clearTimeout(this.loadingTimeout);
    this.resizeObserver?.disconnect();
    this.markers.forEach((marker) => marker.remove());
    this.markers = [];
    this.map?.remove();
    this.map = undefined;
  }
}
