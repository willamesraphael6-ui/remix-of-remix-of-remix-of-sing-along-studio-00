import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";

export const getLeaderboard = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from("profiles")
    .select("id, stage_name, avatar_url, city, total_score, performances_count, best_score, points, current_streak, longest_streak")
    .gt("performances_count", 0)
    .order("points", { ascending: false })
    .limit(50);
  if (error) throw error;
  const items = (data ?? []).map((p) => ({
    ...p,
    average: p.performances_count > 0 ? Math.round(Number(p.total_score) / p.performances_count) : 0,
  }));
  return { items };
});

export const getPerformanceById = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: perf, error } = await context.supabase
      .from("performances")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    return { performance: perf };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return { profile: data };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { stage_name?: string; city?: string; bio?: string; avatar_url?: string; theme?: string }) => input)
  .handler(async ({ data, context }) => {
    const patch: { stage_name?: string; city?: string; bio?: string; avatar_url?: string; theme?: string } = {};
    if (data.stage_name !== undefined) patch.stage_name = data.stage_name.slice(0, 40);
    if (data.city !== undefined) patch.city = data.city.slice(0, 60);
    if (data.bio !== undefined) patch.bio = data.bio.slice(0, 200);
    if (data.avatar_url !== undefined) patch.avatar_url = data.avatar_url;
    if (data.theme !== undefined) patch.theme = data.theme.slice(0, 20);
    const { error } = await context.supabase.from("profiles").update(patch).eq("id", context.userId);
    if (error) throw error;
    return { ok: true };
  });
