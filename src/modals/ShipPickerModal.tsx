// src/modals/ShipPickerModal.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/state/store';
import ShipIcon from '@/preview/ShipIcon';

type Manifest = { files: string[] };

function stripJson(p: string) {
  return p.replace(/\.json$/i, '');
}

// ──────────────────────────────────────────────────────────
// Tree building (for professional, stable nav)
// ──────────────────────────────────────────────────────────
type Node = {
  name: string;         // last path segment ('' for root)
  path: string;         // '' for root, else 'mission_02'
  files: string[];      // immediate files in this folder (no subdirs)
  dirs: Map<string, Node>;
  totalFiles: number;   // recursive count (cached)
};

function buildTree(files: string[]): Node {
  const root: Node = { name: '', path: '', files: [], dirs: new Map(), totalFiles: 0 };
  for (const f of files) {
    const parts = f.split('/').filter(Boolean);
    if (parts.length === 0) continue;
    let cur = root;
    for (let i = 0; i < parts.length; i++) {
      const seg = parts[i];
      const isFile = i === parts.length - 1 && seg.endsWith('.json');
      if (isFile) {
        cur.files.push(f);
      } else {
        const nextPath = cur.path ? `${cur.path}/${seg}` : seg;
        if (!cur.dirs.has(seg)) cur.dirs.set(seg, { name: seg, path: nextPath, files: [], dirs: new Map(), totalFiles: 0 });
        cur = cur.dirs.get(seg)!;
      }
    }
  }
  // compute totalFiles recursively
  const count = (node: Node): number => {
    let sum = node.files.length;
    node.dirs.forEach((child) => { sum += count(child); });
    node.totalFiles = sum;
    return sum;
  };
  count(root);
  return root;
}

function getNodeByPath(root: Node, path: string): Node | null {
  if (!path) return root;
  const parts = path.split('/').filter(Boolean);
  let cur: Node = root;
  for (const seg of parts) {
    const next = cur.dirs.get(seg);
    if (!next) return null;
    cur = next;
  }
  return cur;
}

// ──────────────────────────────────────────────────────────
// Lazy tile (only render canvas when visible)
// ──────────────────────────────────────────────────────────
function LazyTile({
  id,
  name,
  onChoose,
  iconSize = 96,
}: {
  id: string;
  name: string;
  onChoose: () => void;
  iconSize?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) { setVisible(true); io.disconnect(); break; }
      },
      { rootMargin: '120px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="tile shippicker-tile" onClick={onChoose} title={id}>
      {visible ? <ShipIcon shipId={id} size={iconSize} /> : <div className="ship-icon skeleton" />}
      <div className="label">{name}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Modal
// ──────────────────────────────────────────────────────────
export default function ShipPickerModal() {
  const { showShipPicker, shipPickerTarget, closeShipPicker, setShipId } = useStore();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [path, setPath] = useState(''); // '' = root
  const [q, setQ] = useState('');
  const [gridScale, setGridScale] = useState<'md' | 'lg'>('lg'); // quick toggle between 96px and 72px tiles

  // Fetch manifest once per open (BASE-aware + fallback path)
  useEffect(() => {
    if (!showShipPicker) return;
    let mounted = true;

    (async () => {
      const base = (import.meta as any).env?.BASE_URL || '/';
      const candidates = [
        `${base}assets/ships/manifest.json`, // preferred (if your script outputs here)
        `${base}assets/manifest.json`,       // fallback (matches your current tree)
      ];

      let data: Manifest | null = null;
      let lastErr: any = null;

      for (const url of candidates) {
        try {
          const res = await fetch(url, { cache: 'no-store' });
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) {
            data = await res.json();
            break;
          } else {
            const text = await res.text().catch(() => '');
            lastErr = new Error(`[ShipPicker] Manifest not JSON/OK at ${url} (status ${res.status}) :: ${text.slice(0, 120)}`);
          }
        } catch (e) {
          lastErr = e;
        }
      }

      if (!mounted) return;

      if (data) {
        setManifest(data);
      } else {
        console.warn('[ShipPicker] manifest error; tried:', candidates, '\nlast error:', lastErr);
        setManifest({ files: [] });
      }
    })();

    return () => { mounted = false; };
  }, [showShipPicker]);

  // Reset UI state on open
  useEffect(() => { if (showShipPicker) { setPath(''); setQ(''); } }, [showShipPicker]);

  const tree = useMemo(() => buildTree(manifest?.files ?? []), [manifest]);

  const curNode = useMemo(() => getNodeByPath(tree, path), [tree, path]);

  const { dirs, ships } = useMemo(() => {
    if (!curNode) return { dirs: [] as Node[], ships: [] as string[] };

    const s = q.trim().toLowerCase();

    // Directories (immediate)
    const dirList = Array.from(curNode.dirs.values()).sort((a, b) => a.name.localeCompare(b.name));

    // Ships:
    // - if no search, show immediate files only
    // - if search, show all files under subtree that match query
    let files: string[] = [];
    if (!s) {
      files = [...curNode.files];
    } else {
      const collect = (n: Node) => {
        files.push(...n.files.filter((p) => p.toLowerCase().includes(s)));
        n.dirs.forEach(collect);
      };
      collect(curNode);
    }

    files.sort((a, b) => a.localeCompare(b));
    return { dirs: dirList, ships: files };
  }, [curNode, q]);

  if (!showShipPicker || !shipPickerTarget) return null;

  const onChoose = (fullPath: string) => {
    const id = stripJson(fullPath);
    setShipId(shipPickerTarget.wi, shipPickerTarget.si, id);
  };

  const crumbs = path.split('/').filter(Boolean);
  const iconSize = gridScale === 'lg' ? 96 : 72;

  return (
    <div className="modal-backdrop" onClick={closeShipPicker}>
      <div
        className="modal shippicker-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Select Ship"
      >
        {/* Header: title + search + size toggle */}
        <div className="modal-header sticky">
          <h3 className="nowrap">Select Ship</h3>
          <div className="spacer" />
          <div className="row">
            <input
              className="palette-search"
              placeholder="Search ships… (filters within current folder if blank)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ minWidth: 280 }}
            />
            <div className="row">
              <button className="btn-ghost" onClick={() => setGridScale((s) => (s === 'lg' ? 'md' : 'lg'))}>
                {gridScale === 'lg' ? 'Smaller' : 'Bigger'} thumbnails
              </button>
              <button onClick={closeShipPicker}>Close</button>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="shippicker-breadcrumb">
          <button className="chip" onClick={() => setPath('')} disabled={!path}>root</button>
          {crumbs.map((seg, i) => {
            const p = crumbs.slice(0, i + 1).join('/');
            return (
              <div key={p} className="crumb">
                <span className="sep">›</span>
                <button className="chip" onClick={() => setPath(p)}>{seg}</button>
              </div>
            );
          })}
          {curNode && (
            <span className="muted tiny" style={{ marginLeft: 8 }}>
              ({curNode.totalFiles} files total)
            </span>
          )}
        </div>

        {/* Content: left tree / right grid */}
        <div className="shippicker-content">
          {/* Folders panel */}
          <div className="panel folders">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2>Folders</h2>
              {path && <button className="btn-ghost" onClick={() => setPath(path.split('/').slice(0, -1).join('/'))}>⬑ Up</button>}
            </div>
            {(!curNode || dirs.length === 0) && <div className="muted small">No subfolders</div>}
            <ul className="list-reset folder-list">
              {dirs.map((d) => (
                <li key={d.path}>
                  <button className="folder-row" onClick={() => setPath(d.path)} title={`/${d.path}`}>
                    <span className="folder-name">{d.name}</span>
                    <span className="count pill">{d.totalFiles}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Ships grid */}
          <div className="panel gridwrap">
            <div className="row subhead">
              <h2 className="ellipsis">Ships {path ? `— /${path}` : ''}</h2>
              <span className="muted tiny">{ships.length} shown</span>
            </div>

            {ships.length === 0 && <div className="muted small">No ships found here.</div>}

            <div
              className="shippicker-grid"
              style={{
                ['--tile-size' as any]: `${iconSize + 28}px`, // account for label area
              }}
            >
              {ships.map((fullPath) => {
                const id = stripJson(fullPath);
                const name = id.split('/').pop()!;
                return (
                  <LazyTile
                    key={id}
                    id={id}
                    name={name}
                    iconSize={iconSize}
                    onChoose={() => onChoose(fullPath)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Manifest hint */}
        {manifest && manifest.files.length === 0 && (
          <div className="pill warn">
            No entries. Generate <code className="code">public/assets/ships/manifest.json</code> via{' '}
            <code className="code">npm run build:manifest</code>.
          </div>
        )}
      </div>
    </div>
  );
}
