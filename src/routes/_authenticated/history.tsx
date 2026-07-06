import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getMyHistory, getMyPerformances } from "@/lib/history.functions";
import { Play, ListMusic } from "lucide-react";

export const Route = createFileRoute("/_authenticated/history")({ component: HistoryScreen });

function HistoryScreen() {
  const perfs = useQuery({ queryKey: ["my-performances"], queryFn: () => getMyPerformances() });
  const hist = useQuery({ queryKey: ["my-history"], queryFn: () => getMyHistory() });

  return (
    <div className="px-5 pt-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-1">Minhas músicas</h1>
      <p className="text-sm text-muted-foreground mb-6">Seu histórico e suas performances</p>

      <section className="mb-8">
        <h2 className="text-xs uppercase text-muted-foreground mb-2 px-1">Performances avaliadas</h2>
        {perfs.data?.items?.length ? (
          <div className="space-y-2">
            {perfs.data.items.map((p) => (
              <Link key={p.id} to="/result/$id" params={{ id: p.id }} className="glass rounded-2xl p-3 flex items-center gap-3 hover:border-primary transition">
                <div className="w-12 h-12 rounded-xl neon-gradient flex items-center justify-center text-white font-bold">{p.score}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">Ainda não avaliada. <Link to="/home" className="text-primary">Cantar agora</Link></p>
        )}
      </section>

      <section>
        <h2 className="text-xs uppercase text-muted-foreground mb-2 px-1">Últimas escolhas</h2>
        {hist.data?.items?.length ? (
          <div className="space-y-2">
            {hist.data.items.map((h) => (
              <Link key={h.id} to="/sing/$videoId" params={{ videoId: h.youtube_id }} search={{ title: h.title }} className="glass rounded-2xl p-3 flex items-center gap-3 hover:border-primary transition">
                <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden flex items-center justify-center relative">
                  {h.thumbnail_url ? <img src={h.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <ListMusic className="w-5 h-5 text-muted-foreground" />}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30"><Play className="w-5 h-5 text-white" /></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{h.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{h.channel}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">Nada por aqui ainda.</p>
        )}
      </section>
    </div>
  );
}
