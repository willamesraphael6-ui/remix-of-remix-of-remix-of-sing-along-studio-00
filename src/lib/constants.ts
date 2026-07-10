// Public VAPID key — safe to expose to the browser (it's the public half of the keypair).
// The private key stays server-only in VAPID_PRIVATE_KEY.
export const VAPID_PUBLIC_KEY =
  "BJK6PwCErttNStG9iHwbkZGPRMi5PAFzYEuVhN51z6T3o4XOUH1zGNDg5-mf4FGtpK4hBXJMILjDrfMkFNxGbzA";

export const APP_NAME = "CantaJá";

// --- Sistema de recompensa (pontos) ---
// A cada música cantada: 10 pts fixos + a nota (0–100) + streak_bonus (2 pts × dias, até 30).

export const RELAX_UNLOCK_POINTS = 200;

export type ThemeId = "neon" | "sunset" | "gold";

export const THEMES: Record<ThemeId, { label: string; unlockPoints: number; description: string; primary: string; accent: string; glow: string }> = {
  neon:   { label: "Neon (padrão)", unlockPoints: 0,   description: "Rosa/roxo elétrico", primary: "oklch(0.72 0.24 330)", accent: "oklch(0.66 0.22 285)", glow: "oklch(0.72 0.24 330)" },
  sunset: { label: "Sunset",         unlockPoints: 300, description: "Laranja quente + rosa", primary: "oklch(0.75 0.20 40)",  accent: "oklch(0.65 0.22 15)",  glow: "oklch(0.75 0.20 40)" },
  gold:   { label: "Ouro",           unlockPoints: 800, description: "Dourado premium", primary: "oklch(0.82 0.16 90)",  accent: "oklch(0.72 0.14 60)",  glow: "oklch(0.82 0.16 90)" },
};

// Badges exibidos no perfil / ranking.
export function getBadgesFor(input: { points: number; longest_streak: number; performances_count: number; best_score: number }): Array<{ id: string; label: string; emoji: string }> {
  const badges: Array<{ id: string; label: string; emoji: string }> = [];
  if (input.performances_count >= 1) badges.push({ id: "first", label: "Estreante", emoji: "🎤" });
  if (input.performances_count >= 10) badges.push({ id: "ten", label: "10 músicas", emoji: "🎶" });
  if (input.performances_count >= 50) badges.push({ id: "fifty", label: "50 músicas", emoji: "🏅" });
  if (input.best_score >= 90) badges.push({ id: "diva", label: "Diva", emoji: "🌟" });
  if (input.best_score >= 100) badges.push({ id: "perfect", label: "Nota 100", emoji: "💯" });
  if (input.longest_streak >= 3) badges.push({ id: "streak3", label: "3 dias seguidos", emoji: "🔥" });
  if (input.longest_streak >= 7) badges.push({ id: "streak7", label: "Semana inteira", emoji: "🔥🔥" });
  if (input.points >= 500) badges.push({ id: "p500", label: "500 pts", emoji: "✨" });
  if (input.points >= 1000) badges.push({ id: "p1000", label: "Mil pontos", emoji: "👑" });
  return badges;
}
