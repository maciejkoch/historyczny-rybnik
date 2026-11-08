import { Consent } from '../privacy/consent';
import {
  afterNextRender,
  afterRenderEffect,
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
import type { FeatureCollection, Point } from 'geojson';
import type { Map as LibreMap, Marker, GeoJSONSource } from 'maplibre-gl';
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
  readonly editing = input(false);
  readonly draftPoint = input<{ lat: number; lng: number } | null>(null);
  readonly pointPicked = output<{ lat: number; lng: number }>();
  private draftMarker?: Marker;
  readonly places = input<readonly Place[]>([]);
  readonly selected = input<Place | null>(null);
  readonly focusSelected = input(true);
  readonly layoutAnimating = input(false);
  readonly placeSelected = output<Place>();
  readonly backgroundClicked = output<void>();
  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly historyEnabled = signal(HISTORICAL_MAP.available);
  readonly opacity = signal(60);
  readonly layerControlsCollapsed = signal(false);
  readonly historyError = signal(false);
  readonly outsideCoverage = signal(false);
  readonly historyAvailable = HISTORICAL_MAP.available;
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('canvas');
  private readonly destroyRef = inject(DestroyRef);
  private readonly consent = inject(Consent);
  private map?: LibreMap;
  private markers: Marker[] = [];
  private resizeObserver?: ResizeObserver;
  private loadingTimeout?: ReturnType<typeof setTimeout>;
  private backgroundClickTimeout?: ReturnType<typeof setTimeout>;
  private generation = 0;

  constructor() {
    afterNextRender(() => {
      this.restoreLayerPreferences();
      void this.initialize();
    });
    afterRenderEffect(() => {
      const selected = this.selected();
      const focusSelected = this.focusSelected();
      const layoutAnimating = this.layoutAnimating();
      this.state();
      this.markers.forEach((marker, i) =>
        marker
          .getElement()
          .setAttribute(
            'aria-pressed',
            String(marker.getElement().dataset['placeId'] === selected?.id),
          ),
      );
      if (focusSelected && selected?.location.coordinates && this.map) {
        // Panel selection changes the available map width in the same render.
        this.map.resize();
        this.map.easeTo({
          center: [selected.location.coordinates.lng, selected.location.coordinates.lat],
          duration: layoutAnimating ? 0 : this.motionDuration(),
        });
        this.map.redraw();
      }
    });
    effect(() => {
      this.places();
      this.selected();
      this.draftPoint();
      this.editing();
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
        maxZoom: 16.5,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        // Our observer renders every resize before paint, including panel transitions.
        trackResize: false,
        canvasContextAttributes: { preserveDrawingBuffer: false },
      });
      this.map = map;
      // Temporary diagnostic for reviewing historical tile zoom levels.
      const logZoom = () => console.info(`[Mapa] Zoom: ${map.getZoom().toFixed(2)}`);
      map.on('zoomend', logZoom);
      map.addControl(new libre.AttributionControl({ compact: false }), 'bottom-right');
      map.addControl(new libre.ScaleControl({ unit: 'metric' }), 'bottom-left');
      map
        .getCanvas()
        .setAttribute(
          'aria-label',
          'Mapa Rybnika. Strzałki przesuwają mapę, plus i minus zmieniają przybliżenie. Punkty można również wybrać z listy.',
        );
      map.touchZoomRotate.disableRotation();
      this.resizeObserver = new ResizeObserver(([entry]) => {
        if (!entry || entry.contentRect.width === 0 || entry.contentRect.height === 0) return;
        // Resizing clears WebGL's drawing buffer; redraw synchronously to avoid a blank frame.
        map.resize().redraw();
      });
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
        logZoom();
        this.state.set('ready');
        clearTimeout(this.loadingTimeout);
        if (HISTORICAL_MAP.available) this.addHistoricalMap();
        void this.renderMarkers();
      });
      map.on('moveend', () => {
        this.updateCoverage();
        void this.drawClusterMarkers();
      });
      map.on('sourcedata', (event) => {
        if (event.sourceId === 'places-clustered' && event.isSourceLoaded)
          void this.drawClusterMarkers();
      });
      const cancelBackgroundClick = () => clearTimeout(this.backgroundClickTimeout);
      map.on('click', (event) => {
        if (this.editing()) {
          this.pointPicked.emit({ lat: event.lngLat.lat, lng: event.lngLat.lng });
          return;
        }
        if (event.originalEvent.target !== map.getCanvas()) return;
        cancelBackgroundClick();
        // Distinguish a single tap from double-click/tap zoom, not animation timing.
        this.backgroundClickTimeout = setTimeout(() => this.backgroundClicked.emit(), 300);
      });
      map.on('dblclick', cancelBackgroundClick);
      map.on('movestart', cancelBackgroundClick);
      map.on('zoomstart', cancelBackgroundClick);
      map.on('dragstart', cancelBackgroundClick);
    } catch {
      if (!this.destroyRef.destroyed && generation === this.generation) this.state.set('error');
    }
  }

  private async renderMarkers(): Promise<void> {
    const map = this.map;
    if (!map || this.state() !== 'ready') return;
    const { Marker } = await import('maplibre-gl');
    this.draftMarker?.remove();
    const draft = this.draftPoint();
    if (this.editing() && draft)
      this.draftMarker = new Marker({ color: '#b45309' })
        .setLngLat([draft.lng, draft.lat])
        .addTo(map);
    if (this.draftMarker) this.draftMarker.getElement().style.pointerEvents = 'none';
    if (map !== this.map || this.destroyRef.destroyed) return;
    const data: FeatureCollection<Point> = {
      type: 'FeatureCollection',
      features: this.places()
        .filter((p) => p.location.coordinates && p.id !== this.selected()?.id)
        .map((p) => ({
          type: 'Feature',
          properties: { placeId: p.id },
          geometry: {
            type: 'Point',
            coordinates: [p.location.coordinates!.lng, p.location.coordinates!.lat],
          },
        })),
    };
    const source = map.getSource<GeoJSONSource>('places-clustered');
    if (source) source.setData(data);
    else {
      map.addSource('places-clustered', {
        type: 'geojson',
        data,
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 15,
      });
      map.addLayer({
        id: 'places-clustered',
        type: 'circle',
        source: 'places-clustered',
        paint: { 'circle-radius': 0, 'circle-opacity': 0 },
      });
    }
    await this.drawClusterMarkers();
  }

  private async drawClusterMarkers(): Promise<void> {
    const map = this.map;
    if (!map?.getSource('places-clustered') || this.state() !== 'ready') return;
    const { Marker } = await import('maplibre-gl');
    if (map !== this.map || this.destroyRef.destroyed) return;
    this.markers.forEach((marker) => marker.remove());
    this.markers = [];
    const seen = new Set<string>();
    const add = (coordinates: number[], place?: Place, clusterId?: number, count?: number) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.disabled = this.editing();
      button.style.pointerEvents = this.editing() ? 'none' : '';
      button.tabIndex = this.editing() ? -1 : 0;
      button.className = count
        ? 'place-marker btn btn-circle btn-primary min-w-11 min-h-11'
        : 'place-marker';
      if (place) button.dataset['placeId'] = place.id;
      button.textContent = count
        ? String(count)
        : place?.location.precision === 'approximate'
          ? '≈'
          : '•';
      button.setAttribute(
        'aria-label',
        count
          ? `Grupa ${count} miejsc — przybliż mapę`
          : `${place!.name} — ${place!.location.precision === 'approximate' ? 'pozycja przybliżona' : 'budynek'}`,
      );
      if (place) button.setAttribute('aria-pressed', String(this.selected()?.id === place.id));
      button.addEventListener('click', async (event) => {
        event.stopPropagation();
        clearTimeout(this.backgroundClickTimeout);
        if (this.editing()) return;
        if (place) this.placeSelected.emit(place);
        else {
          try {
            const zoom = await map
              .getSource<GeoJSONSource>('places-clustered')!
              .getClusterExpansionZoom(clusterId!);
            if (map !== this.map || this.editing()) return;
            map.easeTo({
              center: [coordinates[0], coordinates[1]],
              zoom: Math.min(zoom, map.getMaxZoom()),
              duration: this.motionDuration(),
            });
          } catch {
            /* A refreshed source may have replaced this cluster. */
          }
        }
      });
      this.markers.push(
        new Marker({ element: button }).setLngLat([coordinates[0], coordinates[1]]).addTo(map),
      );
    };
    for (const feature of map.querySourceFeatures('places-clustered')) {
      if (feature.geometry.type !== 'Point') continue;
      const properties = feature.properties;
      const key = properties['cluster']
        ? `cluster-${properties['cluster_id']}`
        : properties['placeId'];
      if (seen.has(key)) continue;
      seen.add(key);
      if (properties['cluster'])
        add(
          feature.geometry.coordinates,
          undefined,
          properties['cluster_id'],
          properties['point_count'],
        );
      else {
        const place = this.places().find((p) => p.id === properties['placeId']);
        if (place) add(feature.geometry.coordinates, place);
      }
    }
    const selected = this.selected();
    if (selected?.location.coordinates)
      add([selected.location.coordinates.lng, selected.location.coordinates.lat], selected);
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
    this.saveLayerPreferences();
    this.applyHistory();
  }

  changeOpacity(event: Event): void {
    this.opacity.set(Number((event.target as HTMLInputElement).value));
    this.saveLayerPreferences();
    this.applyHistory();
  }

  toggleLayerControls(): void {
    this.layerControlsCollapsed.update((collapsed) => !collapsed);
    this.saveLayerPreferences();
  }

  private restoreLayerPreferences(): void {
    try {
      const saved: unknown = JSON.parse(
        this.consent.readPreference('historyczny-rybnik.layers.v1') ?? 'null',
      );
      if (!saved || typeof saved !== 'object') return;
      if ('collapsed' in saved && typeof saved.collapsed === 'boolean') {
        this.layerControlsCollapsed.set(saved.collapsed);
      }
      if ('enabled' in saved && typeof saved.enabled === 'boolean') {
        this.historyEnabled.set(saved.enabled && this.historyAvailable);
      }
      if (
        'opacity' in saved &&
        typeof saved.opacity === 'number' &&
        Number.isFinite(saved.opacity)
      ) {
        this.opacity.set(Math.round(Math.max(0, Math.min(100, saved.opacity))));
      }
    } catch {
      // Keep defaults when storage is unavailable or contains invalid JSON.
    }
  }

  private saveLayerPreferences(): void {
    try {
      this.consent.writePreference(
        'historyczny-rybnik.layers.v1',
        JSON.stringify({
          collapsed: this.layerControlsCollapsed(),
          enabled: this.historyEnabled(),
          opacity: this.opacity(),
        }),
      );
    } catch {
      // Controls remain usable when the browser blocks storage.
    }
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
    this.draftMarker?.remove();
    this.draftMarker = undefined;
    clearTimeout(this.loadingTimeout);
    clearTimeout(this.backgroundClickTimeout);
    this.resizeObserver?.disconnect();
    this.markers.forEach((marker) => marker.remove());
    this.markers = [];
    this.map?.remove();
    this.map = undefined;
  }
}
