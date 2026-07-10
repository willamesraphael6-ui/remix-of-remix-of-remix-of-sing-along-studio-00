import { Link, useLocation } from "@tanstack/react-router";
import { Home, Trophy, User, ListMusic, Moon } from "lucide-react";

const items = [
  { to: "/home", label: "Início", icon: Home },
  { to: "/history", label: "Minhas", icon: ListMusic },
  { to: "/leaderboard", label: "Ranking", icon: Trophy },
  { to: "/relax", label: "Relaxar", icon: Moon },
  { to: "/profile", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border glass safe-bottom">
      <div className="max-w-md mx-auto flex justify-around px-2 pt-2">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <Link key={to} to={to} className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className={`w-5 h-5 ${active ? "drop-shadow-[0_0_8px_currentColor]" : ""}`} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
