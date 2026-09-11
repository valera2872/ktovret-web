from pathlib import Path
import sys
root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
css_tag_home='<link data-ai01-feature-banner rel="stylesheet" href="./assets/ai01-feature-banner.css?v=20260911r2">'
css_tag_solo='<link data-ai01-feature-banner rel="stylesheet" href="../assets/ai01-feature-banner.css?v=20260911r2">'
home_banner='''\n<section class="ml-ai01-feature ml-ai01-feature--home" aria-label="Новое бесплатное AI-расследование">\n  <a class="ml-ai01-feature-link" href="./detektivnaya-igra-s-ii/" data-ai01-feature="home">\n    <picture><source media="(max-width: 640px)" srcset="./assets/ai01-mobile-banner.webp"><img src="./assets/ai01-home-banner.webp" width="2172" height="724" loading="eager" decoding="async" alt="Восемь минут без камеры — бесплатное AI-расследование Mystery Logic: допрашивайте подозреваемых голосом или текстом"></picture>\n    <span class="ml-ai01-feature-badge">AI · бесплатно</span><span class="ml-ai01-feature-sr">Открыть расследование «Восемь минут без камеры»</span>\n  </a>\n</section>\n'''
solo_banner='''<section class="ml-ai01-feature ml-ai01-feature--solo" aria-label="AI-расследование для одного игрока"><a class="ml-ai01-feature-link" href="../detektivnaya-igra-s-ii/" data-ai01-feature="solo"><picture><source media="(max-width: 640px)" srcset="../assets/ai01-mobile-banner.webp"><img src="../assets/ai01-home-banner.webp" width="2172" height="724" loading="eager" decoding="async" alt="Восемь минут без камеры — бесплатное AI-расследование для одного игрока"></picture><span class="ml-ai01-feature-badge">AI · бесплатно</span><span class="ml-ai01-feature-sr">Начать расследование «Восемь минут без камеры»</span></a></section>'''
def add_css(p,tag):
    s=p.read_text()
    if 'data-ai01-feature-banner' not in s:s=s.replace('</head>',tag+'</head>',1)
    p.write_text(s)
home=root/'index.html';add_css(home,css_tag_home);s=home.read_text()
if 'data-ai01-feature="home"' not in s:
    marker='<section class="ref-home-hero">'
    if marker not in s:raise SystemExit('home hero marker missing')
    s=s.replace(marker,home_banner+marker,1)
home.write_text(s)
solo=root/'detektivnye-igry-dlya-odnogo'/'index.html';add_css(solo,css_tag_solo);s=solo.read_text()
if 'data-ai01-feature="solo"' not in s:
    marker='<main class="solo407-shell solo407-hub">'
    if marker not in s:raise SystemExit('solo main marker missing')
    s=s.replace(marker,marker+solo_banner,1)
solo.write_text(s)
print('AI-01 banners applied')
