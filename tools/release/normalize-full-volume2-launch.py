from pathlib import Path
import sys

root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()

patches={
'assets/logic-sitewide.js':[
('Таких коротких расследований — 100.','В серии — 110 расследований.'),
('15 дел доступны бесплатно. Если формат понравился, ещё 85 открываются за 99 ₽ одной покупкой без подписки. Можно решать самому, вдвоём или читать условие вслух семье.','10 дел доступны бесплатно. Дальше — Том I и Том II: по 50 расследований за 199 ₽ каждый, или оба тома за 299 ₽ без подписки. Можно решать самому, вдвоём или читать условие вслух семье.'),
('data-who-lied-cta="paid_99"','data-who-lied-cta="paid_volumes"'),
('Открыть ещё 85 — 99 ₽','Выбрать томы →'),
],
'assets/review-admin.js':[
("catalog: '15 бесплатных дел'","catalog: '10 бесплатных дел'"),
],
'ktovret-game/assets/dossier-nav.js':[
('15 бесплатных дел','10 бесплатных дел'),
],
'tom-1/index.html':[
('Экономия 99 ₽ относительно покупки по отдельности.','Выгоднее покупки двух томов по отдельности.'),
('Цифровой доступ к полному первому тому: 100 логических расследований, из которых 15 доступны бесплатно, а 85 открываются одной покупкой.','Цифровой доступ к двум платным томам Mystery Logic: по 50 расследований в каждом. 10 стартовых дел доступны бесплатно.'),
('"name":"Mystery Logic — Первый том «Кто врёт?»"','"name":"Mystery Logic — Том I и Том II «Кто врёт?»"'),
('"price":"99"','"price":"299"'),
('https://valera2872.github.io/ktovret-web/tom-1/','https://mysterylogic.com/tom-1/'),
],
}

changed=[]
for rel,repls in patches.items():
    p=root/rel
    if not p.exists():
        raise SystemExit(f'missing normalization target: {rel}')
    text=p.read_text(encoding='utf-8')
    before=text
    for old,new in repls:
        text=text.replace(old,new)
    if text!=before:
        p.write_text(text,encoding='utf-8')
        changed.append(rel)

# Exact user-facing commercial phrases. Do not touch unrelated numbers such as
# "10–15 минут" or case numbers/codes containing 15/85/99.
html_repls=[
('15 бесплатных законченных дел','10 бесплатных законченных дел'),
('15 бесплатных дел','10 бесплатных дел'),
('15 бесплатных расследований','10 бесплатных расследований'),
('15 дел доступны бесплатно','10 дел доступны бесплатно'),
('15 дел доступны без покупки','10 дел доступны без покупки'),
('15 дел можно пройти бесплатно','10 дел можно пройти бесплатно'),
('15 дел бесплатно','10 дел бесплатно'),
('Первые 15 дел','Первые 10 дел'),
('первые 15 дел','первые 10 дел'),
('Первые 15 расследований','Первые 10 расследований'),
('первые 15 расследований','первые 10 расследований'),
('>85</strong><p>дополнительных дел<br>в полном Томе', '>50</strong><p>дел<br>в полном Томе'),
('85 дополнительных дел','50 дел'),
]
for p in root.rglob('*.html'):
    parts=set(p.relative_to(root).parts)
    if parts & {'.git','node_modules','old.bac','artifacts','tests'}: continue
    text=p.read_text(encoding='utf-8',errors='replace')
    before=text
    for old,new in html_repls:
        text=text.replace(old,new)
    if text!=before:
        p.write_text(text,encoding='utf-8')
        changed.append(str(p.relative_to(root)))

print(f'full-launch copy normalized in {len(set(changed))} files')
