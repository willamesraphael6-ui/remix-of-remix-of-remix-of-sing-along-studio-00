import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

interface YTItem {
  id: string;
  title: string;
  channel: string;
  duration: number;
  thumbnail: string;
  isKaraoke: boolean;
}

function parseISODuration(iso: string): number {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso);
  if (!m) return 0;
  return (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + (+(m[3] || 0));
}

const KARAOKE_HINTS = ["karaoke", "karaokê", "letra", "lyrics", "instrumental", "playback", "sing along", "legendado"];

export const searchKaraoke = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { query: string }) => {
    if (!input?.query || typeof input.query !== "string") throw new Error("query required");
    return { query: input.query.trim().slice(0, 100) };
  })
  .handler(async ({ data }): Promise<{ items: YTItem[] }> => {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) throw new Error("YOUTUBE_API_KEY não configurada");

    const q = encodeURIComponent(`${data.query} karaoke com letra`);
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=20&q=${q}&key=${key}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) throw new Error(`YouTube search failed: ${searchRes.status}`);
    const searchJson = await searchRes.json() as { items?: Array<{ id: { videoId: string }; snippet: { title: string; channelTitle: string; thumbnails: { medium?: { url: string }; default?: { url: string } } } }> };
    const ids = (searchJson.items ?? []).map((i) => i.id.videoId).filter(Boolean);
    if (!ids.length) return { items: [] };

    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${ids.join(",")}&key=${key}`;
    const detailsRes = await fetch(detailsUrl);
    if (!detailsRes.ok) throw new Error(`YouTube details failed: ${detailsRes.status}`);
    const detailsJson = await detailsRes.json() as { items?: Array<{ id: string; contentDetails: { duration: string }; statistics: { viewCount?: string } }> };
    const detailMap = new Map(detailsJson.items?.map((i) => [i.id, i]) ?? []);

    const items: YTItem[] = (searchJson.items ?? [])
      .map((it): YTItem | null => {
        const id = it.id.videoId;
        const det = detailMap.get(id);
        if (!det) return null;
        const duration = parseISODuration(det.contentDetails.duration);
        if (duration < 30 || duration > 900) return null;
        const title = it.snippet.title;
        const low = title.toLowerCase();
        return {
          id,
          title,
          channel: it.snippet.channelTitle,
          duration,
          thumbnail: it.snippet.thumbnails.medium?.url || it.snippet.thumbnails.default?.url || "",
          isKaraoke: KARAOKE_HINTS.some((k) => low.includes(k)),
        };
      })
      .filter((x): x is YTItem => x !== null)
      .sort((a, b) => Number(b.isKaraoke) - Number(a.isKaraoke));

    return { items };
  });

function extractVideoIdFromUrl(input: string): string | null {
  const trimmed = input.trim();
  const patterns = [
    /(?:v=|\/embed\/|\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ];
  for (const p of patterns) { const m = p.exec(trimmed); if (m) return m[1]; }
  return null;
}

export const resolveYouTubeLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { url: string }) => {
    if (!input?.url) throw new Error("url required");
    return { url: input.url };
  })
  .handler(async ({ data }): Promise<{ item: YTItem | null }> => {
    const id = extractVideoIdFromUrl(data.url);
    if (!id) return { item: null };
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) throw new Error("YOUTUBE_API_KEY não configurada");
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${id}&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("YouTube API error");
    const json = await res.json() as { items?: Array<{ id: string; snippet: { title: string; channelTitle: string; thumbnails: { medium?: { url: string }; default?: { url: string } } }; contentDetails: { duration: string } }> };
    const v = json.items?.[0];
    if (!v) return { item: null };
    const low = v.snippet.title.toLowerCase();
    return {
      item: {
        id: v.id,
        title: v.snippet.title,
        channel: v.snippet.channelTitle,
        duration: parseISODuration(v.contentDetails.duration),
        thumbnail: v.snippet.thumbnails.medium?.url || v.snippet.thumbnails.default?.url || "",
        isKaraoke: KARAOKE_HINTS.some((k) => low.includes(k)),
      },
    };
  });
