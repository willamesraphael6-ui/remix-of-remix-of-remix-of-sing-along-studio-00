import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "@/lib/leaderboard.functions";
import { Trophy, Crown, Flame } from "lucide-react";
import { getBadgesFor } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/leaderboard")({ component: LeaderboardScreen });

function LeaderboardScreen() {
  const q = useQuery({ queryKey: ["leaderboard"], queryFn: () => getLeaderboard() });
  const items = q.data?.items ?? [];
  const podium = items.slice(0, 3);
  const rest = items.slice(3);

  return (
    <div className="px-5 pt-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full neon-gradient flex items-center justify-center"><Trophy className="w-5 h-5 text-white" /></div>
        <div><h1 className="text-2xl font-bold">Ranking</h1><p className="text-xs text-muted-foreground">Melhor do canto</p></div>
      </div>

      {q.isLoading && <p className="text-center py-8 text-muted-foreground">Carregando...</p>}

      {podium.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[1, 0, 2].map((idx) => {
            const p = podium[idx]; if (!p) return <div key={idx} />;
            const rank = idx + 1;
            const height = rank === 1 ? "h-32" : rank === 2 ? "h-24" : "h-20";
            return (
              <div key={p.id} className="flex flex-col items-center">
                {rank === 1 && <Crown className="w-6 h-6 text-yellow-300 mb-1" />}
                <div className="w-14 h-14 rounded-full overflow-hidden glass mb-2 flex items-center justify-center">
                  {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="font-bold">{p.stage_name[0]?.toUpperCase()}</span>}
                </div>
                <p className="text-xs font-medium text-center truncate w-full">{p.stage_name}</p>
                <p className="text-[10px] text-muted-foreground">{p.average} pts</p>
                <div className={`w-full ${height} mt-2 rounded-t-xl ${rank === 1 ? "neon-gradient" : "glass"} flex items-start justify-center pt-2`}>
                  <span className={`text-lg font-bold ${rank === 1 ? "text-white" : "text-muted-foreground"}`}>{rank}º</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        {rest.map((p: typeof items[number], i: number) => {
          const meta = p as typeof p & { points?: number; current_streak?: number; longest_streak?: number };
          const badges = getBadgesFor({
            points: Number(meta.points ?? 0),
            longest_streak: Number(meta.longest_streak ?? 0),
            performances_count: p.performances_count,
            best_score: p.best_score,
          }).slice(0, 2);
          const streak = Number(meta.current_streak ?? 0);
          return (
          <div key={p.id} className="glass rounded-2xl p-3 flex items-center gap-3">
            <span className="w-6 text-center text-sm font-bold text-muted-foreground">{i + 4}</span>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : <span>{p.stage_name[0]?.toUpperCase()}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate flex items-center gap-1">
                {p.stage_name}
                {streak > 0 && <span className="text-[10px] text-orange-400 flex items-center gap-0.5"><Flame className="w-3 h-3" />{streak}</span>}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {Number(meta.points ?? 0)} pts · {badges.map((b) => b.emoji).join(" ")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold neon-text">{p.average}</p>
              <p className="text-[10px] text-muted-foreground">média</p>
            </div>
          </div>
          );
        })}
      </div>

      {items.length === 0 && !q.isLoading && (
        <div className="text-center py-16 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Seja o primeiro do ranking! 🎤</p>
        </div>
      )}
    </div>
  );
}
