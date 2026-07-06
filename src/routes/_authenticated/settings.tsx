import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getMyPushSettings, updateNotifyHour } from "@/lib/push.functions";
import { subscribeToPush, isIOS, isPWAInstalled } from "@/lib/push-client";
import { Bell, Share, PlusSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsScreen });

function SettingsScreen() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["push-settings"], queryFn: () => getMyPushSettings() });
  const [hour, setHour] = useState(19);
  const [enabled, setEnabled] = useState(true);
  const [routineText, setRoutineText] = useState("");
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setInstalled(isPWAInstalled());
    setIos(isIOS());
  }, []);
  useEffect(() => {
    if (q.data?.settings) {
      setHour(q.data.settings.notify_hour);
      setEnabled(q.data.settings.enabled);
      setRoutineText(q.data.settings.routine_text ?? "");
    }
  }, [q.data]);

  const save = useMutation({
    mutationFn: () => updateNotifyHour({ data: { hour, enabled, routine_text: routineText } }),
    onSuccess: () => { toast.success("Preferências salvas"); qc.invalidateQueries({ queryKey: ["push-settings"] }); },
  });

  async function activate() {
    const r = await subscribeToPush(hour);
    if (r.ok) { toast.success("Notificações ativadas 🔔"); qc.invalidateQueries({ queryKey: ["push-settings"] }); return; }
    if (r.reason === "install_first") toast.error("Instale o app na tela de início primeiro (iPhone)");
    else if (r.reason === "denied") toast.error("Permissão negada nas configurações do navegador");
    else if (r.reason === "unsupported") toast.error("Notificações não são suportadas neste dispositivo");
    else toast.error("Não deu certo. Tenta de novo.");
  }

  const hasSubscription = Boolean(q.data?.settings?.endpoint);

  return (
    <div className="px-5 pt-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Ajustes</h1>

      {ios && !installed && (
        <div className="glass rounded-2xl p-4 mb-4">
          <p className="font-semibold flex items-center gap-2"><Share className="w-4 h-4 text-primary" /> Instalar no iPhone</p>
          <p className="text-sm text-muted-foreground mt-2">
            1. Toque no botão <span className="text-foreground">Compartilhar</span> no Safari<br />
            2. Escolha <span className="text-foreground">Adicionar à Tela de Início</span> <PlusSquare className="w-3 h-3 inline" /><br />
            3. Abra o CantaJá pelo ícone na tela de início<br />
            Depois disso as notificações liberam.
          </p>
        </div>
      )}

      <section className="glass rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3"><Bell className="w-5 h-5 text-primary" /><h2 className="font-semibold">Lembrete diário</h2></div>
        <p className="text-xs text-muted-foreground mb-3">Uma notificação por dia no horário que você escolher (horário de Brasília), com a mensagem da sua rotina.</p>

        <label className="flex items-center justify-between py-2">
          <span className="text-sm">Ativado</span>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-5 h-5 accent-primary" />
        </label>

        <label className="block mt-3">
          <span className="text-sm">Horário (Brasília)</span>
          <select
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="mt-1 w-full rounded-xl bg-background/40 border border-border px-3 py-2 text-sm"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
            ))}
          </select>
        </label>

        <label className="block mt-3">
          <span className="text-sm">Sua rotina de canto</span>
          <textarea
            value={routineText}
            onChange={(e) => setRoutineText(e.target.value.slice(0, 180))}
            placeholder="Ex.: 10 min de aquecimento, 2 músicas novas e 1 favorita 🎶"
            rows={3}
            className="mt-1 w-full rounded-xl bg-background/40 border border-border px-3 py-2 text-sm resize-none"
          />
          <span className="text-[10px] text-muted-foreground">{routineText.length}/180</span>
        </label>

        {!hasSubscription ? (
          <button onClick={activate} className="mt-4 w-full rounded-2xl neon-gradient py-3 font-semibold text-white">Ativar notificações</button>
        ) : (
          <button onClick={() => save.mutate()} disabled={save.isPending} className="mt-4 w-full rounded-2xl neon-gradient py-3 font-semibold text-white disabled:opacity-50">Salvar preferências</button>
        )}
      </section>

      <p className="text-xs text-muted-foreground text-center mt-6">CantaJá v1.0 · Feito com 💜</p>
    </div>
  );
}
