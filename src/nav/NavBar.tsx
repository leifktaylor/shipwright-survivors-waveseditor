// src/nav/NavBar.tsx

import { useRef } from 'react';
import { useStore } from '@/state/store';
import { importFromFile } from '@/io/import';
import { exportToFile } from '@/io/export';
import { validate } from '@/io/validate';
import { normalizeOut } from '@/io/normalize';

export default function NavBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { doc, setDoc, setDirty, openAffixesModal, openBehaviorsModal } = useStore();

  const onClickImport = () => inputRef.current?.click();
  const onChangeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const parsed = await importFromFile(f);
      setDoc(parsed);
      setDirty(false);
    } catch (err) {
      alert(`Import failed: ${(err as Error).message}`);
    } finally {
      e.target.value = '';
    }
  };

  const onClickExport = () => {
    const issues = validate(doc);
    const blocking = issues.filter(i => i.severity === 'error');
    if (blocking.length) {
      const lines = blocking.map(i => `• ${i.path}: ${i.message}`).join('\n');
      alert(`Export blocked by validation errors:\n\n${lines}`);
      return;
    }
    const out = normalizeOut(doc);
    exportToFile(out, 'waves.json');
  };

  return (
    <div className="row">
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        className="sr-only"
        onChange={onChangeFile}
      />
      <button onClick={onClickImport}>Import Waves JSON</button>
      <button onClick={onClickExport}>Export Waves JSON</button>
      <div className="spacer" />
      <button className="btn-ghost" onClick={openAffixesModal}>Affixes Editor</button>
      <button className="btn-ghost" onClick={openBehaviorsModal}>Behaviors Editor</button>
    </div>
  );
}
