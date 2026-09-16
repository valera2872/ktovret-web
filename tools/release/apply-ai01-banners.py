from pathlib import Path
import base64
import hashlib
import struct
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()

EXPECTED_ASSETS = {
    'ai01-home-banner.webp': ('36beb19bbfbfc8d5c94f961ba4667ffb00726b52f88a5b0939452dcb073529c2', 1200, 400, 66958),
    'ai01-mobile-banner.webp': ('07d9e5aa0617805521945e1d84304d0816a35d84be9d57f8ce6241c141aca6fb', 360, 640, 32632),
}
HOME_PARTS = [f'home.fixed0{i}.b64' for i in range(1, 7)]
MOBILE_PARTS = [f'mobile.fixed0{i}.b64' for i in range(1, 4)]


def read_parts(names):
    source = ''.join((root / 'content' / 'ai01-approved' / name).read_text(encoding='utf-8').strip() for name in names)
    return base64.b64decode(source, validate=True)


def validate_webp(name, data, expected_sha, expected_width, expected_height, expected_size):
    if len(data) != expected_size:
        raise SystemExit(f'{name}: expected {expected_size} bytes, got {len(data)}')
    if len(data) < 30 or data[:4] != b'RIFF' or data[8:12] != b'WEBP':
        raise SystemExit(f'{name}: invalid WebP/RIFF header')
    declared_size = struct.unpack('<I', data[4:8])[0] + 8
    if declared_size != len(data):
        raise SystemExit(f'{name}: RIFF declares {declared_size} bytes, file has {len(data)}')
    if data[12:16] != b'VP8 ' or data[23:26] != b'\x9d\x01\x2a':
        raise SystemExit(f'{name}: unexpected WebP encoding')
    width = struct.unpack('<H', data[26:28])[0] & 0x3FFF
    height = struct.unpack('<H', data[28:30])[0] & 0x3FFF
    if (width, height) != (expected_width, expected_height):
        raise SystemExit(f'{name}: expected {expected_width}x{expected_height}, got {width}x{height}')
    actual_sha = hashlib.sha256(data).hexdigest()
    if actual_sha != expected_sha:
        raise SystemExit(f'{name}: SHA-256 mismatch: {actual_sha}')
    print(f'{name}: OK {width}x{height} {len(data)} bytes sha256={actual_sha}')


def rebuild_assets():
    payloads = {
        'ai01-home-banner.webp': read_parts(HOME_PARTS),
        'ai01-mobile-banner.webp': read_parts(MOBILE_PARTS),
    }
    assets = root / 'assets'
    assets.mkdir(exist_ok=True)
    for name, data in payloads.items():
        validate_webp(name, data, *EXPECTED_ASSETS[name])
        (assets / name).write_bytes(data)


rebuild_assets()
print('AI-01 approved artwork restored')
