import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { WavRecorder } from "@/lib/wav-recorder";
import { supabase } from "@/integrations/supabase/client";
import { getLyrics } from "@/lib/lyrics.functions";
import { loadYouTubeApi, type YTPlayer } from "@/lib/youtube-iframe";
import { Mic, Square, ArrowLeft, Loader2, Volume2, FileText, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sing/$videoId")({
  validateSearch: (s: Record<string, unknown>): { title?: string } => ({ title: typeof s.title === "string" ? s.title : undefined }),
  component: SingScreen,
});

function SingScreen() {
  const { videoId } = Route.useParams();
  const { title } = Route.useSearch();
  const navigate = useNavigate();
  const recorderRef = useRef<WavRecorder | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const playerElRef = useRef<HTMLDivElement | null>(null);
  const startSecondsRef = useRef(0);
  const [state, setState] = useState<"idle" | "recording" | "uploading">("idle");
  const [level, setLevel] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);

  const lyricsQ = useQuery({
    queryKey: ["lyrics", title],
    queryFn: () => getLyrics({ data: { title: title ?? "" } }),
    enabled: showLyrics && !!title,
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then((YT) => {
      if (cancelled || !playerElRef.current) return;
      playerRef.current = new YT.Player(playerElRef.current, {
        videoId,
        playerVars: { autoplay: 0, modestbranding: 1, rel: 0, playsinline: 1 },
      });
    });
    return () => {
      cancelled = true;
      try { playerRef.current?.destroy(); } catch { /* noop */ }
      playerRef.current = null;
    };
  }, [videoId]);

  useEffect(() => {
    if (state !== "recording") return;
    const iv = setInterval(() => {
      setLevel(recorderRef.current?.level ?? 0);
      setSeconds((s) => s + 1);
    }, 250);
    return () => clearInterval(iv);
  }, [state]);

  async function start() {
    try {
      const rec = new WavRecorder();
      await rec.start();
      recorderRef.current = rec;
      // Capture where in the YouTube video the recording starts, then play.
      try {
        startSecondsRef.current = playerRef.current?.getCurrentTime() ?? 0;
        playerRef.current?.playVideo();
      } catch { /* player not ready — start_seconds stays 0 */ }
      setSeconds(0);
      setState("recording");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Precisa liberar o microfone");
    }
  }

  async function stop() {
    if (!recorderRef.current) return;
    setState("uploading");
    try {
      const blob = await recorderRef.current.stop();
      try { playerRef.current?.pauseVideo(); } catch { /* noop */ }
      if (blob.size < 3000) {
        toast.error("Gravação muito curta. Tenta de novo.");
        setState("idle"); return;
      }
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) { toast.error("Sessão expirou"); return; }
      const form = new FormData();
      form.append("audio", blob, "recording.wav");
      form.append("youtube_id", videoId);
      form.append("title", title ?? "Sem título");
      form.append("start_seconds", String(Math.max(0, startSecondsRef.current)));
      const res = await fetch("/api/upload-recording", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Falha no envio");
      }
      const { performanceId } = await res.json() as { performanceId: string };
      navigate({ to: "/result/$id", params: { id: performanceId } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro no envio");
      setState("idle");
    }
  }

  const mm = Math.floor(seconds / 4).toString().padStart(2, "0");
  const ss = ((seconds % 4) * 15).toString().padStart(2, "0");

  return (
    <div className="px-5 pt-4 pb-8 max-w-md mx-auto">
      <header className="flex items-center gap-3 mb-4">
        <Link to="/home" className="w-10 h-10 rounded-full glass flex items-center justify-center"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Cantando</p>
          <p className="font-semibold truncate">{title ?? "Karaokê"}</p>
        </div>
        <button
          onClick={() => setShowLyrics((v) => !v)}
          className={`w-10 h-10 rounded-full flex items-center justify-center ${showLyrics ? "neon-gradient text-white" : "glass"}`}
          aria-label="Ver letra"
        >
          {showLyrics ? <X className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
        </button>
      </header>

      <div className="rounded-3xl overflow-hidden aspect-video glass mb-4">
        <div ref={playerElRef} className="w-full h-full" />
      </div>

      {showLyrics && (
        <div className="glass rounded-2xl p-4 mb-4 max-h-72 overflow-y-auto">
          <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">Letra</p>
          {lyricsQ.isLoading && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Buscando letra...</p>}
          {lyricsQ.data?.lyrics && (
            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{lyricsQ.data.lyrics}</pre>
          )}
          {lyricsQ.isError && <p className="text-sm text-muted-foreground">Não consegui buscar a letra agora.</p>}
        </div>
      )}

      <div className="glass rounded-2xl p-3 mb-6 flex items-center gap-3 text-sm">
        <Volume2 className="w-5 h-5 text-primary flex-shrink-0" />
        <span className="text-muted-foreground">Use fone de ouvido ou deixe o volume baixo, senão o microfone só capta a música.</span>
      </div>

      <div className="flex flex-col items-center py-6">
        {state === "recording" && <p className="text-3xl font-mono mb-4">{mm}:{ss}</p>}
        <button
          onClick={state === "recording" ? stop : start}
          disabled={state === "uploading"}
          className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all ${state === "recording" ? "bg-destructive animate-pulse-ring" : "neon-gradient"}`}
          style={{ boxShadow: "var(--shadow-glow)" }}
        >
          {state === "uploading" ? <Loader2 className="w-12 h-12 text-white animate-spin" /> :
            state === "recording" ? <Square className="w-12 h-12 text-white fill-white" /> :
            <Mic className="w-14 h-14 text-white" />}
        </button>
        <p className="mt-4 text-sm text-muted-foreground">
          {state === "idle" && "Toque para começar a gravar"}
          {state === "recording" && "Cantando... toque no quadrado para enviar"}
          {state === "uploading" && "Enviando pra IA avaliar..."}
        </p>
        {state === "recording" && (
          <div className="w-full max-w-xs mt-4 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full neon-gradient transition-all" style={{ width: `${Math.min(100, level * 400)}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}
