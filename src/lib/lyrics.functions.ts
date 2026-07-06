import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Uses Lovable AI to fetch the lyrics of a song by title.
export const getLyrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { title: string }) => {
    if (!input?.title) throw new Error("title required");
    return { title: input.title.slice(0, 200) };
  })
  .handler(async ({ data }): Promise<{ lyrics: string }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");
    const prompt = `Devolva SOMENTE a letra da música "${data.title}". Sem introdução, sem comentários, sem tradução, sem "Verso 1:". Apenas a letra, quebrando em linhas naturais. Se não souber a letra com certeza, responda exatamente: LETRA_INDISPONIVEL`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`AI error: ${res.status}`);
    const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = (json.choices?.[0]?.message?.content ?? "").trim();
    if (!raw || raw.includes("LETRA_INDISPONIVEL")) {
      return { lyrics: "Letra ainda não disponível para essa música. Cante do jeitinho que você lembra! 🎤" };
    }
    return { lyrics: raw.slice(0, 8000) };
  });
