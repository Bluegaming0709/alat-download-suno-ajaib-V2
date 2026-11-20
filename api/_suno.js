// Shared helpers for Suno API access (server-side, no CORS issues)
export const SUNO_API = 'https://studio-api-prod.suno.com';
export const KEYS_API = 'https://madhouse-suno-downloader.vercel.app/api/keys';

export function sunoHeaders(token) {
  const h = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    'Origin': 'https://suno.com',
    'Referer': 'https://suno.com/',
    'Accept': 'application/json, text/plain, */*',
  };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export function parseSongId(input) {
  if (!input) return null;
  const s = String(input).trim();
  const uuid = s.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return uuid ? uuid[0] : null;
}

export async function fetchClip(id, token) {
  const r = await fetch(`${SUNO_API}/api/clip/${id}`, { headers: sunoHeaders(token) });
  if (!r.ok) throw new Error(`Suno clip API error ${r.status}`);
  return r.json();
}

export function normalizeClip(c) {
  if (!c || !c.id) return null;
  return {
    id: c.id,
    title: c.title || 'Tanpa Judul',
    image_url: c.image_url || `https://cdn1.suno.ai/image_${c.id}.jpeg`,
    duration: (c.metadata && c.metadata.duration) || c.duration || null,
    status: c.status || 'complete',
    created_at: c.created_at || null,
  };
}

export function extractClips(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  for (const k of ['clips', 'items', 'results', 'data']) {
    if (Array.isArray(data[k])) return data[k];
  }
  if (data.project && Array.isArray(data.project.clips)) return data.project.clips;
  if (data.playlist && Array.isArray(data.playlist.clips)) return data.playlist.clips;
  return [];
}

export function extractList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  for (const k of ['projects', 'playlists', 'items', 'results', 'data']) {
    if (Array.isArray(data[k])) return data[k];
  }
  return [];
}

export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  const chunks = [];
  for await (const ch of req) chunks.push(ch);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}
