# CantaJá — PWA de Karaokê (iOS/Mobile)

App mobile-first instalável no iPhone (Adicionar à Tela de Início) com backend real (Lovable Cloud), IA (Lovable AI) e notificações push.

## Escopo confirmado antes de começar

Preciso confirmar 2 pontos importantes por causa das limitações reais do iOS e do YouTube:

1. **Download de vídeos do YouTube**: baixar vídeos do **#!/usr/bin/env python3**
2. **"""**
3. **YouTube Karaoke Downloader**
4. **Pesquisa e baixa músicas em karaokê com letras do YouTube.**
5. **"""**
6. &nbsp;
7. **import os**
8. **import json**
9. **import subprocess**
10. **import sys**
11. **import urllib.parse**
12. **import urllib.request**
13. **import time**
14. &nbsp;
15. &nbsp;
16. **def verificar_yt_dlp():**
17. **"""Verifica se o yt-dlp está instalado."""**
18. **try:**
19. **subprocess.run(["yt-dlp", "--version"], capture_output=True, check=True)**
20. **return True**
21. **except (subprocess.CalledProcessError, FileNotFoundError):**
22. **return False**
23. &nbsp;
24. &nbsp;
25. **def instalar_dependencias():**
26. **"""Tenta instalar as dependências necessárias."""**
27. **print("[INFO] Instalando dependências...")**
28. **try:**
29. **subprocess.run(**
30. **[sys.executable, "-m", "pip", "install", "yt-dlp"],**
31. **check=True,**
32. **capture_output=True**
33. **)**
34. **print("[OK] Dependências instaladas com sucesso!")**
35. **return True**
36. **except subprocess.CalledProcessError:**
37. **print("[ERRO] Falha ao instalar yt-dlp. Instale manualmente: pip install yt-dlp")**
38. **return False**
39. &nbsp;
40. &nbsp;
41. **def buscar_musicas_karaoke(termo_busca, max_resultados=15):**
42. **"""**
43. **Pesquisa músicas no YouTube com foco em karaokê com letras.**
44. **"""**
45. **print(f"[BUSCA] Pesquisando: '{termo_busca} karaoke com letra'...")**
46. ****
47. **# Palavras-chave que indicam karaokê com letra**
48. **query = f"{termo_busca} karaoke com letra"**
49. **search_url = f"ytsearch{max_resultados}:{query}"**
50. ****
51. **try:**
52. **cmd = [**
53. **"yt-dlp",**
54. **"--flat-playlist",**
55. **"--dump-json",**
56. **"--no-warnings",**
57. **"--ignore-errors",**
58. **search_url**
59. **]**
60. ****
61. **result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)**
62. ****
63. **musicas = []**
64. **linhas_validas = [l for l in result.stdout.strip().split('\n') if l.strip()]**
65. ****
66. **for linha in linhas_validas:**
67. **try:**
68. **data = json.loads(linha)**
69. **titulo = data.get('title', 'Sem título')**
70. **duracao = data.get('duration', 0)**
71. ****
72. **# Filtra resultados muito curtos (< 30s) ou muito longos (> 15min)**
73. **if duracao < 30 or duracao > 900:**
74. **continue**
75. ****
76. **musicas.append({**
77. **'id': data.get('id', ''),**
78. **'titulo': titulo,**
79. **'url': f"[https://www.youtube.com/watch?v={data.get](https://www.youtube.com/watch?v={data.get)('id', '')}",**
80. **'duracao': duracao,**
81. **'canal': data.get('channel', 'Desconhecido'),**
82. **'visualizacoes': data.get('view_count', 0),**
83. **'e_karaoke': any(palavra in titulo.lower() for palavra in**
84. **['karaoke', 'karaokê', 'letra', 'lyrics', 'cifra',**
85. **'instrumental', 'playback', 'sing along', 'legendado'])**
86. **})**
87. **except json.JSONDecodeError:**
88. **continue**
89. ****
90. **# Ordena: karaokês primeiro, depois por visualizações**
91. **musicas.sort(key=lambda m: (not m['e_karaoke'], -m['visualizacoes']))**
92. ****
93. **return musicas**
94. ****
95. **except subprocess.TimeoutExpired:**
96. **print("[ERRO] Busca excedeu o tempo limite.")**
97. **return []**
98. **except FileNotFoundError:**
99. **print("[ERRO] yt-dlp não encontrado.")**
100. **return []**
101. **except Exception as e:**
102. **print(f"[ERRO] Falha na busca: {e}")**
103. **return []**
104. &nbsp;
105. &nbsp;
106. **def formatar_duracao(segundos):**
107. **"""Formata segundos para MM:SS."""**
108. **if not segundos:**
109. **return "00:00"**
110. **m, s = divmod(int(segundos), 60)**
111. **h, m = divmod(m, 60)**
112. **if h > 0:**
113. **return f"{h}:{m:02d}:{s:02d}"**
114. **return f"{m}:{s:02d}"**
115. &nbsp;
116. &nbsp;
117. **def exibir_resultados(musicas):**
118. **"""Exibe a lista de músicas encontradas de forma organizada."""**
119. **if not musicas:**
120. **print("\n[Nenhuma música encontrada.]")**
121. **return False**
122. ****
123. **print(f"\n{'='70}")*
124. **print(f"{'#':<4} {'TÍTULO':<45} {'DURAÇÃO':<10} {'KARAOKÊ':<8}")**
125. **print(f"{'='70}")*
126. ****
127. **for i, m in enumerate(musicas, 1):**
128. **titulo = m['titulo'][:44] + '...' if len(m['titulo']) > 44 else m['titulo']**
129. **duracao = formatar_duracao(m['duracao'])**
130. **karaoke = "[K]" if m['e_karaoke'] else "   "**
131. **print(f"{i:<4} {titulo:<45} {duracao:<10} {karaoke:<8}")**
132. ****
133. **print(f"{'='70}")*
134. **print(f"Total: {len(musicas)} músicas encontradas.")**
135. **return True**
136. &nbsp;
137. &nbsp;
138. **def download_musica(url, pasta="downloads_musicas", formato="mp4"):**
139. **"""**
140. **Baixa a música do YouTube.**
141. ****
142. **formatos:**
143. **- "mp4" - Vídeo + áudio (melhor para karaokê com letra na tela)**
144. **- "mp3" - Apenas áudio**
145. **"""**
146. **if not os.path.exists(pasta):**
147. **os.makedirs(pasta)**
148. **print(f"[OK] Pasta criada: {pasta}")**
149. ****
150. **print(f"\n[DOWNLOAD] Iniciando download...")**
151. ****
152. **if formato == "mp3":**
153. **# Apenas áudio**
154. **cmd = [**
155. **"yt-dlp",**
156. **"-f", "bestaudio/best",**
157. **"--extract-audio",**
158. **"--audio-format", "mp3",**
159. **"--audio-quality", "0",**
160. **"-o", f"{pasta}/%(title)s.%(ext)s",**
161. **"--no-warnings",**
162. **"--embed-thumbnail",**
163. **"--embed-metadata",**
164. **"--add-metadata",**
165. **url**
166. **]**
167. **print("[INFO] Formato: MP3 (áudio apenas)")**
168. ****
169. **elif formato == "mp4":**
170. **# Vídeo com áudio - melhor para karaokê (letra na tela)**
171. **cmd = [**
172. **"yt-dlp",**
173. **"-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",**
174. **"--recode-video", "mp4",**
175. **"-o", f"{pasta}/%(title)s.%(ext)s",**
176. **"--no-warnings",**
177. **"--embed-metadata",**
178. **"--embed-thumbnail",**
179. **"--add-metadata",**
180. **url**
181. **]**
182. **print("[INFO] Formato: MP4 (vídeo com áudio)")**
183. ****
184. **try:**
185. **process = subprocess.run(**
186. **cmd,**
187. **capture_output=True,**
188. **text=True,**
189. **timeout=600  # 10 minutos limite**
190. **)**
191. ****
192. **if process.returncode == 0:**
193. **print("[OK] Download concluído com sucesso!")**
194. ****
195. **# Mostra o nome do arquivo baixado**
196. **for linha in process.stderr.split('\n'):**
197. **if '[download]' in linha and 'Destination' in linha:**
198. **print(f"    Arquivo: {linha.split('Destination: ')[-1]}")**
199. **elif 'has already been downloaded' in linha:**
200. **print("    Arquivo já foi baixado anteriormente.")**
201. ****
202. **return True**
203. **else:**
204. **print(f"[ERRO] Falha no download. Código: {process.returncode}")**
205. **if process.stderr:**
206. **print(f"    Detalhes: {process.stderr[-200:]}")**
207. **return False**
208. ****
209. **except subprocess.TimeoutExpired:**
210. **print("[ERRO] Download excedeu o tempo limite (10 min).")**
211. **return False**
212. **except Exception as e:**
213. **print(f"[ERRO] Exceção no download: {e}")**
214. **return False**
215. &nbsp;
216. &nbsp;
217. **def main():**
218. **"""Função principal do programa."""**
219. **print("="60)*
220. **print("  🎤 YOUTUBE KARAOKÊ DOWNLOADER 🎤")**
221. **print("  Baixa músicas em karaokê com letras")**
222. **print("="60)*
223. ****
224. **# Verifica dependências**
225. **if not verificar_yt_dlp():**
226. **print("[AVISO] yt-dlp não encontrado.")**
227. **resposta = input("Instalar automaticamente? (s/N): ").lower()**
228. **if resposta == 's':**
229. **if not instalar_dependencias():**
230. **return**
231. **else:**
232. **print("Instale manualmente: pip install yt-dlp")**
233. **return**
234. ****
235. **while True:**
236. **print("\n" + "-"50)*
237. **termo = input("🎵 Digite o nome da música ou artista (ou 'sair'): ").strip()**
238. ****
239. **if termo.lower() in ('sair', 'exit', 'quit', 'q'):**
240. **print("Até mais! 🎶")**
241. **break**
242. ****
243. **if not termo:**
244. **continue**
245. ****
246. **# Busca músicas**
247. **musicas = buscar_musicas_karaoke(termo)**
248. ****
249. **if not exibir_resultados(musicas):**
250. **continue**
251. ****
252. **# Seleção**
253. **print("\n" + "-"50)*
254. **escolha = input("Escolha o número da música para baixar (0=voltar): ").strip()**
255. ****
256. **if escolha == '0':**
257. **continue**
258. ****
259. **try:**
260. **idx = int(escolha) - 1**
261. **if 0 <= idx < len(musicas):**
262. **musica = musicas[idx]**
263. **print(f"\n[INFO] Música selecionada: {musica['titulo']}")**
264. ****
265. **# Escolha do formato**
266. **print("\nFormatos disponíveis:")**
267. **print("  1 - MP4 (vídeo + áudio) - ⭐ Recomendado para karaokê")**
268. **print("  2 - MP3 (apenas áudio)")**
269. **fmt_escolha = input("Formato (1/2) [1]: ").strip() or "1"**
270. ****
271. **formato = "mp4" if fmt_escolha == "1" else "mp3"**
272. ****
273. **# Pasta de saída**
274. **pasta = input("Pasta para salvar [downloads_musicas]: ").strip() or "downloads_musicas"**
275. ****
276. **# Download**
277. **download_musica(musica['url'], pasta, formato)**
278. **else:**
279. **print("[ERRO] Número inválido.")**
280. **except ValueError:**
281. **print("[ERRO] Digite um número válido.")**
282. &nbsp;
283. &nbsp;
284. **if name == "main":**
285. **try:**
286. **main()**
287. **except KeyboardInterrupt:**
288. **print("\n\n[INFO] Programa interrompido pelo usuário.")**
289. **except Exception as e:**
290. **print(f"\n[ERRO] Erro inesperado: {e}") youtube_karaoke_downloader.py pode fazer aí embutido** (YouTube IFrame Player) e a pessoa canta por cima. Você ainda pesquisa por música, escolhe da lista, ou cola o link — igual ao seu script — só que sem gravar o MP4 no servidor. Funciona igual para karaokê.
291. **Push notifications no iOS (PWA)**: só funcionam **depois** que o usuário instalar o PWA na Tela de Início (iOS 16.4+). No Safari normal não recebe push. O app vai mostrar um passo-a-passo de instalação e só pedir permissão de push depois de instalado. Notificação diária ("Hora de cantar 🎤") via Web Push (VAPID) disparada por cron do backend.

Se algo aí não servir, me diz antes de eu construir.

## Telas (todas mobile iOS)

1. **Splash / Onboarding** — logo CantaJá, "Instalar na tela de início" (instruções iOS: Compartilhar → Adicionar à Tela de Início).
2. **Login / Cadastro** — e-mail + senha e Google (Lovable Cloud Auth). Cria perfil com nome de palco, avatar, cidade.
3. **Home** — busca de música ("nome ou artista"), botão "Colar link do YouTube", lista de sugestões, ranking do dia no topo.
4. **Resultados da busca** — lista estilo seu script (título, duração, selo [K] karaokê), ordenada por relevância + views. Busca feita no backend via YouTube Data API.
5. **Tela de cantar** — player do YouTube embutido tocando o karaokê, letra na tela (do vídeo), botão grande "🎤 Gravar", medidor de volume, aviso "use fone de ouvido ou abaixe o volume". Grava o microfone via `MediaRecorder`, envia pro backend.
6. **Resultado da performance** — IA (Lovable AI) analisa a gravação e devolve nota 0–100 + comentário curto (afinação percebida, ritmo, energia). Salva no histórico e no ranking.
7. **Minhas músicas** — histórico das que você cantou/escolheu, com nota, data e botão "cantar de novo".
8. **Perfil** — nome de palco, avatar, estatísticas, minhas gravações.
9. **Ranking / Competição** — leaderboard global e semanal por pontuação média. "Melhor do canto" em destaque.
10. **Configurações** — notificações (horário do lembrete diário), sair, política.

## Backend (Lovable Cloud + servidor real)

Tabelas:

- `profiles` (id, stage_name, avatar_url, city, created_at)
- `songs_history` (id, user_id, youtube_id, title, chosen_at)
- `performances` (id, user_id, youtube_id, title, audio_url, score, ai_feedback, created_at)
- `push_subscriptions` (id, user_id, endpoint, p256dh, auth, notify_hour)
- `user_roles` (tabela separada, padrão seguro)

Storage bucket privado `recordings/` para os áudios de gravação.

Server functions (TanStack `createServerFn`):

- `searchYouTube(query)` — chama YouTube Data API v3 (peço a chave via secret).
- `scorePerformance(recordingUrl, songTitle)` — envia áudio pra Lovable AI (`openai/gpt-4o-mini-transcribe` p/ transcrever + `google/gemini-3-flash-preview` p/ nota e feedback).
- `getLeaderboard()` — top usuários por média.
- `savePushSubscription()` / `sendDailyReminder()`.

Rotas públicas:

- `/api/public/cron/daily-reminder` — chamada por cron externo diário; envia Web Push a quem optou.

Push: gero par de chaves VAPID (via `generate_secret`), guardo `VAPID_PUBLIC_KEY` no cliente e `VAPID_PRIVATE_KEY` no servidor, uso `web-push` só no server.

Service worker mínimo (`firebase-messaging-sw.js`-style, só para push — não é PWA offline) recebe push e mostra notificação com deep link para a tela "cantar hoje".

## Design

Estilo mobile iOS: dark elegante, roxo/rosa neon (energia de palco), tipografia forte, botão de gravar grande e redondo, animação de nível de áudio, safe-area do iPhone respeitada.

## Segredos que vou pedir depois de você aprovar

- `YOUTUBE_API_KEY` (você pega no Google Cloud Console — te explico o passo)
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` (gero eu, sem você fazer nada)
- `LOVABLE_API_KEY` (já é automático)

- &nbsp;
  Pode colocar para competir e vê pontuação ok
  &nbsp;

---

**Confirma que posso seguir com YouTube embutido (sem download) + PWA com push pós-instalação, ou quer mudar algo?**