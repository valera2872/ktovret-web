import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ALLOWED_ORIGINS = new Set(["https://mysterylogic.com", "https://valera2872.github.io"]);
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const MODEL = Deno.env.get("AI_TRANSCRIBE_MODEL") || "gpt-4o-mini-transcribe";
const MAX_AUDIO_BYTES = 3_500_000;
const MAX_DURATION_MS = 30_000;
const MAX_TEXT_CHARS = 420;

function clean(value: unknown, max = MAX_TEXT_CHARS) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max)
    : "";
}

function validId(value: string) {
  return /^[a-zA-Z0-9-]{8,96}$/.test(value);
}

function corsHeaders(origin: string) {
  return {
    "access-control-allow-origin": origin || "https://mysterylogic.com",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "vary": "Origin",
    "cache-control": "no-store",
  };
}

function extensionFor(file: File) {
  const mime = (file.type || "").toLowerCase().split(";")[0].trim();
  const byMime: Record<string, string> = {
    "audio/webm": "webm",
    "audio/mp4": "m4a",
    "video/mp4": "mp4",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/flac": "flac",
    "audio/x-flac": "flac",
    "audio/m4a": "m4a",
    "audio/x-m4a": "m4a",
  };
  if (byMime[mime]) return byMime[mime];
  const match = file.name.toLowerCase().match(/\.(webm|mp4|mp3|mpeg|mpga|m4a|ogg|wav|flac)$/);
  return match?.[1] || "";
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return new Response(JSON.stringify({ error: "origin_not_allowed" }), {
      status: 403,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const cors = corsHeaders(origin || "https://mysterylogic.com");
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json; charset=utf-8" },
  });

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    let body: any;
    try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
    if (clean(body?.action, 24) !== "status") return json({ error: "unknown_action" }, 400);
    return json({ ready: Boolean(OPENAI_API_KEY), model: MODEL, max_duration_ms: MAX_DURATION_MS, max_audio_bytes: MAX_AUDIO_BYTES });
  }

  if (!contentType.includes("multipart/form-data")) return json({ error: "multipart_required" }, 415);
  if (!OPENAI_API_KEY) return json({ error: "transcription_not_configured" }, 503);

  let form: FormData;
  try { form = await req.formData(); } catch { return json({ error: "invalid_form" }, 400); }

  const audio = form.get("file");
  const sessionId = clean(form.get("session_id"), 96);
  const visitorId = clean(form.get("visitor_id"), 96);
  const durationMs = Math.max(0, Math.min(MAX_DURATION_MS + 5000, Number(form.get("duration_ms")) || 0));

  if (!validId(sessionId) || !validId(visitorId)) return json({ error: "invalid_session" }, 400);
  if (!(audio instanceof File)) return json({ error: "audio_required" }, 400);
  if (audio.size < 256) return json({ error: "audio_too_short" }, 400);
  if (audio.size > MAX_AUDIO_BYTES) return json({ error: "audio_too_large" }, 413);
  if (durationMs > MAX_DURATION_MS + 1000) return json({ error: "audio_too_long" }, 413);

  const extension = extensionFor(audio);
  if (!extension) return json({ error: "unsupported_audio_format" }, 415);

  const startedAt = Date.now();
  const openaiForm = new FormData();
  openaiForm.append("file", audio, `question.${extension}`);
  openaiForm.append("model", MODEL);
  openaiForm.append("language", "ru");
  openaiForm.append("response_format", "json");
  openaiForm.append(
    "prompt",
    "Детективный допрос Mystery Logic. Возможные термины и имена: Марина Лебедева, Антон Руденко, Лев Орлов, E-14, PIN, Archive-2, письмо 1912 года, закрытый фонд, служебный коридор.",
  );

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { authorization: `Bearer ${OPENAI_API_KEY}` },
      body: openaiForm,
    });

    if (!response.ok) {
      console.error("ai_voice_transcription_openai_error", response.status, clean(await response.text(), 500));
      return json({ error: "transcription_unavailable" }, 502);
    }

    const data = await response.json();
    const text = clean(data?.text, MAX_TEXT_CHARS);
    if (!text) return json({ error: "no_speech_detected" }, 422);

    console.log("ai_voice_transcription_ready", JSON.stringify({
      elapsed_ms: Date.now() - startedAt,
      bytes: audio.size,
      duration_ms: durationMs,
      model: MODEL,
    }));

    return json({ text, model: MODEL, elapsed_ms: Date.now() - startedAt });
  } catch (error) {
    console.error("ai_voice_transcription_error", String(error));
    return json({ error: "transcription_unavailable" }, 502);
  }
});
