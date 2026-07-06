import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { getAvatarSignedUrl } from "@/lib/storage.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Save, Trophy, Music, Camera, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({ component: ProfileScreen });

function ProfileScreen() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ["me"], queryFn: () => getMyProfile() });
  const [stageName, setStageName] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (q.data?.profile) {
      setStageName(q.data.profile.stage_name ?? "");
      setCity(q.data.profile.city ?? "");
      setBio(q.data.profile.bio ?? "");
    }
  }, [q.data?.profile]);

  const avatarPath = q.data?.profile?.avatar_url ?? null;
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!avatarPath) { setAvatarUrl(null); return; }
      if (avatarPath.startsWith("http")) { setAvatarUrl(avatarPath); return; }
      const r = await getAvatarSignedUrl({ data: { path: avatarPath } });
      if (alive) setAvatarUrl(r.url);
    })();
    return () => { alive = false; };
  }, [avatarPath]);

  const save = useMutation({
    mutationFn: () => updateMyProfile({ data: { stage_name: stageName, city, bio } }),
    onSuccess: () => { toast.success("Perfil salvo!"); qc.invalidateQueries({ queryKey: ["me"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Escolhe uma imagem"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Foto muito grande (máx 5MB)"); return; }
    setUploading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Sessão expirou");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${uid}/avatar-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("avatars").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (up.error) throw up.error;
      await updateMyProfile({ data: { avatar_url: path } });
      toast.success("Foto atualizada!");
      qc.invalidateQueries({ queryKey: ["me"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  const p = q.data?.profile;

  return (
    <div className="px-5 pt-4 pb-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Meu perfil</h1>

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="relative w-20 h-20 rounded-full neon-gradient flex items-center justify-center text-3xl font-bold text-white overflow-hidden disabled:opacity-60"
          aria-label="Trocar foto"
        >
          {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : (stageName[0]?.toUpperCase() || "?")}
          <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-background border-2 border-primary flex items-center justify-center">
            {uploading ? <Loader2 className="w-3 h-3 animate-spin text-primary" /> : <Camera className="w-3 h-3 text-primary" />}
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
        <div className="flex-1">
          <p className="font-bold">{p?.stage_name}</p>
          <p className="text-xs text-muted-foreground">{p?.city || "—"}</p>
          <p className="text-[11px] text-primary mt-1">Toque na foto para trocar</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <Stat icon={<Music className="w-4 h-4" />} label="Cantadas" value={p?.performances_count ?? 0} />
        <Stat icon={<Trophy className="w-4 h-4" />} label="Melhor" value={p?.best_score ?? 0} />
        <Stat icon={<Trophy className="w-4 h-4" />} label="Média" value={p && p.performances_count > 0 ? Math.round(Number(p.total_score) / p.performances_count) : 0} />
      </div>

      <div className="space-y-3">
        <Field label="Nome de palco"><input value={stageName} onChange={(e) => setStageName(e.target.value)} maxLength={40} className="w-full glass rounded-2xl px-4 py-3 outline-none" /></Field>
        <Field label="Cidade"><input value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} className="w-full glass rounded-2xl px-4 py-3 outline-none" /></Field>
        <Field label="Bio"><textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} rows={3} className="w-full glass rounded-2xl px-4 py-3 outline-none resize-none" /></Field>
      </div>

      <button onClick={() => save.mutate()} disabled={save.isPending} className="mt-4 w-full rounded-2xl neon-gradient py-4 font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50">
        <Save className="w-4 h-4" /> Salvar
      </button>

      <button onClick={signOut} className="mt-6 w-full text-sm text-muted-foreground flex items-center justify-center gap-2 py-2">
        <LogOut className="w-4 h-4" /> Sair
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><span className="text-xs text-muted-foreground px-1">{label}</span><div className="mt-1">{children}</div></label>);
}
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-3 text-center">
      <div className="flex justify-center text-primary">{icon}</div>
      <p className="text-lg font-bold mt-1">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
