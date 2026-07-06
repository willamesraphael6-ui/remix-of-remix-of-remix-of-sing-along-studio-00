import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Signed URL for the user's own recording (recordings bucket is private).
export const getRecordingDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { performanceId: string }) => input)
  .handler(async ({ data, context }): Promise<{ url: string | null; title: string | null }> => {
    const { data: perf, error } = await context.supabase
      .from("performances")
      .select("audio_path, title, user_id")
      .eq("id", data.performanceId)
      .maybeSingle();
    if (error) throw error;
    if (!perf || perf.user_id !== context.userId || !perf.audio_path) return { url: null, title: null };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const signed = await supabaseAdmin.storage.from("recordings").createSignedUrl(perf.audio_path, 60 * 10, {
      download: `${(perf.title ?? "cantaja").replace(/[^\w\-]+/g, "_")}.wav`,
    });
    if (signed.error) throw signed.error;
    return { url: signed.data.signedUrl, title: perf.title };
  });

// Signed URL for an avatar path stored in profiles.avatar_url.
export const getAvatarSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { path: string }) => input)
  .handler(async ({ data, context }): Promise<{ url: string | null }> => {
    if (!data.path || !data.path.startsWith(`${context.userId}/`)) return { url: null };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const signed = await supabaseAdmin.storage.from("avatars").createSignedUrl(data.path, 60 * 60 * 24 * 7);
    if (signed.error) return { url: null };
    return { url: signed.data.signedUrl };
  });
