import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Sparkles, Trophy, Bell } from "lucide-react";
import welcomeImage from "@/assets/welcome-karaoke.jpg.asset.json";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/home" });
  },
  component: Landing,
});

function Landing() {
  const [isIOS, setIsIOS] = useState(false);
  useEffect(() => { setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent)); }, []);

  return (
    <div className="min-h-dvh flex flex-col safe-top safe-bottom px-6">
      <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
        <div className="w-full max-w-xs rounded-3xl overflow-hidden mb-6 glass" style={{ boxShadow: "var(--shadow-glow)" }}>
          <img src={welcomeImage.url} alt="Amigos cantando karaokê juntos" className="w-full h-44 object-cover" />
        </div>
        <div className="w-20 h-20 rounded-3xl neon-gradient flex items-center justify-center mb-4" style={{ boxShadow: "var(--shadow-glow)" }}>
          <Mic className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight">Canta<span className="neon-text">Já</span></h1>
        <p className="mt-3 text-muted-foreground max-w-xs">Karaokê no seu bolso. Cante, receba nota da IA e dispute quem é o melhor do canto.</p>

        <div className="mt-10 grid grid-cols-3 gap-3 w-full max-w-xs">
          <Feature icon={<Sparkles className="w-5 h-5" />} label="IA avalia" />
          <Feature icon={<Trophy className="w-5 h-5" />} label="Ranking" />
          <Feature icon={<Bell className="w-5 h-5" />} label="Lembrete" />
        </div>
      </div>

      <div className="space-y-3 pb-6">
        <Link to="/auth" search={{ mode: "signup" }} className="block w-full rounded-2xl neon-gradient py-4 text-center font-semibold text-white text-lg" style={{ boxShadow: "var(--shadow-neon)" }}>
          Criar meu perfil
        </Link>
        <Link to="/auth" search={{ mode: "signin" }} className="block w-full rounded-2xl glass py-4 text-center font-medium">
          Já tenho conta
        </Link>
        {isIOS && (
          <p className="text-center text-xs text-muted-foreground pt-2">
            Para receber notificações no iPhone: toque em <span className="text-foreground">Compartilhar</span> → <span className="text-foreground">Adicionar à Tela de Início</span>.
          </p>
        )}
      </div>
    </div>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="glass rounded-2xl p-3 flex flex-col items-center gap-1 text-xs">
      <div className="text-primary">{icon}</div>
      <span>{label}</span>
    </div>
  );
}
