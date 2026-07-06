import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

// Uploads a mic recording (WAV) to private storage, scores it with Lovable AI,
// creates a performance row, and returns { performanceId }.
export const Route = createFileRoute("/api/upload-recording")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.replace(/^Bearer\s+/i, "");
        if (!token) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

        const supabaseUrl = process.env.SUPABASE_URL!;
        const supabasePubKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const userClient = createClient(supabaseUrl, supabasePubKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: userRes } = await userClient.auth.getUser();
        const user = userRes?.user;
        if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

        const form = await request.formData();
        const audio = form.get("audio");
        const youtubeId = String(form.get("youtube_id") ?? "");
        const title = String(form.get("title") ?? "Sem título");
        if (!(audio instanceof File) || !youtubeId) {
          return new Response(JSON.stringify({ error: "bad_request" }), { status: 400 });
        }
        if (audio.size < 2048) {
          return new Response(JSON.stringify({ error: "recording_empty" }), { status: 400 });
        }
        if (audio.size > 15 * 1024 * 1024) {
          return new Response(JSON.stringify({ error: "recording_too_big" }), { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const path = `${user.id}/${Date.now()}-${youtubeId}.wav`;
        const arrayBuffer = await audio.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const upload = await supabaseAdmin.storage
          .from("recordings")
          .upload(path, bytes, { contentType: "audio/wav", upsert: false });
        if (upload.error) {
          return new Response(JSON.stringify({ error: "upload_failed", detail: upload.error.message }), { status: 500 });
        }

        // 1) Transcribe
        let transcript = "";
        try {
          const t = new FormData();
          t.append("file", new Blob([bytes], { type: "audio/wav" }), "recording.wav");
          t.append("model", "openai/gpt-4o-mini-transcribe");
          const tr = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.LOVABLE_API_KEY!}` },
            body: t,
          });
          if (tr.ok) {
            const tj = await tr.json() as { text?: string };
            transcript = (tj.text ?? "").slice(0, 4000);
          }
        } catch (_e) { /* graceful degradation */ }

        // 2) Score via chat
        let score = 50;
        let feedback = "Boa energia! Continue cantando para melhorar sua nota.";
        try {
          const prompt = `Você é um jurado de karaokê brasileiro simpático e sincero. A pessoa cantou a música "${title}". Aqui está a transcrição do que ela cantou (o áudio inclui a música de fundo, então trechos podem estar misturados com a letra original):\n\n"""${transcript || "(sem transcrição — considere isso ao avaliar)"}"""\n\nAvalie de 0 a 100 considerando: participação (cantou até o fim?), clareza, fluência da letra e energia. Seja generoso com quem se esforçou. Responda APENAS um JSON válido com este formato: {"score": <número 0-100>, "feedback": "<comentário curto em português, até 140 caracteres, empolgado>"}`;
          const chat = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.LOVABLE_API_KEY!}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [{ role: "user", content: prompt }],
            }),
          });
          if (chat.ok) {
            const cj = await chat.json() as { choices?: Array<{ message?: { content?: string } }> };
            const raw = cj.choices?.[0]?.message?.content ?? "";
            const m = /\{[\s\S]*\}/.exec(raw);
            if (m) {
              const parsed = JSON.parse(m[0]) as { score?: number; feedback?: string };
              if (typeof parsed.score === "number") score = Math.max(0, Math.min(100, Math.round(parsed.score)));
              if (parsed.feedback) feedback = String(parsed.feedback).slice(0, 200);
            }
          }
        } catch (_e) { /* keep defaults */ }

        const { data: perf, error: perfErr } = await supabaseAdmin
          .from("performances")
          .insert({
            user_id: user.id,
            youtube_id: youtubeId,
            title,
            audio_path: path,
            score,
            ai_feedback: feedback,
            transcript,
          })
          .select("id")
          .single();
        if (perfErr) return new Response(JSON.stringify({ error: "db_error", detail: perfErr.message }), { status: 500 });

        return new Response(JSON.stringify({ performanceId: perf.id, score, feedback }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
