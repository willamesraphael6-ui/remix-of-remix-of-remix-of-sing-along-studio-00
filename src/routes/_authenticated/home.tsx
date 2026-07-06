import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { searchKaraoke, resolveYouTubeLink } from "@/lib/youtube.functions";
import { addSongToHistory } from "@/lib/history.functions";
import { getLeaderboard } from "@/lib/leaderboard.functions";
import { getMyProfile } from "@/lib/profile.functions";
import { Search, Link as LinkIcon, Play, Trophy, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/home")({ component: HomeScreen });

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60); const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function HomeScreen() {
  const [query, setQuery] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [showLink, setShowLink] = useState(false);
  const navigate = useNavigate();

  const profile = useQuery({ queryKey: ["me"], queryFn: () => getMyProfile() });
  const leaders = useQuery({ queryKey: ["leaderboard-top"], queryFn: () => getLeaderboard() });

  const search = useMutation({
    mutationFn: (q: string) => searchKaraoke({ data: { query: q } }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro na busca"),
  });

  const resolveLink = useMutation({
    mutationFn: (url: string) => resolveYouTubeLink({ data: { url } }),
    onSuccess: async ({ item }) => {
      if (!item) return toast.error("Link inválido");
      await addSongToHistory({ data: { youtube_id: item.id, title: item.title, channel: item.channel, duration: item.duration, thumbnail_url: item.thumbnail } });
      navigate({ to: "/sing/$videoId", params: { videoId: item.id }, search: { title: item.title } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  async function pickSong(it: { id: string; title: string; channel: string; duration: number; thumbnail: string }) {
    await addSongToHistory({ data: { youtube_id: it.id, title: it.title, channel: it.channel, duration: it.duration, thumbnail_url: it.thumbnail } });
    navigate({ to: "/sing/$videoId", params: { videoId: it.id }, search: { title: it.title } });
  }

  const top = leaders.data?.items?.[0];
  const stage = profile.data?.profile?.stage_name ?? "Cantor";

  return (
    <div className="px-5 pt-4 max-w-md mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground">Olá,</p>
          <h1 className="text-2xl font-bold">{stage} 🎤</h1>
        </div>
        <Link to="/profile" className="w-11 h-11 rounded-full glass flex items-center justify-center overflow-hidden">
          {profile.data?.profile?.avatar_url
            ? <img src={profile.data.profile.avatar_url} alt="" className="w-full h-full object-cover" />
            : <span className="text-lg">{stage[0]?.toUpperCase() ?? "C"}</span>}
        </Link>
      </header>

      {top && (
        <Link to="/leaderboard" className="block mb-5 rounded-2xl neon-gradient p-4 relative overflow-hidden" style={{ boxShadow: "var(--shadow-glow)" }}>
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-white" />
            <div className="flex-1">
              <p className="text-xs text-white/80">Melhor do canto</p>
              <p className="font-bold text-white truncate">{top.stage_name}</p>
              <p className="text-xs text-white/80">Média {top.average} pts</p>
            </div>
          </div>
        </Link>
      )}

      <form onSubmit={(e) => { e.preventDefault(); if (query.trim()) search.mutate(query.trim()); }} className="mb-3">
        <div className="glass rounded-2xl flex items-center px-4">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome da música ou artista" className="flex-1 bg-transparent px-3 py-4 outline-none" />
          {search.isPending && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
      </form>

      <button onClick={() => setShowLink((v) => !v)} className="w-full text-left text-sm text-muted-foreground flex items-center gap-2 px-2 py-1">
        <LinkIcon className="w-4 h-4" /> Colar link do YouTube
      </button>
      {showLink && (
        <div className="glass rounded-2xl flex items-center px-4 mt-2">
          <input value={linkInput} onChange={(e) => setLinkInput(e.target.value)} placeholder="https://youtu.be/..." className="flex-1 bg-transparent px-1 py-3 outline-none text-sm" />
          <button onClick={() => linkInput && resolveLink.mutate(linkInput)} disabled={resolveLink.isPending} className="text-sm text-primary font-semibold px-2">Abrir</button>
        </div>
      )}

      <div className="mt-6">
        {search.data?.items?.length ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground px-1 mb-1">Resultados</p>
            {search.data.items.map((it) => (
              <button key={it.id} onClick={() => pickSong(it)} className="w-full glass rounded-2xl p-3 flex items-center gap-3 text-left hover:border-primary transition">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  {it.thumbnail && <img src={it.thumbnail} alt="" className="w-full h-full object-cover" />}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40"><Play className="w-6 h-6 text-white" /></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">{it.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{it.channel} · {formatDuration(it.duration)}</p>
                  {it.isKaraoke && <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full neon-gradient text-white font-semibold">KARAOKÊ</span>}
                </div>
              </button>
            ))}
          </div>
        ) : (
          !search.isPending && !search.data && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">Busca uma música pra começar 🎶</p>
              <p className="text-xs mt-2">Dica: use fone de ouvido antes de gravar</p>
            </div>
          )
        )}
        {search.data && !search.data.items.length && (
          <div className="text-center py-8 text-muted-foreground text-sm">Nada encontrado. Tenta outro termo.</div>
        )}
      </div>
    </div>
  );
}
