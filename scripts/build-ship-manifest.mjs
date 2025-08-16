import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'public/assets/ships');

const isJson = (p) => p.toLowerCase().endsWith('.json');

// If you want to filter to only files that look like ship JSONs, flip `STRICT` to true.
const STRICT = false;

async function looksLikeShipJson(absFile) {
  if (!STRICT) return true;
  try {
    const txt = await fs.readFile(absFile, 'utf8');
    const j = JSON.parse(txt);
    return Array.isArray(j?.blocks);
  } catch {
    return false;
  }
}

async function walk(dir, base = '') {
  const out = [];
  const ents = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of ents) {
    if (ent.name.startsWith('.')) continue;
    if (ent.isDirectory()) {
      const sub = await walk(path.join(dir, ent.name), path.join(base, ent.name));
      out.push(...sub);
    } else if (ent.isFile() && isJson(ent.name)) {
      const rel = path.join(base, ent.name).replace(/\\/g, '/'); // rel to ROOT
      const abs = path.join(dir, ent.name);
      if (await looksLikeShipJson(abs)) out.push(rel);
    }
  }
  return out;
}

(async function main() {
  const files = await walk(ROOT);
  const manifest = { files }; // array of "mission_02/ship_rammerspear_00.json", etc
  const outPath = path.join(ROOT, 'manifest.json');
  await fs.writeFile(outPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Wrote ${outPath} with ${files.length} entries.`);
})();
