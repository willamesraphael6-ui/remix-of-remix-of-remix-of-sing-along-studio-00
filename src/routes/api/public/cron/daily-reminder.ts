import { createFileRoute } from "@tanstack/react-router";
import webpush from "web-push";

// Called by pg_cron every hour; sends a push to every enabled subscription.
export const Route = createFileRoute("/api/public/cron/daily-reminder")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        webpush.setVapidDetails(
          process.env.VAPID_SUBJECT || "mailto:hello@cantaja.app",
          process.env.VAPID_PUBLIC_KEY!,
          process.env.VAPID_PRIVATE_KEY!,
        );

        // Brasil (America/Sao_Paulo) — UTC-3, sem horário de verão desde 2019.
        const nowUtc = new Date();
        const brHour = (nowUtc.getUTCHours() + 24 - 3) % 24;

        const { data: subs, error } = await supabaseAdmin
          .from("push_subscriptions")
          .select("id, endpoint, p256dh, auth, routine_text")
          .eq("enabled", true)
          .eq("notify_hour", brHour);
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

        const messages = [
          { title: "Hora de cantar 🎤", body: "Solta a voz agora no CantaJá." },
          { title: "Manda um hit ✨", body: "Escolhe uma música e sobe no ranking." },
          { title: "Sua voz está esperando 🎶", body: "Quem será o melhor do canto essa hora?" },
          { title: "Aquecimento vocal 🔥", body: "Uma música rapidinha e você já pontua." },
        ];

        let sent = 0;
        const stale: string[] = [];
        await Promise.all(
          (subs ?? []).map(async (s) => {
            const routine = (s.routine_text ?? "").trim();
            const pick = routine
              ? { title: "Sua rotina de canto 🎤", body: routine.slice(0, 180) }
              : messages[Math.floor(Math.random() * messages.length)];
            const payload = JSON.stringify({ ...pick, url: "/home" });
            try {
              await webpush.sendNotification(
                { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                payload,
              );
              sent++;
            } catch (err: unknown) {
              const status = (err as { statusCode?: number })?.statusCode;
              if (status === 404 || status === 410) stale.push(s.id);
            }
          }),
        );
        if (stale.length) {
          await supabaseAdmin.from("push_subscriptions").delete().in("id", stale);
        }
        return new Response(JSON.stringify({ sent, removed: stale.length, hour: brHour }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
