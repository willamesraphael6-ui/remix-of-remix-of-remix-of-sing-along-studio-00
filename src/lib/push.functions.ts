import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { endpoint: string; p256dh: string; auth: string; notify_hour?: number; routine_text?: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: context.userId,
          endpoint: data.endpoint,
          p256dh: data.p256dh,
          auth: data.auth,
          notify_hour: data.notify_hour ?? 19,
          routine_text: data.routine_text ?? null,
          enabled: true,
        },
        { onConflict: "endpoint" },
      );
    if (error) throw error;
    return { ok: true };
  });

export const updateNotifyHour = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { hour: number; enabled: boolean; routine_text?: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("push_subscriptions")
      .update({ notify_hour: data.hour, enabled: data.enabled, routine_text: data.routine_text ?? null })
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const getMyPushSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("push_subscriptions")
      .select("notify_hour, enabled, endpoint, routine_text")
      .eq("user_id", context.userId)
      .limit(1)
      .maybeSingle();
    return { settings: data };
  });
