// src/preview/shipPreview.ts
export type BlockMeta = { id: string; atlasKey?: number };
const TILE = 32;

let registryMap: Record<string, BlockMeta> | null = null;
let atlasImg: HTMLImageElement | null = null;
const shipCache = new Map<string, any>();

const BASE = (import.meta as any).env?.BASE_URL || '/';

function joinUrl(...parts: string[]) {
  // join and collapse duplicate slashes (but keep protocol //)
  let s = parts.join('/').replace(/\/{2,}/g, '/');
  if (!s.startsWith('/')) s = '/' + s;
  // prepend BASE (handles non-root deploys)
  const out = (BASE.endsWith('/') ? BASE.slice(0, -1) : BASE) + s;
  return out.replace(/\/{2,}/g, '/');
}

function colorForId(id: string) {
  if (!id || typeof id !== 'string') return '#0b0b0b';
  if (id.startsWith('cockpit')) return '#1b4dff';
  if (id.startsWith('engine')) return '#ff9c2a';
  if (id.startsWith('laser') || id.startsWith('turret') || id.startsWith('halo')) return '#ff3b3b';
  if (id.startsWith('hull')) return '#0b0b0b';
  return '#0b0b0b';
}

function registryFromData(data: any): Record<string, BlockMeta> {
  const arr = Array.isArray(data) ? data
    : Array.isArray(data?.blocks) ? data.blocks
    : Object.values(data || {});
  const map: Record<string, BlockMeta> = Object.create(null);
  for (const b of arr) if (b && b.id) map[b.id] = b as BlockMeta;
  return map;
}

function tileXYFromAtlasKey(atlasKey: number | undefined, img: HTMLImageElement) {
  if (!Number.isFinite(atlasKey as number)) return null;
  const k0 = (atlasKey as number | 0) - 2;
  if (k0 < 0) return null;
  const cols = Math.max(1, Math.floor(img.width / 32));
  const x = k0 % cols;
  const y = Math.floor(k0 / cols);
  const sx = x * 32;
  const sy = y * 32;
  if (sx + 32 > img.width || sy + 32 > img.height) return null;
  return { sx, sy };
}

async function ensureAssets() {
  if (!registryMap) {
    const url = joinUrl('data', 'BlockRegistry.json');
    const res = await fetch(url, { cache: 'no-store' });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || !ct.includes('application/json')) {
      const text = await res.text().catch(() => '');
      console.warn('[shipPreview] registry fetch failed', { url, status: res.status, ct, snippet: text.slice(0, 120) });
      throw new Error(`BlockRegistry fetch failed: ${res.status}`);
    }
    const data = await res.json();
    registryMap = registryFromData(data);
  }
  if (!atlasImg) {
    const url = joinUrl('data', 'atlas.png');
    atlasImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => {
        console.warn('[shipPreview] atlas load failed', url, e);
        reject(new Error('atlas load failed'));
      };
      img.src = url;
    });
  }
}

function normalizeShipId(idRaw: string) {
  let id = (idRaw || '').trim();
  if (!id) return id;
  // strip absolute/relative prefixes if user pasted full path
  id = id.replace(/^https?:\/\/[^/]+/i, '');
  id = id.replace(/^\/?public\//, '');
  id = id.replace(/^\/?assets\/ships\//, '');
  return id;
}

function resolveShipUrl(shipIdRaw: string): string {
  const norm = normalizeShipId(shipIdRaw);
  if (!norm) return '';
  const withJson = norm.endsWith('.json') ? norm : `${norm}.json`;
  return joinUrl('assets', 'ships', withJson);
}

async function loadShip(shipId: string) {
  if (shipCache.has(shipId)) return shipCache.get(shipId);
  const url = resolveShipUrl(shipId);
  if (!url) throw new Error('empty ship id');

  const res = await fetch(url, { cache: 'no-store' });
  const ct = res.headers.get('content-type') || '';
  if (!res.ok || !ct.includes('application/json')) {
    const text = await res.text().catch(() => '');
    console.warn('[shipPreview] ship fetch failed', { id: shipId, url, status: res.status, ct, snippet: text.slice(0, 120) });
    throw new Error(`Ship "${shipId}" fetch failed: ${res.status}`);
  }
  const json = await res.json();
  shipCache.set(shipId, json);
  return json;
}

export async function preloadPreviewAssets() {
  try { await ensureAssets(); } catch (e) { console.warn('[shipPreview] preload error', e); }
}

export async function drawShipPreview(canvas: HTMLCanvasElement, shipId: string, size = 48): Promise<boolean> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  canvas.width = size; canvas.height = size;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, size, size);

  if (!shipId) {
    ctx.fillStyle = '#0f1420'; ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#25314a'; ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
    ctx.fillStyle = '#5d6b85'; ctx.fillText('?', size / 2 - 3, size / 2 + 4);
    return true;
  }

  try {
    await ensureAssets();
    const ship = await loadShip(shipId);
    const blocks: Array<{ id: string; coord: { x: number; y: number }; rotation?: number }> =
      Array.isArray(ship?.blocks) ? ship.blocks : [];

    if (!blocks.length) {
      console.warn('[shipPreview] ship has no blocks', shipId);
      throw new Error('no blocks');
    }

    // bbox in grid
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const b of blocks) {
      const x = b.coord?.x ?? 0, y = b.coord?.y ?? 0;
      if (x < minX) minX = x; if (y < minY) minY = y;
      if (x > maxX) maxX = x; if (y > maxY) maxY = y;
    }
    const cellsW = (maxX - minX + 1) || 1;
    const cellsH = (maxY - minY + 1) || 1;

    const pad = 2;
    const cell = Math.max(2, Math.floor(Math.min((size - pad * 2) / cellsW, (size - pad * 2) / cellsH)));
    const drawW = cell * cellsW, drawH = cell * cellsH;
    const originX = Math.floor((size - drawW) / 2) - minX * cell;
    const originY = Math.floor((size - drawH) / 2) - minY * cell;

    for (const b of blocks) {
      const id = b.id;
      const rot = (b.rotation ?? 0) | 0;
      const px = originX + (b.coord.x) * cell;
      const py = originY + (b.coord.y) * cell;

      const meta = registryMap![id];
      if (!meta || !atlasImg) {
        ctx.fillStyle = colorForId(id);
        ctx.fillRect(px, py, cell, cell);
        continue;
      }
      const uv = tileXYFromAtlasKey(meta.atlasKey, atlasImg);
      if (!uv) {
        ctx.fillStyle = colorForId(id);
        ctx.fillRect(px, py, cell, cell);
        continue;
      }

      ctx.save();
      ctx.translate(px + cell / 2, py + cell / 2);
      ctx.rotate((rot * Math.PI) / 180);
      const scale = cell / TILE;
      ctx.scale(scale, scale);
      ctx.drawImage(atlasImg, uv.sx, uv.sy, TILE, TILE, -TILE / 2, -TILE / 2, TILE, TILE);
      const overlaySy = uv.sy + TILE;
      if (overlaySy + TILE <= atlasImg.height) {
        ctx.drawImage(atlasImg, uv.sx, overlaySy, TILE, TILE, -TILE / 2, -TILE / 2, TILE, TILE);
      }
      ctx.restore();
    }

    ctx.strokeStyle = '#25314a';
    ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
    return true;
  } catch (err) {
    console.warn('[shipPreview] draw error for id', shipId, err);
    ctx.fillStyle = '#0f1420'; ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#5a2a2a'; ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
    ctx.fillStyle = '#ff6b6b'; ctx.fillText('!', size / 2 - 3, size / 2 + 4);
    return false;
  }
}
