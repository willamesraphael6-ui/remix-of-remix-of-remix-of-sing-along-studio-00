import { useEffect, useState } from "react";
import { THEMES, type ThemeId } from "@/lib/constants";

const STORAGE_KEY = "cantaja:theme";

export function applyTheme(id: ThemeId) {
  if (typeof document === "undefined") return;
  const t = THEMES[id] ?? THEMES.neon;
  const root = document.documentElement;
  root.style.setProperty("--primary", t.primary);
  root.style.setProperty("--accent", t.accent);
  root.style.setProperty("--ring", t.primary);
  root.style.setProperty("--shadow-glow", `0 0 40px ${t.glow}`);
  root.setAttribute("data-theme", id);
  try { localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
}

export function getStoredTheme(): ThemeId {
  if (typeof window === "undefined") return "neon";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && v in THEMES) return v as ThemeId;
  } catch { /* ignore */ }
  return "neon";
}

export function useTheme(): [ThemeId, (id: ThemeId) => void] {
  const [theme, setTheme] = useState<ThemeId>("neon");
  useEffect(() => {
    const t = getStoredTheme();
    setTheme(t);
    applyTheme(t);
  }, []);
  return [theme, (id: ThemeId) => { setTheme(id); applyTheme(id); }];
}