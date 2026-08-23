#!/usr/bin/env python3
from pathlib import Path
import os
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

cv2.imwrite(str(out / 'original.webp'), img, [cv2.IMWRITE_WEBP_QUALITY, 96])

# Keep the inpaint alternatives for audit comparison only. They are not used
# as the final asset because smooth wood makes any synthetic fill too visible.
candidates = {
    'a-tight': (0.786, 0.742, 0.060, 0.043, 5),
    'b-medium': (0.780, 0.736, 0.072, 0.052, 7),
    'c-wide': (0.775, 0.730, 0.083, 0.062, 9),
}
for name, (xf, yf, wf, hf, radius) in candidates.items():
    x0, y0 = int(w * xf), int(h * yf)
    x1, y1 = int(w * (xf + wf)), int(h * (yf + hf))
    mask = np.zeros((h, w), dtype=np.uint8)
    cv2.rectangle(mask, (x0, y0), (x1, y1), 255, -1)
    k = max(3, int(min(wf*w, hf*h) * 0.18) | 1)
    mask = cv2.GaussianBlur(mask, (k, k), 0)
    mask = np.where(mask > 42, 255, 0).astype(np.uint8)
    cleaned = cv2.inpaint(img, mask, radius, cv2.INPAINT_TELEA)
    cv2.imwrite(str(out / f'{name}.webp'), cleaned, [cv2.IMWRITE_WEBP_QUALITY, 96])

# Final candidate: a natural 16:9 recrop that removes the ambiguous object at
# the far right of the desk while retaining the phone, cup, notebook and door.
# Source is 1600x900; ratios make the transform deterministic.
x0 = 0
y0 = round(h * (62 / 900))
x1 = round(w * (1380 / 1600))
y1 = round(h * (838 / 900))
recrop = img[y0:y1, x0:x1]
recrop = cv2.resize(recrop, (w, h), interpolation=cv2.INTER_LANCZOS4)
final_path = out / 'd-recrop-clean.webp'
cv2.imwrite(str(final_path), recrop, [cv2.IMWRITE_WEBP_QUALITY, 92])

if os.environ.get('APPLY_CLEAN') == '1':
    cv2.imwrite(str(src), recrop, [cv2.IMWRITE_WEBP_QUALITY, 92])
    print({'applied': str(src), 'width': w, 'height': h})
else:
    print({'width': w, 'height': h, 'candidates': [*candidates, 'd-recrop-clean'], 'out': str(out)})
