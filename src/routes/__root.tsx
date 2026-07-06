import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div>
        <h1 className="text-6xl font-bold neon-text">404</h1>
        <p className="mt-3 text-muted-foreground">Página não encontrada</p>
        <Link to="/" className="mt-6 inline-flex rounded-full neon-gradient px-6 py-3 text-sm font-semibold text-white">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div>
        <h1 className="text-xl font-semibold">Deu um problema</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tenta de novo ou volta ao início.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-full neon-gradient px-5 py-2 text-sm font-semibold text-white">Tentar de novo</button>
          <a href="/" className="rounded-full border border-border px-5 py-2 text-sm">Início</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" },
      { title: "CantaJá — Karaokê com IA e ranking" },
      { name: "description", content: "Cante suas músicas favoritas, receba nota da IA e dispute o ranking do melhor do canto. PWA para iPhone com lembrete diário." },
      { name: "theme-color", content: "#c026d3" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "CantaJá" },
      { property: "og:title", content: "CantaJá — Karaokê com IA e ranking" },
      { property: "og:description", content: "Cante suas músicas favoritas, receba nota da IA e dispute o ranking do melhor do canto. PWA para iPhone com lembrete diário." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "CantaJá — Karaokê com IA e ranking" },
      { name: "twitter:description", content: "Cante suas músicas favoritas, receba nota da IA e dispute o ranking do melhor do canto. PWA para iPhone com lembrete diário." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/896ab72a-4978-4dd9-9a29-bb4f0af3c7ff/id-preview-b54cd2bb--e57caaad-9078-49f2-902a-c9b9d109ae88.lovable.app-1783294025998.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/896ab72a-4978-4dd9-9a29-bb4f0af3c7ff/id-preview-b54cd2bb--e57caaad-9078-49f2-902a-c9b9d109ae88.lovable.app-1783294025998.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/icon-512.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/icon-512.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      }
    });
    // Register push service worker in production (not preview iframe)
    if ("serviceWorker" in navigator) {
      const host = window.location.hostname;
      const isPreview = host.startsWith("id-preview--") || host.startsWith("preview--");
      if (!isPreview) navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return () => { sub.subscription.unsubscribe(); };
  }, [queryClient, router]);
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
