import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const addSongToHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { youtube_id: string; title: string; channel?: string; duration?: number; thumbnail_url?: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("songs_history").insert({
      user_id: context.userId,
      youtube_id: data.youtube_id,
      title: data.title,
      channel: data.channel ?? null,
      duration: data.duration ?? null,
      thumbnail_url: data.thumbnail_url ?? null,
    });
    if (error) throw error;
    return { ok: true };
  });

export const getMyHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("songs_history")
      .select("*")
      .order("chosen_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return { items: data ?? [] };
  });

export const getMyPerformances = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("performances")
      .select("id, youtube_id, title, score, ai_feedback, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return { items: data ?? [] };
  });
