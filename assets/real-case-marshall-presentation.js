(()=>{
  'use strict';

  const VERSION='0.1.2';
  const app=document.querySelector('[data-realcase-app]');
  if(!app) return;

  const PASSIVE_EVIDENCE=new Set(['S03','S04','S05','S09','S11']);
  const S24_COPY='Все ключевые материалы связаны с официальным архивом Новой Шотландии и документами Royal Commission. В расследовании использованы текстовые выписки и сопоставление источников; ниже — реестр официальных ссылок.';
  const ACTION_LABELS={
    S06:'Зафиксировать карту фактов',
    S07:'Зафиксировать рабочую версию',
    S10:'Зафиксировать изменения',
    S12:'Зафиксировать изменения',
    S13:'Зафиксировать общий сдвиг',
    S14:'Зафиксировать рабочий вывод',
    S16:'Зафиксировать слабые места',
    S17:'Зафиксировать решение по файлу',
    S19:'Обновить рабочую версию',
    S21:'Зафиксировать причины провала',
    S22:'Передать итоговое заключение'
  };
  const EYEBROW_LABELS={
    S07:'Рабочий вывод · ранний файл',
    S14:'Рабочий вывод · после повторных допросов',
    S21:'Аудит расследования'
  };

  const makeEvidenceReadingFlow=(screen)=>{
    if(!PASSIVE_EVIDENCE.has(screen)) return;

    /* The core originally required players to tick a minimum number of lines that
       simply repeated the document above. Preserve internal state compatibility,
       but remove that fake interaction from the player-facing experience. */
    const grid=app.querySelector(`.rc-screen[data-screen="${screen}"] .rc-fact-grid`);
    if(grid){
      grid.querySelectorAll('input[data-fact]').forEach(input=>{
        if(input.checked) return;
        input.checked=true;
        input.dispatchEvent(new Event('change',{bubbles:true}));
      });
      if(!grid.hidden) grid.hidden=true;
      if(grid.getAttribute('aria-hidden')!=='true') grid.setAttribute('aria-hidden','true');
    }

    const screenNode=app.querySelector(`.rc-screen[data-screen="${screen}"]`);
    const actions=screenNode?.querySelector('.rc-actions');
    if(screenNode&&actions&&!screenNode.querySelector('[data-reading-flow]')){
      const note=document.createElement('p');
      note.className='rc-reading-prompt';
      note.dataset.readingFlow='true';
      note.textContent=screen==='S09'||screen==='S11'
        ?'Читайте это как новую версию показания. На следующем экране вы сами сопоставите её с первой — изменения заранее не подсвечены.'
        :'Читайте материал отдельно от остальных. Если деталь требует возврата, сохраните её в блокнот; сводить версии будем после первых трёх источников.';
      actions.before(note);
    }
  };

  const investigatorFeedback=(screen)=>{
    const node=app.querySelector(`.rc-screen[data-screen="${screen}"] .rc-feedback`);
    if(!node) return;
    const current=node.textContent.trim();
    let next='';

    if(screen==='S06'){
      if(current.startsWith('Подтверждено документами:')&&current.includes('Пересмотрите')) next='В карте пока не сходятся несколько тезисов. Вернитесь к первым трём материалам: отделите одиночное сообщение, повторение в независимых источниках и противоречие.';
      else if(current.startsWith('Подтверждено документами:')) next='Карта раннего файла собрана: повторяющиеся сведения отделены от одиночных и противоречащих.';
    }

    if(screen==='S10'||screen==='S12'){
      if(current.startsWith('Сверено с документами:')&&current.includes('Для перехода')) next='Сверка ещё неполна. Найдите минимум четыре изменения между первой и второй версиями: что добавилось, исчезло, изменилось или осталось прежним.';
      else if(current.startsWith('Сверено с документами:')) next='Сравнение зафиксировано. Изменение показаний отделено от объяснения его причин.';
    }

    if(screen==='S13'&&current.startsWith('Нужно выбрать только те общие направления')) next='В общей картине есть лишний или неподтверждённый сдвиг. Оставьте только направления, которые действительно повторяются у обоих свидетелей.';

    if(screen==='S16'&&current.startsWith('Выберите только проблемы')) next='Не все отмеченные пункты подтверждаются открытым файлом. Оставьте только сведения, которые действительно были ослаблены, переобъяснены или вытеснены из обвинительной версии.';
    if(screen==='S21'&&current.startsWith('Выберите только проблемы')) next='Проверьте каждую отмеченную причину по материалам. Оставьте только те сбои расследования, которые подтверждаются открытым файлом.';

    if(screen==='S17'){
      if(current.startsWith('Нужны позиция, короткое объяснение')) next='Чтобы подписать решение, сформулируйте позицию, короткое обоснование и приложите минимум три материала.';
      else if(current.startsWith('Позиция дисциплинированно отделяет')) next='Решение зафиксировано. Вы отделили недостаточность обвинительной версии от догадки о другом преступнике.';
      else if(current.startsWith('Вы можете защищать эту позицию')) next='Решение зафиксировано. Теперь оно должно выдержать вопрос: почему ранние противоречия и изменения показаний не подрывают обвинительную версию?';
    }

    if(screen==='S19'&&current.startsWith('Обновите выводы только там')) next='Новая информация меняет не всё. Обновите только те рабочие выводы, доказательный вес которых действительно изменился.';

    if(screen==='S22'&&current.startsWith('Финальное заключение должно содержать')) next='Заключение пока не опирается на весь файл. Дайте развёрнутый вывод и приложите минимум пять материалов в обоснование.';

    if(next&&next!==current) node.textContent=next;
  };

  const investigatorTone=(screen)=>{
    const screenNode=app.querySelector(`.rc-screen[data-screen="${screen}"]`);
    if(!screenNode) return;
    const action=ACTION_LABELS[screen];
    const button=screenNode.querySelector('[data-action="primary"]');
    if(action&&button&&button.textContent!==action) button.textContent=action;
    const eyebrow=EYEBROW_LABELS[screen];
    const eyebrowNode=screenNode.querySelector('.rc-eyebrow');
    if(eyebrow&&eyebrowNode&&eyebrowNode.textContent!==eyebrow) eyebrowNode.textContent=eyebrow;
    investigatorFeedback(screen);
  };

  const polishFinalScreen=()=>{
    const screenNode=app.querySelector('.rc-screen[data-screen="S25"]');
    if(!screenNode) return;

    const feedbacks=[...screenNode.querySelectorAll('.rc-feedback.is-good')];
    const scoreCard=feedbacks.find(node=>node.innerHTML.includes('Вы завершили прототип документального дела.')||node.dataset.scoreCard==='true');
    if(scoreCard){
      if(scoreCard.dataset.scoreCard!=='true') scoreCard.dataset.scoreCard='true';
      if(scoreCard.innerHTML.includes('Вы завершили прототип документального дела.')){
        scoreCard.innerHTML=scoreCard.innerHTML
          .replace('Вы завершили прототип документального дела. Итоговая оценка:','Качество работы с источниками:')
          .replace('Она отражает не угадывание имени, а дисциплину работы с источниками.','Оценка отражает доказательную дисциплину, а не угадывание имени.');
      }
    }

    const completion=feedbacks.find(node=>node!==scoreCard&&node.textContent.includes('Прогресс сохранён на этом устройстве.'));
    const button=screenNode.querySelector('[data-action="primary"]');
    if(completion){
      if(completion.textContent!=='Расследование завершено. Прогресс сохранён на этом устройстве.') completion.textContent='Расследование завершено. Прогресс сохранён на этом устройстве.';
      if(button&&button.textContent!=='Дело завершено') button.textContent='Дело завершено';
      if(button&&!button.disabled) button.disabled=true;
    }else if(button){
      if(button.textContent!=='Завершить дело') button.textContent='Завершить дело';
      if(button.disabled) button.disabled=false;
    }
  };

  const polish=()=>{
    const screen=app.querySelector('.rc-screen')?.dataset.screen||'';

    makeEvidenceReadingFlow(screen);
    investigatorTone(screen);

    if(screen==='S00'){
      const eyebrow=app.querySelector('.rc-screen[data-screen="S00"] .rc-eyebrow');
      if(eyebrow&&eyebrow.textContent!=='Реальное уголовное дело · 1971') eyebrow.textContent='Реальное уголовное дело · 1971';
    }

    if(screen==='S23'){
      const eyebrow=app.querySelector('.rc-screen[data-screen="S23"] .rc-eyebrow');
      if(eyebrow&&eyebrow.textContent!=='Настоящее дело') eyebrow.textContent='Настоящее дело';
      const button=app.querySelector('.rc-screen[data-screen="S23"] [data-action="primary"]');
      if(button&&button.textContent!=='Открыть официальные источники') button.textContent='Открыть официальные источники';
    }

    if(screen==='S24'){
      const copy=app.querySelector('.rc-screen[data-screen="S24"] .rc-copy p');
      if(copy&&copy.textContent!==S24_COPY) copy.textContent=S24_COPY;
    }

    const autosave=app.querySelector('.rc-footer-actions span');
    if(autosave&&autosave.textContent!=='Автосохранение включено') autosave.textContent='Автосохранение включено';

    const reset=app.querySelector('[data-action="reset"]');
    if(reset&&reset.textContent!=='Сбросить прогресс') reset.textContent='Сбросить прогресс';

    if(screen==='S25') polishFinalScreen();
  };

  const observer=new MutationObserver(()=>queueMicrotask(polish));
  observer.observe(app,{childList:true,subtree:true});

  app.addEventListener('click',(event)=>{
    const reset=event.target.closest?.('[data-action="reset"]');
    if(!reset||!app.contains(reset)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if(confirm('Сбросить весь прогресс расследования?')) window.MLRealCase7105?.reset?.();
  },true);

  polish();
  window.MLRealCase7105Presentation={version:VERSION,polish,passiveEvidence:[...PASSIVE_EVIDENCE],actionLabels:{...ACTION_LABELS}};
})();
