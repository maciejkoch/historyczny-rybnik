"""Prepare our own XYZ WebP pyramid from the MBC public-domain scan (PDF page 3).

Usage: python scripts/maps/prepare_history.py /path/to/extracted-page-3.jpg
Extract with: pdfimages -f 3 -l 3 -j source.pdf page
Dependencies: scripts/maps/requirements.txt. Normal frontend builds use committed tiles.
"""
import hashlib
import argparse
import json
import math
from pathlib import Path

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


def project(points, matrix):
    homogeneous = np.column_stack([points, np.ones(len(points))]) @ matrix.T
    return homogeneous[:, :2] / homogeneous[:, 2:]


def fit_projective(pixel, target):
    # Normalized DLT avoids ill-conditioning of full-resolution pixels / Mercator meters.
    def normalize(points):
        center = points.mean(axis=0)
        scale = math.sqrt(2) / np.linalg.norm(points - center, axis=1).mean()
        matrix = np.array([[scale, 0, -scale * center[0]], [0, scale, -scale * center[1]], [0, 0, 1]])
        return project(points, matrix), matrix

    pixel, source_normalization = normalize(pixel)
    target, target_normalization = normalize(target)
    equations = []
    for (x, y), (u, v) in zip(pixel, target):
        equations.extend([[-x, -y, -1, 0, 0, 0, u*x, u*y, u], [0, 0, 0, -x, -y, -1, v*x, v*y, v]])
    _, _, vectors = np.linalg.svd(equations, full_matrices=False)
    matrix = np.linalg.inv(target_normalization) @ vectors[-1].reshape(3, 3) @ source_normalization
    return matrix / matrix[2, 2]


def errors(controls, matrix):
    actual = np.array([mercator(*c['coordinates']) for c in controls])
    predicted = project(np.array([c['pixel'] for c in controls]), matrix)
    return np.linalg.norm(predicted - actual, axis=1) * math.cos(math.radians(50.1))


def georeference(config):
    controls = config['controls']
    matrix = fit_projective(np.array([c['pixel'] for c in controls]), np.array([mercator(*c['coordinates']) for c in controls]))
    validation = errors(config['validationControls'], matrix)
    # These limits guard agreement with the reference, not absolute map accuracy.
    if np.percentile(validation, 90) > 4 or validation.max() > 8:
        raise ValueError('Georeference fails held-out reference checks; inspect controls before publishing.')
    return matrix, validation


def render_detail_tile(image, transform, size=256):
    # Pillow premultiplies RGBA before transforming. Crop locally so each tile
    # processes hundreds of pixels, not the entire scan. Keep bicubic padding.
    transform = transform.copy()
    footprint = project(np.array([[0, 0], [size, 0], [size, size], [0, size]]), transform)
    left, top = np.floor(footprint.min(axis=0)).astype(int) - 3
    right, bottom = np.ceil(footprint.max(axis=0)).astype(int) + 3
    with image.crop((left, top, right, bottom)) as source:
        transform[0] -= left * transform[2]
        transform[1] -= top * transform[2]
        return source.transform((size, size), Image.Transform.PERSPECTIVE,
                                tuple(transform.ravel()[:8]), Image.Resampling.BICUBIC,
                                fillcolor=(0, 0, 0, 0))


def render_overview_tile(image, transform):
    # Include 3 output pixels around the tile: Lanczos must see neighbours.
    samples = transform @ np.array([[.5, 0, -3], [0, .5, -3], [0, 0, 1]])
    samples /= samples[2, 2]
    with render_detail_tile(image, samples, 524) as tile:
        return tile.resize((262, 262), Image.Resampling.LANCZOS).crop((3, 3, 259, 259))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument('--extend-high-zooms', action='store_true',
                        help='Preserve and verify zooms 10–16; generate only zooms 17–18.')
    modes.add_argument('--refresh-low-zooms', action='store_true',
                       help='Regenerate zooms 10–16 with antialiasing; preserve and verify 17–18.')
    args = parser.parse_args()
    path = args.source
    config = json.loads((ROOT / 'scripts/maps/history-controls.json').read_text())
    source_hash = hashlib.sha256(path.read_bytes()).hexdigest()
    if source_hash != config['sourceImageSha256']:
        raise ValueError('Source checksum differs; re-inspect the scan and its control points.')
    matrix, validation = georeference(config)
    residuals = errors(config['controls'], matrix)
    inverse = np.linalg.inv(matrix)
    image = Image.open(path)
    if list(image.size) != config['imageSize']:
        raise ValueError('Unexpected source dimensions.')
    original_width, original_height = image.size
    corners = project(np.array([[0, 0], [original_width, 0], [original_width, original_height], [0, original_height]]), matrix)
    west, south = corners.min(axis=0)
    east, north = corners.max(axis=0)
    bounds = [*lonlat(west, south), *lonlat(east, north)]
    output = ROOT / 'public/maps/rybnik-1932'
    output.mkdir(parents=True, exist_ok=True)
    manifest = {}
    incremental = args.extend_high_zooms or args.refresh_low_zooms
    preserved_zooms = set(range(10, 17)) if args.extend_high_zooms else {17, 18}
    if incremental:
        previous = json.loads((output / 'manifest.json').read_text())
        if (previous['sourceImageSha256'] != source_hash
                or previous['bounds'] != bounds
                or previous['projectivePixelToMercator'] != matrix.tolist()):
            raise ValueError('Existing tiles use a different scan or georeference; cannot extend.')
        for rel, digest in previous['tiles'].items():
            if int(rel.split('/')[0]) in preserved_zooms:
                if hashlib.sha256((output / rel).read_bytes()).hexdigest() != digest:
                    raise ValueError(f'Existing tile checksum differs: {rel}')
                manifest[rel] = digest
        if {int(rel.split('/')[0]) for rel in manifest} != preserved_zooms:
            raise ValueError(f'Existing pyramid must contain zooms {sorted(preserved_zooms)}.')
    # Remove obsolete generated tiles when a changed extent no longer covers them.
    for stale in output.glob('*/*/*.webp'):
        if not incremental or int(stale.relative_to(output).parts[0]) not in preserved_zooms:
            stale.unlink()
    for z in range(17 if args.extend_high_zooms else 10, 17 if args.refresh_low_zooms else 19):
        tile_meters = 2 * HALF_WORLD / 2 ** z
        resolution = tile_meters / 256
        if z <= 17:
            image.close()
            image = Image.open(path)
            if z <= 16:
                # Average source details before the warp. Two samples per output
                # pixel retain lines; a final Lanczos pass filters the warped tile.
                width = max(np.linalg.norm(corners[1] - corners[0]), np.linalg.norm(corners[2] - corners[3]))
                height = max(np.linalg.norm(corners[3] - corners[0]), np.linalg.norm(corners[2] - corners[1]))
                image.thumbnail((max(1, math.ceil(2 * width / resolution)),
                                 max(1, math.ceil(2 * height / resolution))), Image.Resampling.LANCZOS)
            image = image.convert('RGBA')
        factor_x, factor_y = image.width / original_width, image.height / original_height
        x0, x1 = math.floor((west + HALF_WORLD) / tile_meters), math.floor((east + HALF_WORLD) / tile_meters)
        y0, y1 = math.floor((HALF_WORLD - north) / tile_meters), math.floor((HALF_WORLD - south) / tile_meters)
        for x in range(x0, x1 + 1):
            for y in range(y0, y1 + 1):
                # Output pixel -> EPSG:3857 -> input scan pixel. No color changes or invented geometry.
                world = np.array([[resolution, 0, x * tile_meters - HALF_WORLD], [0, -resolution, HALF_WORLD - y * tile_meters], [0, 0, 1]])
                transform = inverse @ world
                transform[0] *= factor_x
                transform[1] *= factor_y
                transform /= transform[2, 2]
                tile = render_detail_tile(image, transform) if z >= 17 else render_overview_tile(image, transform)
                rel = f'{z}/{x}/{y}.webp'
                file = output / rel
                file.parent.mkdir(parents=True, exist_ok=True)
                tile.save(file, 'WEBP', quality=85 if z <= 16 else 95, method=6)
                manifest[rel] = hashlib.sha256(file.read_bytes()).hexdigest()
        print(f'Prepared zoom {z}', flush=True)
    report = {
        'bounds': bounds, 'corners': [lonlat(*p) for p in corners], 'minzoom': 10, 'maxzoom': 18,
        'sourceImageSha256': source_hash, 'projectivePixelToMercator': matrix.tolist(),
        'reference': config['reference'], 'controlCount': len(config['controls']),
        'fitRmsMeters': round(float(np.sqrt(np.mean(residuals ** 2))), 2),
        'validation': {'count': len(validation), 'medianMeters': round(float(np.median(validation)), 2),
                       'p90Meters': round(float(np.percentile(validation, 90)), 2), 'maxMeters': round(float(validation.max()), 2),
                       'note': config['accuracyNote']},
        'tiles': manifest,
    }
    (ROOT / 'src/app/atlas-map/history-extent.ts').write_text('// Generated from our projective georeference; see scripts/maps/prepare_history.py.\nexport const HISTORY_BOUNDS: [number, number, number, number] = ' + json.dumps(bounds) + ';\nexport const HISTORY_CORNERS: [number, number][] = ' + json.dumps(report['corners']) + ';\n')
    (output / 'manifest.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f'{len(manifest)} tiles; RMS {report["fitRmsMeters"]} m; bounds {bounds}', flush=True)


if __name__ == '__main__':
    main()
