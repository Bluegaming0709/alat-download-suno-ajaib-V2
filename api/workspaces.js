import { sunoHeaders, extractList, readBody, SUNO_API } from './_suno.js';

// POST { token } -> { workspaces: [{id,type,name,count}], valid: bool }
export default async function handler(req, res) {
  try {
    const body = await readBody(req);
    const token = body.token;
    if (!token) { res.status(400).json({ error: 'Set token dulu di bagian Kantong Token.' }); return; }

    const out = [{ id: 'all', type: 'all', name: 'Semua Lagu — seluruh akun', count: null }];
    let anyOk = false; let firstError = null;

    const tries = [
      { url: `${SUNO_API}/api/project/me`, type: 'project' },
      { url: `${SUNO_API}/api/playlist/me`, type: 'playlist' },
    ];
    for (const t of tries) {
      try {
        const r = await fetch(t.url, { headers: sunoHeaders(token) });
        if (!r.ok) { if (!firstError) firstError = `Suno menolak token ini (${r.status}). Ambil token baru dari suno.com.`; continue; }
        anyOk = true;
        const data = await r.json();
        for (const w of extractList(data)) {
          out.push({
            id: w.id,
            type: t.type,
            name: w.name || w.title || 'Tanpa nama',
            count: w.num_total_clips ?? w.clip_count ?? (Array.isArray(w.clips) ? w.clips.length : null),
          });
        }
      } catch (e) { if (!firstError) firstError = e.message; }
    }

    if (!anyOk) { res.status(401).json({ error: firstError || 'Token tidak valid.' }); return; }
    res.status(200).json({ valid: true, workspaces: out });
  } catch (e) {
    res.status(502).json({ error: `Gagal: ${e.message}` });
  }
}
