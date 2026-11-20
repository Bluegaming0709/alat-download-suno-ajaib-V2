import { sunoHeaders, extractClips, normalizeClip, readBody, SUNO_API } from './_suno.js';

// POST { token, workspaceId, type, page } -> { clips: [...], page }
export default async function handler(req, res) {
  try {
    const body = await readBody(req);
    const { token, workspaceId, type } = body;
    const page = Number(body.page || 0);
    if (!token) { res.status(400).json({ error: 'Set token dulu di bagian Kantong Token.' }); return; }

    let candidates = [];
    if (!workspaceId || workspaceId === 'all' || type === 'all') {
      candidates = [
        `${SUNO_API}/api/feed/v2?page=${page}`,
        `${SUNO_API}/api/feed/?page=${page}`,
        `${SUNO_API}/api/feed/v2`,
        `${SUNO_API}/api/feed/`,
      ];
    } else if (type === 'playlist') {
      candidates = [`${SUNO_API}/api/playlist/${workspaceId}`];
    } else {
      candidates = [`${SUNO_API}/api/project/${workspaceId}`];
    }

    let lastErr = null;
    for (const url of candidates) {
      try {
        const r = await fetch(url, { headers: sunoHeaders(token) });
        if (!r.ok) { lastErr = `Suno error ${r.status}`; continue; }
        const data = await r.json();
        const clips = extractClips(data).map(normalizeClip).filter(Boolean);
        // Project/playlist detail may embed full clip list in one response
        res.status(200).json({ clips, page });
        return;
      } catch (e) { lastErr = e.message; }
    }
    res.status(502).json({ error: `Gagal load lagu: ${lastErr || 'tidak ada respon'}. Kalau daftar lagu kosong, ambil token baru.` });
  } catch (e) {
    res.status(502).json({ error: `Gagal: ${e.message}` });
  }
}
