/** Zarządza znacznikami MapLibre, ich grupowaniem, animacjami i sprzątaniem. */
import type { FeatureCollection, Point } from 'geojson';
import type { Map as LibreMap, Marker, GeoJSONSource } from 'maplibre-gl';
import type { PlaceSummary } from '../places/place';
import { markerCategory, markerIcon } from './place-markers';
import { visibleClusterCandidates } from './cluster-visibility';

interface GroupMarkersOptions {
  map: LibreMap;
  document: Document;
  isReady: () => boolean;
  places: () => readonly PlaceSummary[];
  selected: () => PlaceSummary | null;
  draftPoint: () => { lat: number; lng: number } | null;
  editing: () => boolean;
  motionDuration: () => number;
  onPlaceSelected: (place: PlaceSummary) => void;
  cancelBackgroundClick: () => void;
}

export class GroupMarkers {
  private readonly map: LibreMap;
  private draftMarker?: Marker;
  private markers: Marker[] = [];
  private markerGroups: { marker: Marker; members: string[]; coordinates: [number, number] }[] = [];
  private outgoingMarkers: Marker[] = [];
  private markerDrawVersion = 0;
  private markerZoom?: number;
  private markerSignature = '';
  private destroyed = false;

  constructor(private readonly options: GroupMarkersOptions) {
    this.map = options.map;
  }

  private places(): readonly PlaceSummary[] {
    return this.options.places();
  }
  private selected(): PlaceSummary | null {
    return this.options.selected();
  }
  private draftPoint(): { lat: number; lng: number } | null {
    return this.options.draftPoint();
  }
  private editing(): boolean {
    return this.options.editing();
  }
  private motionDuration(): number {
    return this.options.motionDuration();
  }

  updateSelection(selected: PlaceSummary | null): void {
    this.markers.forEach((marker) =>
      marker
        .getElement()
        .setAttribute(
          'aria-pressed',
          String(marker.getElement().dataset['placeId'] === selected?.id),
        ),
    );
  }

  async update(): Promise<void> {
    const map = this.map;
    if (!map || !this.options.isReady()) return;
    const version = ++this.markerDrawVersion;
    const { Marker } = await import('maplibre-gl');
    if (map !== this.map || version !== this.markerDrawVersion || this.destroyed) return;
    this.draftMarker?.remove();
    const draft = this.draftPoint();
    if (this.editing() && draft)
      this.draftMarker = new Marker({ color: '#b45309' })
        .setLngLat([draft.lng, draft.lat])
        .addTo(map);
    if (this.draftMarker) this.draftMarker.getElement().style.pointerEvents = 'none';
    if (map !== this.map || this.destroyed) return;
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
    this.markerZoom = undefined;
    this.markerSignature = '';
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
    await this.redraw();
  }

  async redraw(): Promise<void> {
    const map = this.map;
    if (!map?.getSource('places-clustered') || !this.options.isReady()) return;
    const version = ++this.markerDrawVersion;
    const source = map.getSource<GeoJSONSource>('places-clustered')!;
    const { Marker } = await import('maplibre-gl');
    if (map !== this.map || version !== this.markerDrawVersion || this.destroyed) return;
    const queriedFeatures = map.querySourceFeatures('places-clustered');
    const members = new Map<number, string[]>();
    try {
      const clusters = new Map(
        queriedFeatures
          .filter((f) => f.properties['cluster'])
          .map((f) => [Number(f.properties['cluster_id']), f]),
      );
      await Promise.all(
        [...clusters.values()].map(async (f) => {
          const id = Number(f.properties['cluster_id']);
          const leaves = await source.getClusterLeaves(id, Number(f.properties['point_count']), 0);
          members.set(
            id,
            leaves.map((leaf) => String(leaf.properties?.['placeId'])),
          );
        }),
      );
    } catch {
      // Source was replaced while resolving cluster membership; its next data event redraws.
      return;
    }
    if (map !== this.map || version !== this.markerDrawVersion || this.destroyed) return;
    const features = visibleClusterCandidates(
      queriedFeatures
        .filter((f) => f.geometry.type === 'Point')
        .map((feature) => ({
          key: feature.properties['cluster']
            ? `c${feature.properties['cluster_id']}`
            : `p${feature.properties['placeId']}`,
          tileZoom: (feature as typeof feature & { tile?: { z: number } }).tile?.z ?? 0,
          members: feature.properties['cluster']
            ? (members.get(Number(feature.properties['cluster_id'])) ?? [])
            : [String(feature.properties['placeId'])],
          value: feature,
        })),
      this.selected()?.id,
    ).map((candidate) => candidate.value);
    const signature = JSON.stringify({
      features: features
        .filter((f) => f.geometry.type === 'Point')
        .map((f) => [
          f.properties['cluster']
            ? `c${f.properties['cluster_id']}`
            : `p${f.properties['placeId']}`,
          f.geometry.type === 'Point' ? f.geometry.coordinates : [],
          f.properties['point_count'],
        ])
        .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
      selected: this.selected()?.id,
      editing: this.editing(),
    });
    if (signature === this.markerSignature) {
      this.markerZoom = map.getZoom();
      return;
    }
    this.markerSignature = signature;
    this.outgoingMarkers.forEach((marker) => marker.remove());
    this.outgoingMarkers = [];
    const previous = this.markerGroups;
    const previousMarkers = this.markers;
    const zoom = map.getZoom();
    const animate =
      this.markerZoom !== undefined &&
      Math.abs(zoom - this.markerZoom) > 0.01 &&
      this.motionDuration() > 0 &&
      !this.editing();
    this.markerZoom = zoom;
    this.markers = [];
    this.markerGroups = [];
    const seen = new Set<string>();
    const add = (
      coordinates: number[],
      place?: PlaceSummary,
      clusterId?: number,
      count?: number,
      ids: string[] = [],
    ) => {
      const button = this.options.document.createElement('button');
      button.type = 'button';
      button.disabled = this.editing();
      button.style.pointerEvents = this.editing() ? 'none' : '';
      button.tabIndex = this.editing() ? -1 : 0;
      button.className = count ? 'place-cluster btn btn-circle min-w-11 min-h-11' : 'place-marker';
      if (place) button.dataset['placeId'] = place.id;
      if (count) button.textContent = String(count);
      else if (place) {
        const symbol = this.options.document.createElement('span');
        symbol.className = 'place-marker-symbol';
        symbol.dataset['precision'] = place.location.precision;
        symbol.setAttribute('aria-hidden', 'true');
        const icon = this.options.document.createElement('img');
        icon.src = markerIcon(markerCategory(place).icon);
        icon.alt = '';
        icon.width = 22;
        icon.height = 22;
        symbol.append(icon);
        button.append(symbol);
      }
      button.setAttribute(
        'aria-label',
        count
          ? `Grupa ${count} miejsc — przybliż mapę`
          : `${place!.name} — ${markerCategory(place!).name}, ${place!.location.precision === 'building' ? 'dokładna lokalizacja, wskazany budynek' : 'przybliżona lokalizacja'}`,
      );
      if (place) button.setAttribute('aria-pressed', String(this.selected()?.id === place.id));
      button.addEventListener('click', async (event) => {
        event.stopPropagation();
        this.options.cancelBackgroundClick();
        if (this.editing()) return;
        if (place) this.options.onPlaceSelected(place);
        else {
          try {
            const zoom = await map
              .getSource<GeoJSONSource>('places-clustered')!
              .getClusterExpansionZoom(clusterId!);
            if (this.destroyed || this.editing()) return;
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
      const marker = new Marker({ element: button, anchor: count ? 'center' : 'bottom' })
        .setLngLat([coordinates[0], coordinates[1]])
        .addTo(map);
      this.markers.push(marker);
      if (ids.length)
        this.markerGroups.push({
          marker,
          members: ids,
          coordinates: [coordinates[0], coordinates[1]],
        });
    };
    for (const feature of features) {
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
          members.get(Number(properties['cluster_id'])) ?? [],
        );
      else {
        const place = this.places().find((p) => p.id === properties['placeId']);
        if (place) add(feature.geometry.coordinates, place, undefined, undefined, [place.id]);
      }
    }
    const selected = this.selected();
    if (selected?.location.coordinates)
      add([selected.location.coordinates.lng, selected.location.coordinates.lat], selected);

    const bestMatch = (ids: string[], candidates: typeof previous) =>
      candidates.reduce<(typeof previous)[number] | undefined>((best, candidate) => {
        const common = candidate.members.filter((id) => ids.includes(id)).length;
        const bestCommon = best ? best.members.filter((id) => ids.includes(id)).length : 0;
        return common > bestCommon ? candidate : best;
      }, undefined);
    const duration = this.motionDuration();
    for (const current of this.markerGroups) {
      const from = bestMatch(current.members, previous);
      if (
        !animate ||
        !from ||
        (from.members.length === current.members.length &&
          from.members.every((id) => current.members.includes(id)))
      )
        continue;
      const origin = map.project(from.coordinates);
      const target = map.project(current.coordinates);
      current.marker.getElement().animate(
        [
          { translate: `${origin.x - target.x}px ${origin.y - target.y}px`, opacity: 0 },
          { translate: '0px 0px', opacity: 1 },
        ],
        { duration, easing: 'ease-out' },
      );
    }
    for (const old of previous) {
      const to = bestMatch(old.members, this.markerGroups);
      if (
        !animate ||
        !to ||
        (old.members.length === to.members.length &&
          old.members.every((id) => to.members.includes(id)))
      ) {
        old.marker.remove();
        continue;
      }
      const button = old.marker.getElement();
      button.style.pointerEvents = 'none';
      button.tabIndex = -1;
      button.setAttribute('aria-hidden', 'true');
      const origin = map.project(old.coordinates);
      const target = map.project(to.coordinates);
      this.outgoingMarkers.push(old.marker);
      const animation = button.animate(
        [
          { translate: '0px 0px', opacity: 1 },
          { translate: `${target.x - origin.x}px ${target.y - origin.y}px`, opacity: 0 },
        ],
        { duration, easing: 'ease-in' },
      );
      const removeOutgoing = () => {
        clearTimeout(fallback);
        old.marker.remove();
        this.outgoingMarkers = this.outgoingMarkers.filter((marker) => marker !== old.marker);
      };
      // A cancelled animation does not fire finish; the timeout also covers browser interruptions.
      const fallback = setTimeout(removeOutgoing, duration + 150);
      animation.onfinish = removeOutgoing;
      animation.oncancel = removeOutgoing;
    }
    // Selected markers are outside clustering and are replaced without transition.
    for (const marker of previousMarkers)
      if (!previous.some((group) => group.marker === marker)) marker.remove();
  }

  destroy(): void {
    this.destroyed = true;
    ++this.markerDrawVersion;
    this.draftMarker?.remove();
    this.markers.forEach((marker) => marker.remove());
    this.outgoingMarkers.forEach((marker) => marker.remove());
    this.draftMarker = undefined;
    this.markers = [];
    this.outgoingMarkers = [];
    this.markerGroups = [];
    this.markerZoom = undefined;
    this.markerSignature = '';
  }
}
