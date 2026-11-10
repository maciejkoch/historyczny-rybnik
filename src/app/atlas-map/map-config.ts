import { HISTORY_BOUNDS } from './history-extent';

export const INITIAL_CENTER: [number, number] = [18.542, 50.0956];
// Bounds of our own georeferenced raster; populated by the preparation script.
export const HISTORICAL_MAP = {
  available: true,
  tiles: '/maps/rybnik-1932/{z}/{x}/{y}.webp',
  bounds: HISTORY_BOUNDS,
  minzoom: 10,
  maxzoom: 18,
};
