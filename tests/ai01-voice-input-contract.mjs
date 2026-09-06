import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync('detektivnaya-igra-s-ii/index.html', 'utf8');
const js = fs.readFileSync('assets/ai01-voice-input.js', 'utf8');
const css = fs.readFileSync('assets/ai01-voice-input.css', 'utf8');
const fn = fs.readFileSync('supabase/functions/ai-voice-transcribe/index.ts', 'utf8');

assert.match(html, /data-ai01-voice/);
assert.match(html, /data-ai01-voice-status/);
assert.match(html, /ai01-voice-input\.css\?v=/);
assert.match(html, /ai01-voice-input\.js\?v=/);
assert.match(html, /голосом или текстом/);
assert.match(html, /placeholder="Задайте свой вопрос…"/);

assert.match(js, /navigator\.mediaDevices\?\.getUserMedia/);
assert.match(js, /window\.MediaRecorder/);
assert.match(js, /MAX_RECORDING_MS = 30_000/);
assert.match(js, /ai-voice-transcribe/);
assert.match(js, /ai01_voice_started/);
assert.match(js, /ai01_voice_transcribed/);
assert.match(js, /Проверьте текст и нажмите «Задать вопрос»/);
assert.doesNotMatch(js, /requestSubmit\s*\(/, 'voice transcription must not auto-submit');
assert.doesNotMatch(js, /composer\.submit\s*\(/, 'voice transcription must not auto-submit');

assert.match(css, /\.aid-voice-button/);
assert.match(css, /\.aid-voice-button\.is-recording/);
assert.match(css, /@media\(max-width:800px\)/);

assert.match(fn, /gpt-4o-mini-transcribe/);
assert.match(fn, /\/v1\/audio\/transcriptions/);
assert.match(fn, /https:\/\/mysterylogic\.com/);
assert.match(fn, /https:\/\/valera2872\.github\.io/);
assert.match(fn, /MAX_AUDIO_BYTES = 3_500_000/);
assert.match(fn, /MAX_DURATION_MS = 30_000/);
assert.match(fn, /openaiForm\.append\("language", "ru"\)/);
assert.match(fn, /E-14/);
assert.match(fn, /PIN/);

console.log('AI-01 voice input contract: ok');
