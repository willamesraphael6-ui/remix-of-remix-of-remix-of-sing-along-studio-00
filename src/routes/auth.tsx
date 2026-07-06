import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Mic, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Mode = "signin" | "signup";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { mode?: Mode } => ({
    mode: s.mode === "signup" || s.mode === "signin" ? s.mode : "signin",
  }),
  component: AuthScreen,
});

function AuthScreen() {
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<Mode>(initialMode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stageName, setStageName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!stageName.trim()) { toast.error("Escolhe seu nome de palco"); setLoading(false); return; }
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/home", data: { stage_name: stageName.trim() } },
        });
        if (error) throw error;
        toast.success("Conta criada! Já pode cantar 🎤");
        navigate({ to: "/home" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/home" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no login");
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) { toast.error(result.error.message ?? "Erro no Google"); setLoading(false); return; }
      if (result.redirected) return;
      navigate({ to: "/home" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no Google");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col safe-top safe-bottom px-6">
      <div className="pt-2">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="w-4 h-4" /> Voltar</Link>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl neon-gradient flex items-center justify-center"><Mic className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="text-2xl font-bold">{mode === "signup" ? "Criar perfil" : "Entrar"}</h1>
            <p className="text-sm text-muted-foreground">{mode === "signup" ? "Escolhe seu nome de palco" : "Bem-vindo de volta"}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <input value={stageName} onChange={(e) => setStageName(e.target.value)} placeholder="Nome de palco" maxLength={40} className="w-full glass rounded-2xl px-5 py-4 outline-none focus:border-primary" />
          )}
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="email" className="w-full glass rounded-2xl px-5 py-4 outline-none focus:border-primary" />
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha (mín. 6)" autoComplete={mode === "signup" ? "new-password" : "current-password"} className="w-full glass rounded-2xl px-5 py-4 outline-none focus:border-primary" />
          <button type="submit" disabled={loading} className="w-full rounded-2xl neon-gradient py-4 font-semibold text-white text-lg disabled:opacity-50" style={{ boxShadow: "var(--shadow-neon)" }}>
            {loading ? "..." : mode === "signup" ? "Criar conta" : "Entrar"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">ou</span><div className="flex-1 h-px bg-border" />
        </div>

        <button onClick={handleGoogle} disabled={loading} className="w-full rounded-2xl glass py-4 font-medium flex items-center justify-center gap-3 disabled:opacity-50">
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continuar com Google
        </button>

        <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="mt-6 text-center w-full text-sm text-muted-foreground">
          {mode === "signup" ? "Já tem conta? Entrar" : "Ainda não tem conta? Criar agora"}
        </button>
      </div>
    </div>
  );
}
