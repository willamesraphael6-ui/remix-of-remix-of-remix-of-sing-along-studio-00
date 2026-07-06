import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getPerformanceById } from "@/lib/leaderboard.functions";
import { getRecordingDownloadUrl } from "@/lib/storage.functions";
import { Trophy, RotateCw, Home, Sparkles, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/result/$id")({ component: ResultScreen });

function ResultScreen() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["performance", id],
    queryFn: () => getPerformanceById({ data: { id } }),
  });

  const dl = useMutation({
    mutationFn: () => getRecordingDownloadUrl({ data: { performanceId: id } }),
    onSuccess: (res) => {
      if (!res.url) { toast.error("Áudio não disponível"); return; }
      window.location.href = res.url;
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const perf = q.data?.performance;
  const score = perf?.score ?? 0;
  const grade = score >= 85 ? "🔥 Sensacional!" : score >= 70 ? "🌟 Muito bom!" : score >= 50 ? "👏 Boa!" : "🎤 Continua treinando!";

  return (
    <div className="px-5 pt-4 pb-8 max-w-md mx-auto">
      {q.isLoading && <p className="text-center py-20 text-muted-foreground">Carregando...</p>}
      {perf && (
        <>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Sua nota</p>
            <div className="my-4 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full flex items-center justify-center relative" style={{ background: "conic-gradient(oklch(0.72 0.24 330) " + (score * 3.6) + "deg, oklch(0.28 0.06 300) 0deg)", boxShadow: "var(--shadow-glow)" }}>
                <div className="w-40 h-40 rounded-full bg-background flex flex-col items-center justify-center">
                  <span className="text-6xl font-bold neon-text">{score}</span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
              </div>
            </div>
            <p className="text-xl font-semibold">{grade}</p>
            <p className="text-sm text-muted-foreground mt-1 truncate">{perf.title}</p>
          </div>

          {perf.ai_feedback && (
            <div className="glass rounded-2xl p-4 mb-4 flex gap-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm">{perf.ai_feedback}</p>
            </div>
          )}

          <div className="space-y-3 mt-6">
            <button
              onClick={() => dl.mutate()}
              disabled={dl.isPending}
              className="flex items-center justify-center gap-2 w-full rounded-2xl glass py-4 font-medium disabled:opacity-50"
            >
              {dl.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Baixar minha gravação
            </button>
            <p className="text-[11px] text-muted-foreground text-center -mt-1">
              A gravação sai como você cantou. Para ouvir com a música, deixe a caixa de som tocando ao gravar (sem fone).
            </p>
            <Link to="/sing/$videoId" params={{ videoId: perf.youtube_id }} search={{ title: perf.title }} className="flex items-center justify-center gap-2 w-full rounded-2xl glass py-4 font-medium">
              <RotateCw className="w-4 h-4" /> Cantar de novo
            </Link>
            <Link to="/leaderboard" className="flex items-center justify-center gap-2 w-full rounded-2xl neon-gradient py-4 font-semibold text-white">
              <Trophy className="w-4 h-4" /> Ver ranking
            </Link>
            <Link to="/home" className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground py-2">
              <Home className="w-4 h-4" /> Início
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
