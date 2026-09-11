from pathlib import Path
import json,re,sys

root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
errors=[]

def fail(msg): errors.append(msg)

def read(rel):
    p=root/rel
    if not p.exists():
        fail(f'missing: {rel}')
        return ''
    return p.read_text(encoding='utf-8',errors='replace')

catalog_path=root/'assets/generated/cases-index.json'
if not catalog_path.exists():
    fail('missing generated catalog')
    catalog={}
else:
    catalog=json.loads(catalog_path.read_text(encoding='utf-8'))

expected={'totalCases':110,'freeCount':10,'premiumCount':100,'volume1Count':50,'volume2Count':50}
for key,value in expected.items():
    if catalog.get(key)!=value: fail(f'{key}: expected {value}, got {catalog.get(key)}')

cases=catalog.get('cases',[])
nums={int(str(c.get('number','0'))) for c in cases if str(c.get('number','')).isdigit()}
for n in range(1,111):
    if n not in nums: fail(f'catalog missing case number {n}')
for n in range(101,111):
    matches=list((root/'delo').glob(f'{n:03d}-*')) if (root/'delo').exists() else []
    seo=list((root/'ru/cases').glob(f'{n:03d}-*')) if (root/'ru/cases').exists() else []
    if len(matches)!=1: fail(f'expected one delo directory for {n}, got {len(matches)}')
    if len(seo)!=1: fail(f'expected one ru/cases directory for {n}, got {len(seo)}')

new_ids={
'web_v2r2_101_room_241','web_v2r2_102_double_badge','web_v2r2_103_recorder_source',
'web_v2r2_104_shifted_clock','web_v2r2_105_ocr_error','web_v2r2_106_token_route',
'web_v2r2_107_blackout_photo','web_v2r2_108_printer_stripe','web_v2r2_109_future_map',
'web_v2r2_110_radio_silence'}
present={str(c.get('id','')) for c in cases}
for case_id in sorted(new_ids-present): fail(f'new Volume II case missing: {case_id}')

config=read(Path('assets/paid-access-config.js'))
required_config=[
"volume1:{label:'Том I',priceRub:199,caseCount:50}",
"volume2:{label:'Том II',priceRub:199,caseCount:50}",
"volume_bundle_1_2:{label:'Том I + Том II',priceRub:299,caseCount:100",
"tokenStorageKey:'mysterylogic:volume1:access-token'",
]
for needle in required_config:
    if needle not in config: fail(f'paid-access config missing: {needle}')

store=read(Path('tom-1/index.html'))
for product in ['volume1','volume2','volume_bundle_1_2']:
    if f'data-volume-product="{product}"' not in store: fail(f'tom-1 missing selector for {product}')
for needle in ['Том I','Том II','199 ₽','299 ₽','10']:
    if needle not in store: fail(f'tom-1 missing expected launch copy: {needle}')
for stale in ['Том II готовится','Продажи ещё не открыты','100 расследований в одном томе']:
    if stale in store: fail(f'tom-1 still contains stale safe-release copy: {stale}')

core=[
'index.html','dela/index.html','kto-vret/index.html','kto-vret-igra/index.html','tom-1/index.html',
'detektivnye-igry-onlayn/index.html','detektivnye-igry-dlya-odnogo/index.html',
'detektivnye-igry-dlya-dvoih/index.html','ru/besplatnye-detektivnye-dela/index.html']
stale_patterns=[
(re.compile(r'\b15\s+(?:бесплатн|дел\s+(?:доступ|можно)|полноценных\s+дел)',re.I),'15-free'),
(re.compile(r'\b85\s+(?:дел|расследован|дополнительн)',re.I),'85-paid'),
(re.compile(r'перв(?:ые|ых)\s+15\s+(?:дел|расследован)',re.I),'first-15'),
(re.compile(r'(?<!\d)99\s*₽',re.I),'standalone-99'),
]
for rel in core:
    text=read(Path(rel))
    for pattern,label in stale_patterns:
        if pattern.search(text): fail(f'{rel}: stale {label} copy')

# Navigation and reusable Who Lied copy must not reintroduce the old offer.
for rel in ['assets/logic-sitewide.js','assets/review-admin.js','ktovret-game/assets/dossier-nav.js']:
    p=root/rel
    if not p.exists(): continue
    text=p.read_text(encoding='utf-8',errors='replace')
    if re.search(r'15\s+бесплатных\s+дел|85\s+дел|Открыть\s+ещ[ёе]\s+85',text,re.I):
        fail(f'{rel}: stale shared Who Lied offer copy')

# Ensure premium pages are split exactly 50/50.
v1=[c for c in cases if c.get('productId')=='volume1']
v2=[c for c in cases if c.get('productId')=='volume2']
if len(v1)!=50 or len(v2)!=50: fail(f'volume split is {len(v1)} + {len(v2)}, expected 50 + 50')

# New cases must be structurally deeper than the rejected one-step supplement.
for c in cases:
    if c.get('id') not in new_ids: continue
    legacy=Path(c.get('legacyPath',''))/'index.html'
    if not (root/legacy).exists(): fail(f'missing rendered new case: {legacy}')

if errors:
    print('FULL VOLUME II LAUNCH VALIDATION FAILED')
    for e in errors: print(f' - {e}')
    raise SystemExit(1)
print(json.dumps({'ok':True,**expected,'newCases':10,'prices':{'volume1':199,'volume2':199,'bundle':299}},ensure_ascii=False,indent=2))
