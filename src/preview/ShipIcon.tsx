// src/preview/ShipIcon.tsx
import { useEffect, useRef } from 'react';
import { drawShipPreview } from './shipPreview';

export default function ShipIcon({
  shipId,
  size = 48,
  title,
}: { shipId: string; size?: number; title?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!ref.current) return;
      await drawShipPreview(ref.current, shipId, size);
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  }, [shipId, size]);

  return (
    <div
      className="ship-icon"
      title={title ?? shipId}
      style={{ ['--ship-icon' as any]: `${size}px` }} // bind CSS var
    >
      {/* Let CSS control layout size; intrinsic pixels still match `size` */}
      <canvas ref={ref} width={size} height={size} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
