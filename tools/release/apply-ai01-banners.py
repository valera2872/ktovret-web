from pathlib import Path
import base64
import hashlib
import struct
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()

EXPECTED_ASSETS = {
    'ai01-home-banner.webp': ('10b470028546a3de6bf82aff6d9c70821574e06effb3f2a3e9f91a137c992f4b', 1200, 400),
    'ai01-mobile-banner.webp': ('294692a5f1d4e9f344a7f457938f9f1a4ee7cb531845040666fdf47f079bac41', 360, 640),
}


def read_part(name):
    return (root / 'content' / 'ai01-approved' / name).read_text(encoding='utf-8').strip()


def rebuild_assets():
    # The text parts are the exact base64 form of the approved corrected WebPs.
    # Two source chunks lost their first character when the historical binary was
    # recovered through GitHub; keep the missing characters explicit and guarded
    # by the final SHA-256 validation below.
    home_b64 = (
        read_part('home.part01.b64')
        + read_part('home.part02.b64')
        + read_part('home.part03.b64')
        + 'X' + read_part('home.part04.b64')
        + 'C' + read_part('home.part05.b64')
        + read_part('home.part06.b64')
    )
    mobile_b64 = (
        read_part('mobile.head01.b64')
        + read_part('mobile.head02.b64')
        + read_part('mobile.head03.b64')
        + read_part('mobile.head04.b64')
        + 'L' + read_part('mobile.part02.b64')
        + read_part('mobile.part02-tail.b64')
        + read_part('mobile.part03.b64')
    )
    assets = root / 'assets'
    assets.mkdir(exist_ok=True)
    (assets / 'ai01-home-banner.webp').write_bytes(base64.b64decode(home_b64, validate=True))
    (assets / 'ai01-mobile-banner.webp').write_bytes(base64.b64decode(mobile_b64, validate=True))


def validate_webp(name, expected_sha, expected_width, expected_height):
    path = root / 'assets' / name
    data = path.read_bytes()
    if len(data) < 30 or data[:4] != b'RIFF' or data[8:12] != b'WEBP':
        raise SystemExit(f'{name}: invalid WebP/RIFF header')
    declared_size = struct.unpack('<I', data[4:8])[0] + 8
    if declared_size != len(data):
        raise SystemExit(f'{name}: truncated WebP: RIFF declares {declared_size} bytes, file has {len(data)}')
    if data[12:16] != b'VP8 ' or data[23:26] != b'\x9d\x01\x2a':
        raise SystemExit(f'{name}: unexpected WebP encoding; expected VP8 key frame')
    width = struct.unpack('<H', data[26:28])[0] & 0x3FFF
    height = struct.unpack('<H', data[28:30])[0] & 0x3FFF
    if (width, height) != (expected_width, expected_height):
        raise SystemExit(f'{name}: expected {expected_width}x{expected_height}, got {width}x{height}')
    actual_sha = hashlib.sha256(data).hexdigest()
    if actual_sha != expected_sha:
        raise SystemExit(f'{name}: SHA-256 mismatch: {actual_sha}')
    print(f'{name}: OK {width}x{height} {len(data)} bytes sha256={actual_sha}')


rebuild_assets()
for asset_name, (asset_sha, asset_width, asset_height) in EXPECTED_ASSETS.items():
    validate_webp(asset_name, asset_sha, asset_width, asset_height)

css_tag_home = '<link data-ai01-feature-banner rel="stylesheet" href="./assets/ai01-feature-banner.css?v=20260916ai01">'
css_tag_solo = '<link data-ai01-feature-banner rel="stylesheet" href="../assets/ai01-feature-banner.css?v=20260916ai01">'
home_banner = '''\n<section class="ml-ai01-feature ml-ai01-feature--home" aria-label="Новое бесплатное AI-расследование">\n  <a class="ml-ai01-feature-link" href="./detektivnaya-igra-s-ii/" data-ai01-feature="home">\n    <picture><source media="(max-width: 640px)" srcset="./assets/ai01-mobile-banner.webp"><img src="./assets/ai01-home-banner.webp" width="1200" height="400" loading="eager" decoding="async" alt="Восемь минут без камеры — бесплатное AI-расследование Mystery Logic: допрашивайте подозреваемых голосом или текстом"></picture>\n    <span class="ml-ai01-feature-badge">AI · бесплатно</span><span class="ml-ai01-feature-sr">Открыть расследование «Восемь минут без камеры»</span>\n  </a>\n</section>\n'''
solo_banner = '''<section class="ml-ai01-feature ml-ai01-feature--solo" aria-label="AI-расследование для одного игрока"><a class="ml-ai01-feature-link" href="../detektivnaya-igra-s-ii/" data-ai01-feature="solo"><picture><source media="(max-width: 640px)" srcset="../assets/ai01-mobile-banner.webp"><img src="../assets/ai01-home-banner.webp" width="1200" height="400" loading="eager" decoding="async" alt="Восемь минут без камеры — бесплатное AI-расследование для одного игрока"></picture><span class="ml-ai01-feature-badge">AI · бесплатно</span><span class="ml-ai01-feature-sr">Начать расследование «Восемь минут без камеры»</span></a></section>'''


def add_css(path, tag):
    source = path.read_text(encoding='utf-8')
    if 'data-ai01-feature-banner' not in source:
        source = source.replace('</head>', tag + '</head>', 1)
    path.write_text(source, encoding='utf-8')


home = root / 'index.html'
add_css(home, css_tag_home)
source = home.read_text(encoding='utf-8')
if 'data-ai01-feature="home"' not in source:
    marker = '<section class="ref-home-hero">'
    if marker not in source:
        raise SystemExit('home hero marker missing')
    source = source.replace(marker, home_banner + marker, 1)
home.write_text(source, encoding='utf-8')

solo = root / 'detektivnye-igry-dlya-odnogo' / 'index.html'
add_css(solo, css_tag_solo)
source = solo.read_text(encoding='utf-8')
if 'data-ai01-feature="solo"' not in source:
    marker = '<main class="solo407-shell solo407-hub">'
    if marker not in source:
        raise SystemExit('solo main marker missing')
    source = source.replace(marker, marker + solo_banner, 1)
solo.write_text(source, encoding='utf-8')

print('AI-01 banners applied')
