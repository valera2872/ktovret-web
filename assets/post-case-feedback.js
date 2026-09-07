(() => {
  'use strict';
  if (window.MysteryLogicPostCaseFeedback?.version) return;

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/case-feedback';
  const CLIENT_KEY_STORAGE = 'mysterylogic:challenge:client-key';
  const VERSION = 2;
  const mounted = new Set();
  let explicitContext = null;

  const labels = {
    1: 'Совсем не понравилось', 2: 'Скорее не понравилось', 3: 'Нормально',
    4: 'Понравилось', 5: 'Очень понравилось',
  };
  const likedBase = [
    ['story','Сюжет'],['evidence','Улики'],['atmosphere','Атмосфера'],
    ['deduction','Дедукция'],['finale','Развязка']
  ];
  const improveBase = [
    ['unclear_next_step','Непонятно, что делать'],['too_hard','Слишком сложно'],
    ['too_easy','Слишком легко'],['need_hints','Не хватило подсказок'],
    ['too_long','Слишком длинно'],['too_short','Слишком коротко'],
    ['weak_finale','Финал'],['technical_issue','Техническая проблема']
  ];

  const esc = (value = '') => String(value)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const randomKey = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), (v) => v.toString(16).padStart(2,'0')).join('');
  const browserKey = () => {
    let value = '';
    try { value = localStorage.getItem(CLIENT_KEY_STORAGE) || ''; } catch {}
    if (!/^[a-f0-9]{48}$/.test(value)) {
      value = randomKey();
      try { localStorage.setItem(CLIENT_KEY_STORAGE, value); } catch {}
    }
    return value;
  };

  const ensureCss = () => {
    if (document.querySelector('link[data-ml-feedback-css]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/post-case-feedback.css?v=2';
    link.dataset.mlFeedbackCss = 'true';
    document.head.appendChild(link);
  };

  const contextForPage = () => {
    if (explicitContext) return explicitContext;
    const path = location.pathname.replace(/\/+$/,'') || '/';
    if (window.KtoVretWeb?.case?.id && document.querySelector('[data-ktv-root]')) {
      const result = document.querySelector('.ktv-result,#ktv-result');
      const complete = Boolean(result && (result.querySelector('.ktv-result-lead,.ktv-first-result') || document.querySelector('.ml-global-stats')));
      return complete ? { caseId:String(window.KtoVretWeb.case.id), caseKind:'short', mode:'solo', mount:result, title:'это дело' } : null;
    }
    if (path === '/detektivnye-igry-dlya-odnogo/407' && document.querySelector('.solo407-reveal')) {
      return { caseId:'solo:407', caseKind:'premium', mode:'solo', mount:document.querySelector('[data-solo407-app]') || document.querySelector('.solo407-reveal'), title:'«Номер 407»' };
    }
    if (path.includes('/detektivnye-igry-dlya-dvoih/')) {
      const root = document.querySelector('[data-casearia-app],[data-case2317-app],[data-case407-app]');
      if (!root) return null;
      if (root.matches('[data-casearia-app]') && root.querySelector('.casearia-reveal')) {
        return { caseId:'coop:last-aria', caseKind:'premium', mode:'partner', mount:root, title:'«Последняя ария»' };
      }
      if (root.matches('[data-case407-app]') && root.querySelector('.case2317-reveal')) {
        return { caseId:'coop:407', caseKind:'premium', mode:'partner', mount:root, title:'«Номер 407»' };
      }
      if (root.matches('[data-case2317-app]') && root.querySelector('.case2317-reveal')) {
        return { caseId:'coop:2317', caseKind:'premium', mode:'partner', mount:root, title:'«23:17»' };
      }
    }
    const aiRoot = document.querySelector('[data-ai-detective]');
    const resolution = aiRoot?.querySelector('[data-view="resolution"]:not([hidden])');
    if (aiRoot && resolution) {
      return { caseId:'AI-01', caseKind:'ai', mode:'ai', mount:resolution, title:'AI-расследование' };
    }
    return null;
  };

  const modeLiked = (mode) => {
    const extra = mode === 'partner' ? [['teamplay','Игра вдвоём']]
      : mode === 'ai' ? [['characters','Персонажи'],['interrogation','Свободный допрос']]
      : mode === 'short' ? [['pace','Короткий формат']] : [];
    return [...likedBase, ...extra];
  };
  const pills = (items, attr) => items.map(([id,label]) => `<button class="ml-feedback-pill" type="button" data-${attr}="${esc(id)}" aria-pressed="false">${esc(label)}</button>`).join('');

  const track = (eventName, context, extra = {}) => {
    try { window.MysteryLogicFunnel?.track?.(eventName, { case_id:context.caseId, case_kind:context.caseKind, mode:context.mode, ...extra }, 'post-case-feedback'); } catch {}
  };

  const mount = (context) => {
    if (!context?.caseId || !context.mount || mounted.has(context.caseId) || document.querySelector(`[data-ml-feedback-case="${CSS.escape(context.caseId)}"]`)) return;
    mounted.add(context.caseId);
    ensureCss();
    const card = document.createElement('section');
    card.className = 'ml-feedback-card';
    card.dataset.mlFeedbackCase = context.caseId;
    card.innerHTML = `
      <p class="ml-feedback-kicker">После расследования · 30 секунд</p>
      <h3>Как вам ${esc(context.title || 'расследование')}?</h3>
      <p class="ml-feedback-lead">Помогите нам понять, что работает, а что нужно улучшить. Оценка и ответы пойдут в продуктовую аналитику Mystery Logic.</p>
      <div class="ml-feedback-section">
        <span class="ml-feedback-label">Общая оценка</span>
        <div class="ml-feedback-stars" role="radiogroup" aria-label="Оценка расследования">${[1,2,3,4,5].map((n) => `<button class="ml-feedback-star" type="button" data-feedback-rating="${n}" role="radio" aria-checked="false" aria-label="${n} из 5">★</button>`).join('')}</div>
        <div class="ml-feedback-rating-caption" data-feedback-rating-caption>Выберите от 1 до 5 звёзд</div>
      </div>
      <div class="ml-feedback-grid">
        <div class="ml-feedback-section"><span class="ml-feedback-label">Сложность</span><div class="ml-feedback-pills">${pills([['too_easy','Слишком легко'],['just_right','В самый раз'],['too_hard','Слишком сложно']],'feedback-difficulty')}</div></div>
        <div class="ml-feedback-section"><span class="ml-feedback-label">Хотите ещё таких расследований?</span><div class="ml-feedback-pills">${pills([['yes','Да'],['maybe','Возможно'],['no','Нет']],'feedback-more')}</div></div>
      </div>
      <div class="ml-feedback-section"><span class="ml-feedback-label">Что понравилось? <small>Можно несколько</small></span><div class="ml-feedback-pills">${pills(modeLiked(context.mode),'feedback-liked')}</div></div>
      <div class="ml-feedback-section"><span class="ml-feedback-label">Что стоит улучшить? <small>Можно несколько</small></span><div class="ml-feedback-pills">${pills(improveBase,'feedback-improve')}</div></div>
      <label class="ml-feedback-section"><span class="ml-feedback-label" data-feedback-comment-label>Хотите добавить пару слов? <small>Необязательно</small></span><textarea data-feedback-comment maxlength="2000" placeholder="Что особенно запомнилось или что помешало получить удовольствие?"></textarea></label>
      <p class="ml-feedback-tags-note">Не указывайте телефон, e-mail и другие личные данные.</p>
      <details class="ml-feedback-publish"><summary>Можно ли использовать мой комментарий как отзыв на сайте?</summary><div class="ml-feedback-publish-body"><label><span class="ml-feedback-label">Имя или псевдоним <small>необязательно</small></span><input type="text" data-feedback-name maxlength="80" autocomplete="nickname" placeholder="Например: Алексей"></label><label class="ml-feedback-check"><input type="checkbox" data-feedback-publish><span>Разрешаю после модерации опубликовать мой комментарий и указанный псевдоним на Mystery Logic. Оценка и внутренняя обратная связь сохраняются независимо от этого выбора.</span></label></div></details>
      <div class="ml-feedback-actions"><button class="ml-feedback-submit" type="button" data-feedback-submit disabled>Отправить</button><button class="ml-feedback-skip" type="button" data-feedback-skip>Не сейчас</button></div>
      <p class="ml-feedback-status" data-feedback-status role="status" aria-live="polite"></p>`;
    context.mount.appendChild(card);

    let rating = 0, difficulty = '', wantMore = '', busy = false;
    const liked = new Set(), improve = new Set();
    const submit = card.querySelector('[data-feedback-submit]');
    const status = card.querySelector('[data-feedback-status]');
    const comment = card.querySelector('[data-feedback-comment]');
    const sync = () => { submit.disabled = busy || rating < 1; };
    const toggleSingle = (selector, value, setter) => {
      setter(value);
      card.querySelectorAll(selector).forEach((node) => { const on = node.dataset[selector.includes('difficulty') ? 'feedbackDifficulty' : 'feedbackMore'] === value; node.classList.toggle('is-on', on); node.setAttribute('aria-pressed', String(on)); });
    };
    card.querySelectorAll('[data-feedback-rating]').forEach((button) => button.addEventListener('click', () => {
      rating = Number(button.dataset.feedbackRating || 0);
      card.querySelectorAll('[data-feedback-rating]').forEach((node) => { const n=Number(node.dataset.feedbackRating||0); node.classList.toggle('is-on',n<=rating); node.setAttribute('aria-checked',String(n===rating)); });
      card.querySelector('[data-feedback-rating-caption]').textContent = labels[rating] || '';
      const label = card.querySelector('[data-feedback-comment-label]');
      if (label) label.innerHTML = rating <= 3 ? 'Что подвело или что нам улучшить? <small>Необязательно</small>' : 'Что особенно понравилось? <small>Необязательно</small>';
      sync();
    }));
    card.querySelectorAll('[data-feedback-difficulty]').forEach((button) => button.addEventListener('click', () => {
      const value = String(button.dataset.feedbackDifficulty || ''); difficulty = difficulty === value ? '' : value;
      card.querySelectorAll('[data-feedback-difficulty]').forEach((node) => { const on=node.dataset.feedbackDifficulty===difficulty; node.classList.toggle('is-on',on); node.setAttribute('aria-pressed',String(on)); });
    }));
    card.querySelectorAll('[data-feedback-more]').forEach((button) => button.addEventListener('click', () => {
      const value = String(button.dataset.feedbackMore || ''); wantMore = wantMore === value ? '' : value;
      card.querySelectorAll('[data-feedback-more]').forEach((node) => { const on=node.dataset.feedbackMore===wantMore; node.classList.toggle('is-on',on); node.setAttribute('aria-pressed',String(on)); });
    }));
    const bindMulti = (selector,set,datasetKey) => card.querySelectorAll(selector).forEach((button) => button.addEventListener('click', () => {
      const value=String(button.dataset[datasetKey]||''); if(!value)return; set.has(value)?set.delete(value):set.add(value); const on=set.has(value); button.classList.toggle('is-on',on); button.setAttribute('aria-pressed',String(on));
    }));
    bindMulti('[data-feedback-liked]',liked,'feedbackLiked'); bindMulti('[data-feedback-improve]',improve,'feedbackImprove');

    card.querySelector('[data-feedback-skip]')?.addEventListener('click', () => { track('review_skip',context); card.remove(); });
    submit.addEventListener('click', async () => {
      if (busy || rating < 1) return; busy=true; sync(); status.textContent='Сохраняем обратную связь…';
      try {
        const response = await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
          browserKey:browserKey(),caseId:context.caseId,caseKind:context.caseKind,mode:context.mode,rating,difficulty,wantMore,
          likedTags:[...liked],improvementTags:[...improve],comment:String(comment?.value||'').trim(),
          displayName:String(card.querySelector('[data-feedback-name]')?.value||'').trim(),
          publicationConsent:Boolean(card.querySelector('[data-feedback-publish]')?.checked),sourcePath:location.pathname,feedbackVersion:VERSION
        }),cache:'no-store',credentials:'omit'});
        let body={}; try{body=await response.json();}catch{}
        if(!response.ok) throw new Error(body.error||`http_${response.status}`);
        track('review_submit',context,{rating,difficulty:difficulty||'none',want_more:wantMore||'none'});
        card.innerHTML='<div class="ml-feedback-success"><p class="ml-feedback-kicker">Принято</p><strong>Спасибо. Это помогает делать следующие дела лучше.</strong><p>Мы отдельно смотрим на оценки, сложность и то, где игроки теряют удовольствие или застревают.</p></div>';
      } catch (error) {
        status.textContent='Не удалось сохранить. Попробуйте ещё раз — ваш прогресс в игре не пострадает.';
        busy=false; sync();
      }
    });
    track('review_view', context);
  };

  const scan = () => { const context=contextForPage(); if(context) mount(context); };
  const open = (context = {}) => { explicitContext={ caseId:String(context.caseId||''), caseKind:String(context.caseKind||'premium'), mode:String(context.mode||'solo'), mount:context.mount||document.querySelector('main')||document.body, title:String(context.title||'это расследование') }; scan(); };
  window.MysteryLogicPostCaseFeedback = Object.freeze({ version:'2.0.0', scan, open });
  window.addEventListener('ml:solo_complete', () => setTimeout(scan,0));
  window.addEventListener('ml:case_complete', (event) => { if(event.detail?.caseId) open(event.detail); else scan(); });
  new MutationObserver(() => scan()).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  scan();
})();