from pathlib import Path
import json,re,shutil,sys
from bs4 import BeautifulSoup
root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()

# 1) Remove rejected supplemental Who Lied cases 101-110 physically.
for base in [root/'delo', root/'ru'/'cases']:
    if not base.exists(): continue
    for d in list(base.iterdir()):
        if d.is_dir() and re.match(r'^(10[1-9]|110)-', d.name):
            shutil.rmtree(d)

# 2) Generated catalog: keep exactly 100 real cases (10 free + 50 v1 + 40 v2 draft/prepared).
for name in ['cases-index.json']:
    p=root/'assets'/'generated'/name
    data=json.loads(p.read_text())
    kept=[]
    removed_ids=set()
    for c in data.get('cases',[]):
        try: n=int(str(c.get('number','0')))
        except: n=0
        if n and n<=100: kept.append(c)
        else: removed_ids.add(c.get('id'))
    data['cases']=kept
    data['totalCases']=len(kept)
    data['freeCount']=sum(1 for c in kept if c.get('isFree'))
    data['premiumCount']=sum(1 for c in kept if not c.get('isFree'))
    data['volume1Count']=sum(1 for c in kept if c.get('productId')=='volume1')
    data['volume2Count']=sum(1 for c in kept if c.get('productId')=='volume2')
    cols=[]
    for col in data.get('collections',[]):
        ids=[x for x in col.get('caseIds',[]) if x not in removed_ids]
        if col.get('id')=='web_volume2_new_2026_09':
            continue
        col['caseIds']=ids
        cols.append(col)
    data['collections']=cols
    p.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))

p=root/'assets'/'generated'/'cases-index.js'
s=p.read_text()
prefix='window.KtoVretCatalog='
obj=json.loads(s[len(prefix):].rstrip().rstrip(';'))
kept=[]; removed_ids=set()
for c in obj.get('cases',[]):
    try:n=int(str(c.get('number','0')))
    except:n=0
    if n and n<=100: kept.append(c)
    else: removed_ids.add(c.get('id'))
obj['cases']=kept
obj['totalCases']=len(kept); obj['freeCount']=sum(c.get('isFree') for c in kept); obj['premiumCount']=sum(not c.get('isFree') for c in kept)
obj['volume1Count']=sum(c.get('productId')=='volume1' for c in kept); obj['volume2Count']=sum(c.get('productId')=='volume2' for c in kept)
cols=[]
for col in obj.get('collections',[]):
    if col.get('id')=='web_volume2_new_2026_09': continue
    col['caseIds']=[x for x in col.get('caseIds',[]) if x not in removed_ids]
    cols.append(col)
obj['collections']=cols
p.write_text(prefix+json.dumps(obj,ensure_ascii=False,separators=(',',':'))+';')

# import report reflects runtime tree, not planned 110-case target.
p=root/'assets'/'generated'/'import-report.json'
r=json.loads(p.read_text())
updates={'supplementalCases':0,'totalCases':100,'freeCases':10,'premiumCases':90,'volume1Cases':50,'volume2Cases':40,'seoCasePages':100,'premiumSeoTeaserPages':90,'lockedPages':90,'paidGatewayPages':90,'finalPolishCaseTitles':100,'finalSeoCasePages':100}
for k,v in updates.items():
    if k in r:r[k]=v
p.write_text(json.dumps(r,ensure_ascii=False,indent=2))

# 3) Payment config: only Volume I is sellable.
(root/'assets'/'paid-access-config.js').write_text("""window.MysteryLogicPaidAccessConfig={
  version:'2.1.0',
  endpoint:'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/case-access',
  checkoutEnabled:true,
  checkoutEndpoint:'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/create-checkout',
  paymentStatusEndpoint:'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/payment-status',
  productId:'volume1',
  products:{volume1:{label:'Том I',priceRub:199,caseCount:50}},
  tokenStorageKey:'mysterylogic:volume1:access-token',
  orderStorageKey:'mysterylogic:who-lied:last-order-id',
  requestStorageKey:'mysterylogic:who-lied:checkout-request-id'
};\n""")

# 4) Storefront page: simplify to Tom I only, keep Tom II as non-purchasable roadmap note.
p=root/'tom-1'/'index.html'
soup=BeautifulSoup(p.read_text(),'html.parser')
soup.title.string='Том I «Кто врёт?» — 50 детективных дел за 199 ₽'
md=soup.find('meta',attrs={'name':'description'})
if md: md['content']='Том I «Кто врёт?» — 50 платных детективных дел Mystery Logic за 199 ₽. 10 стартовых дел доступны бесплатно. Разовая покупка, без подписки.'
for prop,val in [('og:title','Том I «Кто врёт?» — 50 детективных дел за 199 ₽'),('og:description','50 платных расследований за 199 ₽. 10 стартовых дел доступны бесплатно. Том II готовится.')]:
    m=soup.find('meta',attrs={'property':prop})
    if m:m['content']=val
ld=soup.find('script',attrs={'type':'application/ld+json'})
if ld:
    ld.string=json.dumps({'@context':'https://schema.org','@type':'Product','name':'Mystery Logic — Том I «Кто врёт?»','description':'Цифровой доступ к 50 детективным делам Тома I. 10 стартовых дел доступны бесплатно.','brand':{'@type':'Brand','name':'Mystery Logic'},'offers':{'@type':'Offer','price':'199','priceCurrency':'RUB','availability':'https://schema.org/InStock','url':'https://mysterylogic.com/tom-1/'}},ensure_ascii=False,separators=(',',':'))
for a in soup.find_all('a',href='../tom-1/'):
    if a.get_text(strip=True)=='Тома': a.string='Том I'
hero=soup.select_one('.ref-archive-copy')
if hero:
    k=hero.select_one('.ref-kicker'); h=hero.find('h1'); pp=hero.find_all('p')
    if k:k.string='Том I · доступен сейчас'
    if h:h.string='50 платных детективных дел'
    if len(pp)>=2: pp[1].clear(); pp[1].append('Том I — 50 расследований за 199 ₽. 10 стартовых дел доступны бесплатно. Том II готовится и пока не продаётся.')
strip=soup.select_one('#volume-access')
if strip:
    stats=strip.select('.ref-access-stat')
    texts=[('10 дел','бесплатно'),('50 дел','Том I'),('199 ₽','разовая покупка')]
    for st,(strong,span) in zip(stats,texts):
        sg=st.find('strong'); sp=st.find_all('span')
        if sg: sg.string=strong
        if sp: sp[-1].string=span
    for b in strip.select('[data-volume-product="volume2"],[data-volume-product="volume_bundle_1_2"]'): b.decompose()
    summ=strip.select_one('[data-volume-selected-summary]'); sel=strip.select_one('[data-volume-selected-product]')
    if summ:summ.string='Том I · 199 ₽'
    if sel:sel.string='Том I · 50 дел · 199 ₽'
    note=strip.select_one('[data-volume-payment-note]')
    if note:note.string='Укажите e-mail и подтвердите условия перед оплатой.'
trial=soup.select_one('.ref-volume-trial-copy')
if trial:
    paras=trial.find_all('p')
    if len(paras)>=2: paras[1].string='Пройдите стартовую коллекцию и убедитесь, что формат вам подходит. После неё доступен Том I — 50 расследований.'
arch=soup.select_one('[data-volume-premium-archives]')
if arch:
    head=arch.select_one('.ref-volume-section-head')
    if head:
        h=head.find('h2'); ps=head.find_all('p')
        if h:h.string='Том I уже доступен'
        if len(ps)>=2: ps[1].string='50 расследований за 199 ₽. Том II находится в подготовке и появится после завершения новых дел.'
    for card in arch.select('[data-volume-card="volume_bundle_1_2"]'): card.decompose()
    v2=arch.select_one('[data-volume-card="volume2"]')
    if v2:
        del v2['data-volume-card']
        top=v2.select_one('.ref-volume-archive-top')
        if top:
            spans=top.find_all('span')
            if len(spans)>1:spans[1].string='готовится'
        strong=v2.find('strong')
        if strong: strong.string='Продажи ещё не открыты'
        para=v2.find('p')
        if para: para.string='Новые дела Тома II сейчас проходят редакционную подготовку.'
close=soup.select_one('[data-volume-closing-cta]')
if close:
    k=close.select_one('.ref-kicker'); h=close.find('h2'); p1=close.find('p'); action=close.select_one('.ref-volume-close-action')
    if k:k.string='Том I'
    if h:h.string='Продолжите на 50 расследований.'
    if p1:p1.string='50 дел за 199 ₽. Разовая покупка, без подписки и повторных списаний.'
    if action:
        st=action.find('strong'); btn=action.find('a',attrs={'data-volume-scroll-buy':True})
        if st: st.clear(); st.append('Том I · 50 дел · 199 ₽')
        if btn: btn.string='Купить Том I ↑'
html=str(soup)
repls={
'Один том открывает 50 платных дел за 199 ₽. Комплект Том I + Том II открывает 100 платных дел за 299 ₽. Десять стартовых дел остаются бесплатными.':'Покупка Тома I открывает 50 платных дел за 199 ₽. Десять стартовых дел остаются бесплатными. Том II пока не продаётся.',
'Да. Том I и Том II продаются отдельно по 199 ₽. Комплект двух томов стоит 299 ₽.':'Сейчас доступен только Том I за 199 ₽. Том II появится после завершения редакционной подготовки.',
'После подтверждения платежа сервер активирует доступ к делам выбранного тома. При покупке комплекта активируются оба тома.':'После подтверждения платежа сервер активирует доступ к 50 делам Тома I.',
'Тома «Кто врёт?» — 100 платных детективных задач':'Том I «Кто врёт?» — 50 платных детективных задач',
'10 стартовых дел доступны бесплатно. Том I и Том II содержат по 50 расследований. Для вопросов об оплате и восстановлении доступа: support@mysterylogic.com':'10 стартовых дел доступны бесплатно. Том I содержит 50 расследований и стоит 199 ₽. Том II готовится. Для вопросов об оплате и восстановлении доступа: support@mysterylogic.com',
'Два тома':'Том I','Тома':'Том I',
}
for a,b in repls.items(): html=html.replace(a,b)
p.write_text(html)

# 5) Patch premium case pages: Volume I can be purchased; Volume II is restoration-only/no sale.
for base in [root/'delo', root/'ru'/'cases']:
    if not base.exists(): continue
    for f in base.glob('*/index.html'):
        txt=f.read_text()
        if 'data-product-id="volume2"' in txt or 'data-paid-product="volume2"' in txt:
            txt=txt.replace('href="../../tom-1/?product=volume2">Открыть Том II</a>','href="../../tom-1/">Том II готовится</a>')
            txt=txt.replace('href="../../../tom-1/?product=volume2">Открыть Том II</a>','href="../../../tom-1/">Том II готовится</a>')
            txt=re.sub(r'Для новой покупки откройте страницу томов — там можно купить один том за 199 ₽ или два тома за 299 ₽\.', 'Новые продажи Тома II пока не открыты. Если доступ был куплен раньше, его можно проверить здесь.', txt)
            txt=txt.replace('>Выбрать том</a>','>О Томе II</a>').replace('>Открыть Том II</a>','>Том II готовится</a>')
        elif 'data-product-id="volume1"' in txt or 'data-paid-product="volume1"' in txt:
            txt=re.sub(r'Для новой покупки откройте страницу томов — там можно купить один том за 199 ₽ или два тома за 299 ₽\.', 'Том I можно купить за 199 ₽ одной разовой оплатой без подписки.', txt)
            txt=txt.replace('>Выбрать том</a>','>Купить Том I</a>')
        f.write_text(txt)

# 6) Sitewide outdated offers, keeping Last Aria 299/249 untouched.
files={
'assets/logic-sitewide.js':[
('Таких коротких расследований — 100.','В бесплатной коллекции — 10 коротких расследований.'),
('15 дел доступны бесплатно. Если формат понравился, ещё 85 открываются за 99 ₽ одной покупкой без подписки.','10 дел доступны бесплатно. Если формат понравился, Том I открывает ещё 50 расследований за 199 ₽ одной покупкой без подписки.'),
('Открыть ещё 85 — 99 ₽','Открыть Том I — 199 ₽'),('data-who-lied-cta="paid_99"','data-who-lied-cta="paid_volume1"')],
'assets/review-admin.js':[('15 бесплатных дел','10 бесплатных дел')],
'ktovret-game/assets/dossier-nav.js':[('15 бесплатных дел','10 бесплатных дел')],
}
for rel, reps in files.items():
    p=root/rel; t=p.read_text()
    for a,b in reps:t=t.replace(a,b)
    p.write_text(t)
page_repls={
'ru/besplatnye-detektivnye-dela/index.html':[
('Все 110 дел','Все бесплатные дела'),('100 платных дел в двух томах','Продолжение: Том I'),
('В общем каталоге Mystery Logic 110 активных дел: эти 10 доступны бесплатно, а ещё 100 расследований разделены на Том I и Том II по 50 дел. Каждый том стоит 199 ₽, комплект двух томов — 299 ₽.','Эти 10 дел доступны бесплатно. Если формат понравился, Том I открывает ещё 50 расследований за 199 ₽. Том II готовится.'),
('Перейти в каталог 110 дел','Перейти в бесплатный каталог'),('Выбрать том или комплект','Открыть Том I')],
'detektivnye-igry-dlya-dvoih/index.html':[
('В «Кто врёт?» 10 дел доступны бесплатно. Ещё 100 расследований разделены на два платных тома по 50: каждый том стоит 199 ₽, оба вместе — 299 ₽.','В «Кто врёт?» 10 дел доступны бесплатно. Том I содержит ещё 50 расследований и стоит 199 ₽. Том II готовится.'),('Посмотреть тома','Открыть Том I')],
'detektivnye-igry-dlya-odnogo/index.html':[
('«Кто врёт?» — отдельная игровая линия Mystery Logic: 110 коротких расследований, первые 10 доступны бесплатно. Ещё 100 дел разделены на два платных тома по 50.','«Кто врёт?» — отдельная игровая линия Mystery Logic: 10 коротких расследований доступны бесплатно, а Том I открывает ещё 50 дел. Том II готовится.')],
}
for rel,reps in page_repls.items():
    p=root/rel;t=p.read_text()
    for a,b in reps:t=t.replace(a,b)
    p.write_text(t)
for rel in ['index.html','dela/index.html','kto-vret/index.html','kto-vret-igra/index.html']:
    p=root/rel;t=p.read_text()
    replacements=[
        ('100 платных расследований в двух томах по 50','50 платных расследований в Томе I'),('100 платных детективных дел','50 платных детективных дел Тома I'),('100 платных дел','50 платных дел Тома I'),('110 коротких детективных дел','60 доступных сейчас детективных дел'),('110 активных дел','100 подготовленных дел'),('110 дел','100 дел'),('50 + 50','50'),('два платных тома','Том I'),('два тома','Том I'),('оба тома · 100 дел','Том I · 50 дел'),('оба тома','Том I'),('оба вместе — 299 ₽','Том I — 199 ₽'),('или оба за 299 ₽','за 199 ₽'),('Комплект двух томов — 299 ₽.','Том II готовится.'),('Том отдельно 199 ₽ · оба 299 ₽','Том I · 199 ₽'),('href="../tom-1/?product=volume_bundle_1_2"','href="../tom-1/"'),('Посмотреть 100 платных дел','Открыть Том I · 50 дел'),('Выбрать томы →','Открыть Том I →'),('Выбрать томы','Открыть Том I'),('Посмотреть тома','Открыть Том I'),
    ]
    for a,b in replacements:t=t.replace(a,b)
    p.write_text(t)

p=root/'sitemap.xml'; t=p.read_text()
for n in range(101,111):
    t=re.sub(r'<url>\s*<loc>https://mysterylogic\.com/(?:ru/cases|delo)/%03d-[^<]+</loc>.*?</url>\s*' % n,'',t,flags=re.S)
p.write_text(t)
print('patched')
