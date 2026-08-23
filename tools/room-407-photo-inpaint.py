#!/usr/bin/env python3
from pathlib import Path
import cv2
import numpy as np

root = Path(__file__).resolve().parents[1]
src = root / 'assets' / 'room-407-evidence.webp'
out = root / 'artifacts' / 'room-407-photo-candidates'
out.mkdir(parents=True, exist_ok=True)

img = cv2.imread(str(src), cv2.IMREAD_COLOR)
if img is None:
    raise SystemExit(f'Could not read {src}')
h, w = img.shape[:2]

# Candidate masks are deliberately close to the small light rectangular object
# on the lower-right part of the desk. They are expressed as fractions so the
# operation remains deterministic if the source is re-encoded at the same crop.
candidates = {
    'a-tight': (0.786, 0.742, 0.060, 0.043, 5),
    'b-medium': (0.780, 0.736, 0.072, 0.052, 7),
    'c-wide': (0.775, 0.730, 0.083, 0.062, 9),
}

cv2.imwrite(str(out / 'original.webp'), img, [cv2.IMWRITE_WEBP_QUALITY, 96])

for name, (xf, yf, wf, hf, radius) in candidates.items():
    x0, y0 = int(w * xf), int(h * yf)
    x1, y1 = int(w * (xf + wf)), int(h * (yf + hf))
    mask = np.zeros((h, w), dtype=np.uint8)
    # Rounded/softened mask avoids a visibly rectangular repair boundary.
    cv2.rectangle(mask, (x0, y0), (x1, y1), 255, -1)
    k = max(3, int(min(wf*w, hf*h) * 0.18) | 1)
    mask = cv2.GaussianBlur(mask, (k, k), 0)
    mask = np.where(mask > 42, 255, 0).astype(np.uint8)
    cleaned = cv2.inpaint(img, mask, radius, cv2.INPAINT_TELEA)
    cv2.imwrite(str(out / f'{name}.webp'), cleaned, [cv2.IMWRITE_WEBP_QUALITY, 96])

print({'width': w, 'height': h, 'candidates': list(candidates), 'out': str(out)})
