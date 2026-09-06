(() => {
  'use strict';

  const API_URL = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-voice-transcribe';
  const PUBLIC_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ya252dXdrbnZzZWRqZ3FjZndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTY2MzcsImV4cCI6MjEwMTc3MjYzN30.68loNx8A71dodfOXXKs_-I235XVCmEioXGrg8kCZQr4';
  const MAX_RECORDING_MS = 30_000;
  const MAX_QUESTION_CHARS = 420;
  const SESSION_KEY = 'ml_ai_demo_session';
  const VISITOR_KEY = 'ml_ai_demo_visitor_v1';

  const composer = document.querySelector('[data-composer]');
  const input = document.querySelector('#aid-question');
  const button = document.querySelector('[data-ai01-voice]');
  const label = document.querySelector('[data-ai01-voice-label]');
  const status = document.querySelector('[data-ai01-voice-status]');
  const send = composer?.querySelector('.aid-send');
  if (!composer || !input || !button || !label || !status) return;

  const supported = Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
  if (!supported) {
    button.hidden = true;
    status.hidden = false;
    status.textContent = 'Голосовой ввод не поддерживается этим браузером.';
    return;
  }

  let recorder = null;
  let stream = null;
  let chunks = [];
  let startedAt = 0;
  let stopTimer = 0;
  let tickTimer = 0;
  let phase = 'idle';
  let recordingMime = '';

  const analytics = (event, metadata = {}) => {
    try { window.MysteryLogicAI01Analytics?.track?.(event, metadata); } catch {}
  };

  const makeId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)
    .replace(/[^a-zA-Z0-9-]/g, '');

  const ensureId = (storage, key) => {
    let value = storage.getItem(key) || '';
    if (!/^[a-zA-Z0-9-]{8,96}$/.test(value)) {
      value = makeId();
      try { storage.setItem(key, value); } catch {}
    }
    return value;
  };

  const sessionId = () => ensureId(sessionStorage, SESSION_KEY);
  const visitorId = () => ensureId(localStorage, VISITOR_KEY);

  const chooseMime = () => {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ];
    return candidates.find(type => MediaRecorder.isTypeSupported?.(type)) || '';
  };

  const extensionFor = mime => {
    const normalized = String(mime || '').toLowerCase();
    if (normalized.includes('mp4')) return 'm4a';
    if (normalized.includes('ogg')) return 'ogg';
    if (normalized.includes('mpeg') || normalized.includes('mp3')) return 'mp3';
    if (normalized.includes('wav')) return 'wav';
    return 'webm';
  };

  const setStatus = (message = '', visible = Boolean(message)) => {
    status.textContent = message;
    status.hidden = !visible;
  };

  const stopTracks = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    stream = null;
  };

  const clearTimers = () => {
    window.clearTimeout(stopTimer);
    window.clearInterval(tickTimer);
    stopTimer = 0;
    tickTimer = 0;
  };

  const setPhase = next => {
    phase = next;
    button.classList.toggle('is-recording', next === 'recording');
    button.classList.toggle('is-transcribing', next === 'transcribing');
    button.setAttribute('aria-pressed', next === 'recording' ? 'true' : 'false');
    button.disabled = next === 'transcribing';
    label.textContent = next === 'recording' ? 'Стоп' : next === 'transcribing' ? 'Распознаю…' : 'Сказать';
  };

  const syncAvailability = () => {
    if (phase !== 'idle') return;
    const closed = composer.classList.contains('is-closed');
    button.disabled = closed || Boolean(send?.disabled);
  };

  const insertTranscript = text => {
    const clean = String(text || '').replace(/\s+/g, ' ').trim().slice(0, MAX_QUESTION_CHARS);
    if (!clean) return false;
    const start = Number.isInteger(input.selectionStart) ? input.selectionStart : input.value.length;
    const end = Number.isInteger(input.selectionEnd) ? input.selectionEnd : start;
    const before = input.value.slice(0, start);
    const separator = before && !/\s$/.test(before) ? ' ' : '';
    input.setRangeText(`${separator}${clean}`, start, end, 'end');
    if (input.value.length > MAX_QUESTION_CHARS) input.value = input.value.slice(0, MAX_QUESTION_CHARS);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus({ preventScroll: true });
    return true;
  };

  const transcribe = async (blob, durationMs) => {
    setPhase('transcribing');
    setStatus('Распознаю вопрос…');

    const form = new FormData();
    const mime = blob.type || recordingMime || 'audio/webm';
    const file = new File([blob], `question.${extensionFor(mime)}`, { type: mime });
    form.append('file', file);
    form.append('session_id', sessionId());
    form.append('visitor_id', visitorId());
    form.append('duration_ms', String(Math.max(0, Math.min(MAX_RECORDING_MS, durationMs))));

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 35_000);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PUBLIC_ANON}`,
          apikey: PUBLIC_ANON,
        },
        body: form,
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data?.error === 'no_speech_detected') throw new Error('no_speech');
        throw new Error(data?.error || `http_${response.status}`);
      }
      if (!insertTranscript(data?.text)) throw new Error('no_speech');
      setStatus('Готово. Проверьте текст и нажмите «Задать вопрос».');
      analytics('ai01_voice_transcribed', {
        duration_ms: durationMs,
        transcript_chars: String(data.text || '').length,
        model: data.model || '',
      });
    } catch (error) {
      const code = String(error?.message || error || '');
      if (code.includes('no_speech')) setStatus('Не расслышал вопрос. Нажмите микрофон и попробуйте ещё раз.');
      else if (error?.name === 'AbortError') setStatus('Распознавание заняло слишком долго. Попробуйте ещё раз.');
      else setStatus('Не удалось распознать речь. Можно повторить или написать вопрос.');
      analytics('ai01_voice_error', { reason: code.slice(0, 80) });
    } finally {
      window.clearTimeout(timeout);
      setPhase('idle');
      syncAvailability();
    }
  };

  const finishRecording = async () => {
    clearTimers();
    const durationMs = Math.min(MAX_RECORDING_MS, Math.max(0, Date.now() - startedAt));
    const mime = recorder?.mimeType || recordingMime || 'audio/webm';
    const blob = new Blob(chunks, { type: mime });
    chunks = [];
    recorder = null;
    stopTracks();

    if (blob.size < 256 || durationMs < 300) {
      setPhase('idle');
      setStatus('Запись слишком короткая. Попробуйте ещё раз.');
      syncAvailability();
      return;
    }
    await transcribe(blob, durationMs);
  };

  const stopRecording = () => {
    if (phase !== 'recording' || !recorder) return;
    setStatus('Заканчиваю запись…');
    try {
      if (recorder.state !== 'inactive') recorder.stop();
      else finishRecording();
    } catch {
      finishRecording();
    }
  };

  const startRecording = async () => {
    if (phase !== 'idle' || button.disabled) return;
    setStatus('Разрешите доступ к микрофону…');
    analytics('ai01_voice_started');

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
      recordingMime = chooseMime();
      recorder = recordingMime ? new MediaRecorder(stream, { mimeType: recordingMime }) : new MediaRecorder(stream);
      chunks = [];
      recorder.addEventListener('dataavailable', event => {
        if (event.data?.size) chunks.push(event.data);
      });
      recorder.addEventListener('stop', finishRecording, { once: true });
      recorder.addEventListener('error', () => {
        clearTimers();
        stopTracks();
        recorder = null;
        chunks = [];
        setPhase('idle');
        setStatus('Ошибка микрофона. Попробуйте ещё раз.');
        analytics('ai01_voice_error', { reason: 'media_recorder' });
        syncAvailability();
      }, { once: true });

      recorder.start(250);
      startedAt = Date.now();
      setPhase('recording');
      setStatus('Говорите… нажмите «Стоп», когда закончите.');

      tickTimer = window.setInterval(() => {
        const left = Math.max(0, Math.ceil((MAX_RECORDING_MS - (Date.now() - startedAt)) / 1000));
        setStatus(`Говорите… ${left} сек.`);
      }, 1000);
      stopTimer = window.setTimeout(stopRecording, MAX_RECORDING_MS);
    } catch (error) {
      clearTimers();
      stopTracks();
      recorder = null;
      setPhase('idle');
      const denied = error?.name === 'NotAllowedError' || error?.name === 'SecurityError';
      setStatus(denied
        ? 'Микрофон запрещён. Разрешите доступ к нему в настройках браузера.'
        : 'Не удалось включить микрофон. Можно задать вопрос текстом.');
      analytics('ai01_voice_error', { reason: denied ? 'permission_denied' : String(error?.name || 'microphone') });
      syncAvailability();
    }
  };

  button.addEventListener('click', () => {
    if (phase === 'recording') stopRecording();
    else startRecording();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && phase === 'recording') stopRecording();
  });

  if (send) new MutationObserver(syncAvailability).observe(send, { attributes: true, attributeFilter: ['disabled'] });
  new MutationObserver(syncAvailability).observe(composer, { attributes: true, attributeFilter: ['class'] });
  syncAvailability();
})();
