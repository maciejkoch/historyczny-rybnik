"""Prepare our own XYZ WebP pyramid from the MBC public-domain scan (PDF page 3).

Usage: python scripts/maps/prepare_history.py /path/to/extracted-page-3.jpg
Extract with: pdfimages -f 3 -l 3 -j source.pdf page
Dependencies: scripts/maps/requirements.txt. Normal frontend builds use committed tiles.
"""
import hashlib
import json
import math
from pathlib import Path
import sys

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
RADIUS = 6378137
HALF_WORLD = math.pi * RADIUS
Image.MAX_IMAGE_PIXELS = 300_000_000


def mercator(lon, lat):
    return [RADIUS * math.radians(lon), RADIUS * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))]


def lonlat(x, y):
    return [math.degrees(x / RADIUS), math.degrees(2 * math.atan(math.exp(y / RADIUS)) - math.pi / 2)]


def main():
    path = Path(sys.argv[1])
    config = json.loads((ROOT / 'scripts/maps/history-controls.json').read_text())
    source_hash = hashlib.sha256(path.read_bytes()).hexdigest()
    if source_hash != config['sourceImageSha256']:
        raise ValueError('Source checksum differs; re-inspect the scan and its control points.')
    controls = config['controls']
    pixel = np.array([[*c['pixel'], 1] for c in controls])
    target = np.array([mercator(*c['coordinates']) for c in controls])
    matrix = np.linalg.lstsq(pixel, target, rcond=None)[0]
    residuals = np.linalg.norm(pixel @ matrix - target, axis=1) * math.cos(math.radians(50.1))
    inverse = np.linalg.inv(np.vstack([matrix.T, [0, 0, 1]]))
    image = Image.open(path)
    original_width, original_height = image.size
    image.draft('RGB', (8192, 8192))
    image.thumbnail((8192, 8192), Image.Resampling.LANCZOS)
    image = image.convert('RGBA')
    factor_x, factor_y = image.width / original_width, image.height / original_height
    corners = np.array([[0, 0, 1], [original_width, 0, 1], [original_width, original_height, 1], [0, original_height, 1]]) @ matrix
    west, south = corners.min(axis=0)
    east, north = corners.max(axis=0)
    bounds = [*lonlat(west, south), *lonlat(east, north)]
    output = ROOT / 'public/maps/rybnik-1932'
    output.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for z in range(10, 17):
        tile_meters = 2 * HALF_WORLD / 2 ** z
        resolution = tile_meters / 256
        x0, x1 = math.floor((west + HALF_WORLD) / tile_meters), math.floor((east + HALF_WORLD) / tile_meters)
        y0, y1 = math.floor((HALF_WORLD - north) / tile_meters), math.floor((HALF_WORLD - south) / tile_meters)
        for x in range(x0, x1 + 1):
            for y in range(y0, y1 + 1):
                # Output pixel -> EPSG:3857 -> input scan pixel. No color changes or invented geometry.
                world = np.array([[resolution, 0, x * tile_meters - HALF_WORLD], [0, -resolution, HALF_WORLD - y * tile_meters], [0, 0, 1]])
                transform = inverse @ world
                transform[0] *= factor_x
                transform[1] *= factor_y
                tile = image.transform((256, 256), Image.Transform.AFFINE, tuple(transform[:2].ravel()), Image.Resampling.BICUBIC, fillcolor=(0, 0, 0, 0))
                rel = f'{z}/{x}/{y}.webp'
                file = output / rel
                file.parent.mkdir(parents=True, exist_ok=True)
                tile.save(file, 'WEBP', quality=85, method=6)
                manifest[rel] = hashlib.sha256(file.read_bytes()).hexdigest()
        print(f'Prepared zoom {z}', flush=True)
    report = {'bounds': bounds, 'corners': [lonlat(*p) for p in corners], 'minzoom': 10, 'maxzoom': 16, 'sourceImageSha256': source_hash, 'affinePixelToMercator': matrix.tolist(), 'controlResidualsMeters': {c['name']: round(float(r), 1) for c, r in zip(controls, residuals)}, 'fitRmsMeters': round(float(np.sqrt(np.mean(residuals ** 2))), 1), 'tiles': manifest}
    (ROOT / 'src/app/atlas-map/history-extent.ts').write_text('// Generated from our affine georeference; see scripts/maps/prepare_history.py.\nexport const HISTORY_BOUNDS: [number, number, number, number] = ' + json.dumps(bounds) + ';\nexport const HISTORY_CORNERS: [number, number][] = ' + json.dumps(report['corners']) + ';\n')
    (output / 'manifest.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f'{len(manifest)} tiles; RMS {report["fitRmsMeters"]} m; bounds {bounds}', flush=True)


if __name__ == '__main__':
    main()
