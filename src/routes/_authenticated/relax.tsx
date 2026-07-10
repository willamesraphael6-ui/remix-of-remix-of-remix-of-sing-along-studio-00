import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getMyProfile } from "@/lib/profile.functions";
import { RELAX_UNLOCK_POINTS } from "@/lib/constants";
import { Moon, Lock, Play } from "lucide-react";

export const Route = createFileRoute("/_authenticated/relax")({ component: RelaxScreen });

// Vídeos ambientes/relaxamento do YouTube (embed).
const TRACKS: Array<{ id: string; title: string; subtitle: string }> = [
  { id: "1ZYbU82GVz4", title: "Chuva pra dormir", subtitle: "8 horas · sons da natureza" },
  { id: "DWcJFNfaw9c", title: "Piano suave", subtitle: "Instrumental relaxante" },
  { id: "77ZozI0rw7w", title: "Lo-fi calmo", subtitle: "Beats pra desacelerar" },
  { id: "lFcSrYw-ARY", title: "Frequência 528 Hz", subtitle: "Meditação e cura" },
  { id: "2OEL4P1Rz04", title: "Ondas do mar", subtitle: "Praia pra sonhar" },
];

function RelaxScreen() {
  const me = useQuery({ queryKey: ["me"], queryFn: () => getMyProfile() });
  const points = Number((me.data?.profile as { points?: number } | undefined)?.points ?? 0);
  const unlocked = points >= RELAX_UNLOCK_POINTS;
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="px-5 pt-4 pb-8 max-w-md mx-auto">
      <header className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full neon-gradient flex items-center justify-center"><Moon className="w-5 h-5 text-white" /></div>
        <div>
          <h1 className="text-2xl font-bold">Relaxamento</h1>
          <p className="text-xs text-muted-foreground">Sons pra dormir e recarregar a voz</p>
        </div>
      </header>

      {!unlocked ? (
        <div className="glass rounded-2xl p-6 text-center">
          <Lock className="w-8 h-8 mx-auto text-primary mb-2" />
          <p className="font-semibold">Desbloqueia com {RELAX_UNLOCK_POINTS} pontos</p>
          <p className="text-sm text-muted-foreground mt-1">Você tem <span className="text-primary font-bold">{points}</span> pts. Cante mais músicas pra liberar.</p>
          <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full neon-gradient" style={{ width: `${Math.min(100, (points / RELAX_UNLOCK_POINTS) * 100)}%` }} />
          </div>
          <Link to="/home" className="inline-block mt-5 rounded-full neon-gradient px-6 py-3 text-sm font-semibold text-white">Cantar agora</Link>
        </div>
      ) : (
        <>
          {active && (
            <div className="rounded-3xl overflow-hidden aspect-video glass mb-4">
              <iframe
                title="Relax"
                src={`https://www.youtube.com/embed/${active}?autoplay=1&rel=0&modestbranding=1`}
                allow="autoplay; encrypted-media"
                className="w-full h-full"
              />
            </div>
          )}
          <div className="space-y-2">
            {TRACKS.map((t) => (
              <button key={t.id} onClick={() => setActive(t.id)} className={`w-full glass rounded-2xl p-3 flex items-center gap-3 text-left hover:border-primary transition ${active === t.id ? "border-primary" : ""}`}>
                <div className="w-12 h-12 rounded-xl neon-gradient flex items-center justify-center text-white"><Play className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
          <p className="mt-6 text-[11px] text-muted-foreground text-center">Use fone antes de dormir. O modo escuro ajuda a descansar a vista 🌙</p>
        </>
      )}
    </div>
  );
}