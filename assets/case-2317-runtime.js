(() => {
  'use strict';

  const root = document.querySelector('[data-case2317-app]');
  if (!root) return;

  const CALL_DURATION = 46;
  const CALL_SPEECH = [
    [0.5, 'operator', 'Служба сто двенадцать. Что у вас произошло?'],
    [4.3, 'vera', 'Он приехал. Я вижу его машину напротив. Я не должна была говорить, что уезжаю.'],
    [11.5, 'operator', 'Назовите адрес. Вы сейчас в безопасности?'],
    [15.4, 'vera', 'Улица Береговая, дом восемнадцать. Если я не отвечу через десять минут, скажите Марине, что план Б.'],
    [24.8, 'operator', 'Вера, оставайтесь на линии. Не выходите одна.'],
    [29.1, 'vera', 'Я должна уйти через двор. Подождите.'],
    [40.5, 'vera', 'Он...']
  ];

  let playback = { playing: false, offset: 0, startedAt: 0, raf: 0, timers: [] };
  let audioContext = null;

  const roomCode = () => (new URL(location.href).searchParams.get('room') || '').trim().toUpperCase();
  const role = () => {
    const label = root.querySelector('.case2317-role-label b')?.textContent || '';
    return label.includes('Аналитик') ? 'guest' : 'creator';
  };
  const progressKey = () => `mysterylogic:2317:v2:${roomCode()}:${role()}`;
  const readProgress = () => {
    try { return JSON.parse(localStorage.getItem(progressKey()) || '{}') || {}; }
    catch { return {}; }
  };
  const saveProgress = (progress) => {
    try { localStorage.setItem(progressKey(), JSON.stringify(progress)); } catch {}
  };

  const toast = (message) => {
    document.querySelector('.case2317-toast')?.remove();
    const node = document.createElement('div');
    node.className = 'case2317-toast';
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 3000);
  };

  const formatTime = (seconds) => {
    const value = Math.max(0, Number(seconds) || 0);
    return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
  };
  const cueAt = (time) => {
    if (time < 3.7) return 'Диспетчер принимает вызов.';
    if (time < 10.4) return 'Вера: «Он приехал. Я вижу его машину напротив…»';
    if (time < 15.0) return 'Диспетчер просит назвать адрес.';
    if (time < 24.2) return 'Вера: «Если я не отвечу через десять минут — скажите Марине, что план Б».';
    if (time < 33.5) return 'Диспетчер просит оставаться на линии. Вера собирается выйти через двор.';
    if (time < 35.8) return 'Два коротких сигнала электронного замка.';
    if (time < 39.8) return 'Тяжёлая дверь с доводчиком. На фоне меняется акустика.';
    if (time < 42.0) return 'Вера начинает говорить — фраза обрывается.';
    return 'Линия теряется. Конец записи.';
  };

  const russianVoice = () => {
    try {
      const voices = window.speechSynthesis?.getVoices?.() || [];
      return voices.find((voice) => /^ru([-_]|$)/i.test(voice.lang)) || null;
    } catch { return null; }
  };
  const speak = (kind, text) => {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      utterance.rate = kind === 'operator' ? .98 : .91;
      utterance.pitch = kind === 'operator' ? .88 : 1.08;
      utterance.volume = .76;
      const voice = russianVoice();
      if (voice) utterance.voice = voice;
      speechSynthesis.speak(utterance);
    } catch {}
  };
  const effect = (kind) => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioContext ||= new Ctx();
      if (audioContext.state === 'suspended') audioContext.resume();
      const now = audioContext.currentTime;
      if (kind === 'beep') {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.frequency.value = 1450;
        gain.gain.setValueAtTime(.0001, now);
        gain.gain.exponentialRampToValueAtTime(.08, now + .01);
        gain.gain.exponentialRampToValueAtTime(.0001, now + .13);
        osc.connect(gain).connect(audioContext.destination);
        osc.start(now); osc.stop(now + .14);
      } else {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'triangle'; osc.frequency.value = 82;
        gain.gain.setValueAtTime(.12, now);
        gain.gain.exponentialRampToValueAtTime(.0001, now + .34);
        osc.connect(gain).connect(audioContext.destination);
        osc.start(now); osc.stop(now + .35);
      }
    } catch {}
  };

  const audioNodes = () => ({
    button: root.querySelector('[data-action="audio-toggle"]'),
    time: root.querySelector('[data-audio-time]'),
    cue: root.querySelector('[data-audio-cue]'),
    wave: root.querySelector('[data-audio-wave]'),
    marker: root.querySelector('[data-audio-marker]')
  });
  const unlockMarker = () => {
    if (role() !== 'creator' || !roomCode()) return;
    const progress = readProgress();
    if (progress.audioMarker) return;
    progress.audioMarker = true;
    saveProgress(progress);
    audioNodes().marker?.classList.remove('is-hidden');
    toast('Служебная метка D-2147 распознана. Передайте её Аналитику.');
    try { window.ym?.(111664459, 'reachGoal', 'coop_2317_audio_marker', { page_type: 'coop_2317', room_code: roomCode() }); } catch {}
  };
  const updateUi = (seconds) => {
    const nodes = audioNodes();
    if (nodes.time) nodes.time.textContent = `${formatTime(seconds)} / 00:46`;
    if (nodes.cue) nodes.cue.textContent = cueAt(seconds);
    if (nodes.wave) nodes.wave.style.setProperty('--audio-progress', `${Math.min(100, seconds / CALL_DURATION * 100)}%`);
    if (seconds >= 35) unlockMarker();
  };

  const clearTimers = () => {
    playback.timers.forEach(clearTimeout);
    playback.timers = [];
    if (playback.raf) cancelAnimationFrame(playback.raf);
    playback.raf = 0;
    try { window.speechSynthesis?.cancel(); } catch {}
  };
  const stop = (reset = false) => {
    if (playback.playing) playback.offset = Math.min(CALL_DURATION, playback.offset + (performance.now() - playback.startedAt) / 1000);
    playback.playing = false;
    clearTimers();
    if (reset) playback.offset = 0;
    const nodes = audioNodes();
    if (nodes.button) nodes.button.textContent = playback.offset >= CALL_DURATION - .2 ? '↺' : '▶';
    nodes.wave?.classList.remove('is-playing');
    updateUi(playback.offset);
  };
  const schedule = () => {
    const offset = playback.offset;
    for (const [at, kind, text] of CALL_SPEECH) {
      if (at < offset - .25) continue;
      playback.timers.push(setTimeout(() => { if (playback.playing) speak(kind, text); }, Math.max(0, (at - offset) * 1000)));
    }
    for (const [at, kind] of [[34.2, 'beep'], [34.85, 'beep'], [36.2, 'door']]) {
      if (at < offset - .25) continue;
      playback.timers.push(setTimeout(() => { if (playback.playing) effect(kind); }, Math.max(0, (at - offset) * 1000)));
    }
  };
  const frame = () => {
    if (!playback.playing) return;
    const seconds = Math.min(CALL_DURATION, playback.offset + (performance.now() - playback.startedAt) / 1000);
    updateUi(seconds);
    if (seconds >= CALL_DURATION) { playback.offset = CALL_DURATION; stop(); return; }
    playback.raf = requestAnimationFrame(frame);
  };
  const toggle = () => {
    const nodes = audioNodes();
    if (!nodes.button) return;
    if (playback.playing) { stop(); return; }
    if (playback.offset >= CALL_DURATION - .2) playback.offset = 0;
    clearTimers();
    playback.playing = true;
    playback.startedAt = performance.now();
    nodes.button.textContent = '❚❚';
    nodes.wave?.classList.add('is-playing');
    schedule(); frame();
    try { window.ym?.(111664459, 'reachGoal', 'coop_2317_audio_play', { page_type: 'coop_2317', room_code: roomCode() }); } catch {}
  };

  const neutralizeMissingAudioAsset = () => {
    root.querySelectorAll('audio[data-112-audio]').forEach((audio) => {
      if (audio.dataset.runtimeNeutralized) return;
      audio.dataset.runtimeNeutralized = '1';
      try { audio.pause(); audio.removeAttribute('src'); audio.load(); } catch {}
      const label = root.querySelector('.case2317-audio-head small');
      if (label) label.textContent = 'Аудиореконструкция линии 112 · моно';
      updateUi(playback.offset);
    });
  };

  root.addEventListener('click', (event) => {
    const target = event.target.closest?.('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'audio-toggle') {
      event.preventDefault(); event.stopImmediatePropagation(); toggle(); return;
    }
    if (playback.playing) stop();
    if (action === 'decision') {
      const id = target.dataset.decision || '';
      const progress = readProgress();
      if (Array.isArray(progress.decisions) && progress.decisions.includes(id)) {
        event.preventDefault(); event.stopImmediatePropagation();
        toast('Эту линию вы уже проверяли — выберите другой запрос.');
      }
    }
  }, true);

  root.addEventListener('submit', (event) => {
    if (!event.target.matches?.('[data-final-form]')) return;
    const progress = readProgress();
    progress.decisionMistakes = Math.min(2, Number(progress.decisionMistakes) || 0);
    if ((Number(progress.finalAttempts) || 0) >= 18) progress.finalAttempts = 17;
    saveProgress(progress);
  }, true);

  const observer = new MutationObserver(() => neutralizeMissingAudioAsset());
  observer.observe(root, { childList: true, subtree: true });
  neutralizeMissingAudioAsset();
  window.addEventListener('beforeunload', () => { stop(); observer.disconnect(); });
})();
