(() => {
  'use strict';

  if (window.MysteryLogicFeedback) return;

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/case-feedback';
  const REWARD_ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/review-discount';
  const CLIENT_KEY_STORAGE = 'mysterylogic:challenge:client-key';
  const LIKES = [
    ['story','Сюжет'],['clues','Улики'],['atmosphere','Атмосфера'],['logic','Логика'],
    ['characters','Персонажи'],['finale','Финал'],['teamplay','Игра вдвоём'],['ai','AI-допрос']
  ];
  const IMPROVE = [
    ['navigation','Не всегда понятно, что делать'],['too_hard','Слишком сложно'],['too_easy','Слишком легко'],
    ['too_much_text','Слишком много текста'],['too_little_text','Хотелось больше материалов'],
    ['hints','Подсказки'],['technical','Технические проблемы'],['finale','Финал'],['other','Другое']
  ];

  let current = null;
  let submitted = false;

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
  const pathMeta = () => {
    const path = location.pathname.replace(/\/+$/,'') || '/';
    if (window.KtoVretWeb?.case?.id) return { caseId: String(window.KtoVretWeb.case.id), mode: 'short', title: window.KtoVretWeb.case.title || document.querySelector('h1')?.textContent || 'Дело' };
    if (path.includes('/poslednyaya-ariya')) return { caseId: 'coop:last-aria', mode: 'partner', title: 'Последняя ария' };
    if (path.endsWith('/2317')) return { caseId: 'coop:2317', mode: 'partner', title: 'Последний звонок в 23:17' };
    if (path.endsWith('/407')) return { caseId: 'solo:407', mode: 'solo', title: 'Номер 407' };
    if (path.includes('/detektivnaya-igra-s-ii')) return { caseId: 'AI-01', mode: 'ai_text', title: 'Восемь минут без камеры' };
    return { caseId: 'case:unknown', mode: 'other', title: document.querySelector('h1')?.textContent?.trim() || 'Расследование' };
  };
  const track = (eventName, metadata = {}) => {
    try { window.MysteryLogicFunnel?.track?.(eventName, { case_id: current?.caseId || '', ...metadata }, 'player-feedback'); } catch {}
  };
  const visibleLikes = (mode) => LIKES.filter(([id]) => {
    if (id === 'teamplay') return mode === 'partner' || mode === 'party';
    if (id === 'ai') return mode === 'ai_text' || mode === 'ai_live';
    return true;
  });
  const findHost = () => {
    const shortResult = document.querySelector('.ktv-result, #ktv-result');
    if (shortResult) return shortResult;
    return document.querySelector('[data-casearia-app],[data-case2317-app],[data-case407-app],[data-ai-detective]') || document.querySelector('main') || document.body;
  };
  const injectStyles = () => {
    if (document.querySelector('[data-ml-feedback-styles]')) return;
    const style = document.createElement('style');
    style.dataset.mlFeedbackStyles = 'true';
    style.textContent = `
      .ml-feedback{--mlf-gold:#c9aa71;--mlf-ink:#102030;position:relative;margin:30px auto 12px;max-width:820px;padding:clamp(20px,4vw,34px);border:1px solid rgba(201,170,113,.32);border-radius:24px;background:linear-gradient(145deg,rgba(15,30,46,.98),rgba(7,17,28,.99));box-shadow:0 24px 70px rgba(0,0,0,.28);color:#eef4f8;text-align:left;overflow:hidden}
      .ml-feedback:before{content:"";position:absolute;inset:0 auto auto 0;width:100%;height:2px;background:linear-gradient(90deg,transparent,rgba(201,170,113,.72),transparent)}
      .ml-feedback *{box-sizing:border-box}.mlf-kicker{margin:0 0 7px;color:var(--mlf-gold);font-size:.72rem;font-weight:900;letter-spacing:.16em;text-transform:uppercase}.ml-feedback h3{margin:0;font-size:clamp(1.4rem,3vw,2rem);line-height:1.12;color:#fff}.mlf-lead{margin:10px 0 20px;max-width:680px;color:rgba(233,241,247,.72);line-height:1.55}.mlf-question{margin:20px 0 0}.mlf-label{display:block;margin-bottom:9px;color:rgba(245,249,252,.9);font-size:.88rem;font-weight:850}.mlf-stars{display:flex;gap:8px;flex-wrap:wrap}.mlf-star{width:49px;height:46px;border:1px solid rgba(201,170,113,.3);border-radius:13px;background:rgba(201,170,113,.055);color:#a89064;font-size:1.65rem;line-height:1;cursor:pointer;transition:.16s transform,.16s background,.16s border-color}.mlf-star:hover{transform:translateY(-1px);border-color:rgba(201,170,113,.62)}.mlf-star.is-on{color:#ffe0a4;background:rgba(201,170,113,.17);border-color:rgba(201,170,113,.72)}
      .mlf-details{display:none}.mlf-details.is-open{display:block;animation:mlf-in .22s ease-out}@keyframes mlf-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}.mlf-chips{display:flex;gap:8px;flex-wrap:wrap}.mlf-chip{border:1px solid rgba(171,192,208,.2);border-radius:999px;background:rgba(255,255,255,.035);color:rgba(235,242,247,.76);padding:9px 13px;font:inherit;font-size:.83rem;cursor:pointer}.mlf-chip.is-on{border-color:rgba(201,170,113,.66);background:rgba(201,170,113,.13);color:#fff}.mlf-textarea,.mlf-name{width:100%;border:1px solid rgba(171,192,208,.2);border-radius:14px;background:rgba(2,10,18,.55);color:#f8fbfd;padding:12px 14px;font:inherit;outline:none}.mlf-textarea{min-height:88px;resize:vertical}.mlf-textarea:focus,.mlf-name:focus{border-color:rgba(201,170,113,.65);box-shadow:0 0 0 3px rgba(201,170,113,.08)}.mlf-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.mlf-consent{display:flex;gap:10px;align-items:flex-start;margin-top:18px;color:rgba(229,238,245,.66);font-size:.8rem;line-height:1.45}.mlf-consent input{margin-top:3px}.mlf-name-wrap{display:none;margin-top:11px}.mlf-name-wrap.is-open{display:block}.mlf-submit{margin-top:20px;min-height:48px;border:0;border-radius:14px;background:var(--mlf-gold);color:var(--mlf-ink);padding:12px 18px;font:inherit;font-weight:950;cursor:pointer}.mlf-submit:disabled{opacity:.48;cursor:not-allowed}.mlf-status{min-height:1.3em;margin:10px 0 0;color:#efc5b1;font-size:.84rem}.mlf-thanks{padding:8px 0 2px}.mlf-thanks strong{display:block;margin-bottom:7px;color:#fff;font-size:1.12rem}.mlf-thanks p{margin:0;color:rgba(233,241,247,.72);line-height:1.5}.mlf-reward{margin-top:12px;padding:12px 14px;border:1px solid rgba(201,170,113,.27);border-radius:13px;background:rgba(201,170,113,.08);color:#f3dfb6;font-size:.84rem}@media(max-width:680px){.ml-feedback{border-radius:20px;padding:20px 16px}.mlf-grid{grid-template-columns:1fr}.mlf-star{width:45px;height:43px}.mlf-chip{font-size:.8rem}}
    `;
    document.head.appendChild(style);
  };

  const selected = (card, selector) => [...card.querySelectorAll(`${selector}.is-on`)].map((node) => String(node.dataset.value || ''));
  const single = (card, selector) => card.querySelector(`${selector}.is-on`)?.dataset?.value || '';
  const toggleGroup = (card, selector, button, multi = false) => {
    if (!multi) card.querySelectorAll(selector).forEach((node) => node.classList.remove('is-on'));
    button.classList.toggle('is-on', multi ? !button.classList.contains('is-on') : true);
  };

  const rewardForShort = async (payload) => {
    if (payload.experienceMode !== 'short' || payload.comment.trim().length < 20) return null;
    try {
      const response = await fetch(REWARD_ENDPOINT, {
        method:'POST',headers:{'content-type':'application/json'},credentials:'omit',cache:'no-store',
        body:JSON.stringify({browserKey:payload.browserKey,caseId:payload.caseId,rating:payload.rating,comment:payload.comment,difficulty:payload.difficulty,displayName:payload.displayName,publicationConsent:payload.publicationConsent})
      });
      const body = await response.json().catch(() => ({}));
      return response.ok && body.rewardEligible ? body.reward : null;
    } catch { return null; }
  };

  const mount = (meta = {}) => {
    if (submitted || document.querySelector('[data-ml-feedback]')) return;
    current = { ...pathMeta(), ...meta };
    if (!/^[A-Za-z0-9:_-]{3,160}$/.test(String(current.caseId || ''))) current.caseId = pathMeta().caseId;
    injectStyles();
    const host = findHost();
    if (!host) return;
    host.querySelector?.('[data-ktv-review-card]')?.remove();

    const card = document.createElement('section');
    card.className = 'ml-feedback';
    card.dataset.mlFeedback = 'true';
    card.innerHTML = `
      <p class="mlf-kicker">После расследования</p>
      <h3>Как вам это дело?</h3>
      <p class="mlf-lead">Пара быстрых отметок поможет нам понять, что оставить, а что сделать лучше. Можно ответить за 20–30 секунд.</p>
      <div class="mlf-question"><span class="mlf-label">Ваша оценка</span><div class="mlf-stars" role="radiogroup" aria-label="Оценка расследования">${[1,2,3,4,5].map((n)=>`<button type="button" class="mlf-star" data-rating="${n}" aria-label="${n} из 5">★</button>`).join('')}</div></div>
      <div class="mlf-details" data-details>
        <div class="mlf-grid">
          <div class="mlf-question"><span class="mlf-label">По сложности</span><div class="mlf-chips">${[['too_easy','Слишком легко'],['just_right','В самый раз'],['too_hard','Слишком сложно']].map(([v,l])=>`<button type="button" class="mlf-chip" data-difficulty data-value="${v}">${l}</button>`).join('')}</div></div>
          <div class="mlf-question"><span class="mlf-label">Хотите ещё таких расследований?</span><div class="mlf-chips">${[['yes','Да, обязательно'],['maybe','Возможно'],['no','Скорее нет']].map(([v,l])=>`<button type="button" class="mlf-chip" data-more data-value="${v}">${l}</button>`).join('')}</div></div>
        </div>
        <div class="mlf-question"><span class="mlf-label">Что понравилось? <small>Можно несколько</small></span><div class="mlf-chips">${visibleLikes(current.mode).map(([v,l])=>`<button type="button" class="mlf-chip" data-like data-value="${v}">${l}</button>`).join('')}</div></div>
        <div class="mlf-question"><span class="mlf-label">Что стоило бы улучшить? <small>Можно несколько</small></span><div class="mlf-chips">${IMPROVE.map(([v,l])=>`<button type="button" class="mlf-chip" data-improve data-value="${v}">${l}</button>`).join('')}</div></div>
        <label class="mlf-question"><span class="mlf-label">Если хотите — напишите пару слов</span><textarea class="mlf-textarea" maxlength="2000" data-comment placeholder="Что запомнилось, где было непонятно или что раздражало? Это поле необязательное."></textarea></label>
        <label class="mlf-consent"><input type="checkbox" data-publish><span>Можно после модерации опубликовать мой текстовый отзыв на Mystery Logic. Оценка и ответы на вопросы используются для внутренней аналитики независимо от этого выбора.</span></label>
        <label class="mlf-name-wrap" data-name-wrap><span class="mlf-label">Имя или псевдоним <small>(необязательно)</small></span><input class="mlf-name" maxlength="80" autocomplete="nickname" data-name placeholder="Например: Алексей"></label>
        <button type="button" class="mlf-submit" data-submit>Отправить</button><p class="mlf-status" data-status role="status" aria-live="polite"></p>
      </div>`;
    host.appendChild(card);
    card.scrollIntoView({ behavior:'smooth', block:'nearest' });
    track('review_view', { feedback_version:2, mode:current.mode });

    let rating = 0;
    card.querySelectorAll('[data-rating]').forEach((button) => button.addEventListener('click', () => {
      rating = Number(button.dataset.rating || 0);
      card.querySelectorAll('[data-rating]').forEach((node) => node.classList.toggle('is-on', Number(node.dataset.rating || 0) <= rating));
      card.querySelector('[data-details]')?.classList.add('is-open');
      track('diagnostic_choice', { choice:`feedback_rating_${rating}`, position:rating });
    }));
    card.querySelectorAll('[data-difficulty]').forEach((button) => button.addEventListener('click',()=>toggleGroup(card,'[data-difficulty]',button,false)));
    card.querySelectorAll('[data-more]').forEach((button) => button.addEventListener('click',()=>toggleGroup(card,'[data-more]',button,false)));
    card.querySelectorAll('[data-like]').forEach((button) => button.addEventListener('click',()=>toggleGroup(card,'[data-like]',button,true)));
    card.querySelectorAll('[data-improve]').forEach((button) => button.addEventListener('click',()=>toggleGroup(card,'[data-improve]',button,true)));
    card.querySelector('[data-publish]')?.addEventListener('change',(event)=>card.querySelector('[data-name-wrap]')?.classList.toggle('is-open',Boolean(event.target.checked)));

    card.querySelector('[data-submit]')?.addEventListener('click', async () => {
      const status = card.querySelector('[data-status]');
      const submit = card.querySelector('[data-submit]');
      if (!rating) { status.textContent = 'Сначала поставьте оценку от 1 до 5.'; return; }
      submit.disabled = true; status.textContent = 'Сохраняем…';
      const payload = {
        browserKey:browserKey(),caseId:String(current.caseId),rating,
        difficulty:single(card,'[data-difficulty]'),
        likedTags:selected(card,'[data-like]'),improveTags:selected(card,'[data-improve]'),
        moreIntent:single(card,'[data-more]'),experienceMode:String(current.mode || 'other'),
        comment:String(card.querySelector('[data-comment]')?.value || '').trim(),
        publicationConsent:Boolean(card.querySelector('[data-publish]')?.checked),
        displayName:String(card.querySelector('[data-name]')?.value || '').trim(),
      };
      try {
        const response = await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),cache:'no-store',credentials:'omit'});
        const body = await response.json().catch(()=>({}));
        if (!response.ok) throw new Error(body.error || `http_${response.status}`);
        submitted = true;
        track('review_submit',{rating, difficulty:payload.difficulty || 'none', more_intent:payload.moreIntent || 'none', feedback_version:2});
        const reward = await rewardForShort(payload);
        card.innerHTML = `<div class="mlf-thanks"><p class="mlf-kicker">Спасибо</p><strong>Ответ сохранён</strong><p>Мы используем такие ответы при доработке дел и выборе следующих расследований.</p>${reward ? `<div class="mlf-reward">За содержательный отзыв у вас также есть скидка 50 ₽ на «Последнюю арию»: <strong>${esc(reward.code || '')}</strong></div>` : ''}</div>`;
      } catch {
        submit.disabled = false; status.textContent = 'Не удалось сохранить ответ. Попробуйте ещё раз — прогресс игры не пострадает.';
      }
    });
  };

  window.addEventListener('ml:case-complete', (event) => mount(event.detail || {}));
  window.MysteryLogicFeedback = Object.freeze({ open: mount });
})();
