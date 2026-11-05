"""Optional audit tool: source MBC JPEG + locally cached reference XYZ tiles -> controls.

Usage: python register_scans.py source.jpg reference-tile-directory candidates.json
Reference filenames: 16-X-Y.png. This script never downloads or publishes reference images.
Requires opencv-python-headless==5.0.0.93 in addition to requirements.txt.
Committed history-controls.json is the reviewed input used by prepare_history.py.
"""
import hashlib
import json
from pathlib import Path
import sys
import cv2
import numpy as np
from PIL import Image
from prepare_history import HALF_WORLD, lonlat

Image.MAX_IMAGE_PIXELS = 300_000_000
source, directory, output = map(Path, sys.argv[1:])
files = sorted(directory.glob('16-*.png'))
xy = [tuple(map(int, p.stem.split('-')[1:])) for p in files]
x0, y0 = min(x for x, y in xy), min(y for x, y in xy)
x1, y1 = max(x for x, y in xy), max(y for x, y in xy)
reference = Image.new('RGB', ((x1-x0+1)*256, (y1-y0+1)*256), 'white')
for path, (x, y) in zip(files, xy):
    im = Image.open(path).convert('RGBA')
    reference.paste(im.convert('RGB'), ((x-x0)*256, (y-y0)*256), im.getchannel('A'))
scale = .3
image = Image.open(source)
image = image.resize((round(image.width*scale), round(image.height*scale)))
cv2.setRNGSeed(0)
sift = cv2.SIFT_create(nfeatures=12000)
a, da = sift.detectAndCompute(cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY), None)
b, db = sift.detectAndCompute(cv2.cvtColor(np.array(reference), cv2.COLOR_RGB2GRAY), None)
matcher = cv2.FlannBasedMatcher(dict(algorithm=1, trees=5), dict(checks=100))
matches = [m for m, n in matcher.knnMatch(da, db, k=2) if m.distance < .65*n.distance]
p = np.float32([a[m.queryIdx].pt for m in matches])
q = np.float32([b[m.trainIdx].pt for m in matches])
_, mask = cv2.findHomography(p, q, cv2.RANSAC, 3)
keep = mask.ravel().astype(bool)
p, q = p[keep]/scale, q[keep]
cells = {}
for i, (x, y) in enumerate(p):
    cells.setdefault((int(x//2000), int(y//2000)), []).append(i)
train, validation = [], []
resolution = 2*HALF_WORLD/(2**16*256)
for (x, y), ids in sorted(cells.items()):
    ids = np.array(ids)
    selected = [int(ids[np.argmin(np.linalg.norm(p[ids]-[(x+.5)*2000, (y+.5)*2000], axis=1))])]
    for _ in range(min(7, len(ids)-1)):
        distance = np.min(np.linalg.norm(p[ids, None, :]-p[selected][None, :, :], axis=2), axis=1)
        selected.append(int(ids[np.argmax(distance)]))
    group = validation if (x+2*y)%4 == 0 else train
    for i in selected:
        rx, ry = q[i].tolist()
        group.append({'name': f'scan-match-{i}', 'pixel': p[i].tolist(),
                      'coordinates': lonlat((x0*256+rx)*resolution-HALF_WORLD, HALF_WORLD-(y0*256+ry)*resolution)})
report = {'controls': train, 'validationControls': validation,
          'referenceTiles': {path.name: hashlib.sha256(path.read_bytes()).hexdigest() for path in files}}
output.write_text(json.dumps(report, indent=2)+'\n')
print(f'{keep.sum()} matches; {len(train)} fit / {len(validation)} validation controls')
