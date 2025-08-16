# shipwright-survivors-waveseditor

# Understanding: Shipwright Survivors — Wave Editor

Below is a crisp map of what you’ve built—its purpose, domain model, data‐flow, UI composition, and notable engineering choices—expressed from an architectural vantage.

## Purpose & Contract

- **Goal.** A browser-resident authoring tool for `WaveDefinition[]` that round-trips losslessly with the runtime loader.
    
- **External contract.** Reads/writes a **versioned** `WavesFileJSON` (`version: 1`) containing:
    
    - `waves: WaveJSON[]` (ordered encounter plan)
        
    - registries: `affixes: Record<string, ShipAffixes>` and `behaviors: Record<string, BehaviorJSON>`
        
- **Authoritative schema.** The editor is **data-first** against `WavesFileJSON` (not the engine’s internal types), with defaults matching the design doc:
    
    - per wave: `mods: []`, `spawnDistribution: 'aroundPlayer'`, `sustainMode: true`, `ships: []`, `duration?: number | "Infinity"`
        

## Domain Model (Types)

- **WaveJSON.** Composition (ships/formations), temporal policy (`duration`, `spawnDelay`, `sustainMode`), spawn policy (`spawnDistribution`, `atCoords`), optional `incidents`, `music`, `lighting`, `isBoss`.
    
- **WaveShipEntryJSON.** `(shipId, count, hunter?, noClip?, onAllDefeated?)` + optional `affixesRef|affixes` and `behaviorRef|behavior`.
    
- **Registries.**
    
    - **Affixes**: numeric multipliers (`thrustPowerMulti`, `fireRateMulti`, etc.).
        
    - **Behaviors**: `{preset, params?}` where `params` is free-form and merged onto the engine preset at load.
        
- **Incidents.** `{spawnChance, script, options?, label?, delaySeconds?}` with free-form `options` JSON.
    
- **Formations.** Present in schema; deferred in UI to a collapsible/“future” area (no code shown yet).
    

## State & Data Flow

- **State container.** Zustand (`state/store.ts`) holds the entire document, selection, UI flags, and all CRUD actions.
    
    - `doc: WavesDoc` initialized as empty registries + no waves.
        
    - `selectedWaveIdx: number | null`, `dirty: boolean`.
        
    - UI flags for modals + Ship Picker target tuple `(wi, si)`.
        
- **Actions.** Fine-grained mutators for:
    
    - **Waves:** add/delete/reorder/update + convenience setters for sustain, duration, spawn policy, coords, delay, boss flag.
        
    - **Ships (within wave):** add/delete/duplicate/reorder/update.
        
    - **Incidents:** add/delete/duplicate/reorder/update with JSON parsing on blur.
        
    - **Registries:** upsert/remove; **rename/delete-with-cascade** to rewrite references in all waves safely.
        
    - **Ship Picker:** open/close and `setShipId(wi, si, id)` (uses shallow structural sharing for the waves array).
        
- **Immutable updates.** Most actions use `structuredClone` of the whole `doc`, apply a patch, then set `{dirty: true}`. Selection index is carefully remapped on reorders.
    

## UI Composition (React + TS, framework-light)

- **App shell (`App.tsx`).**
    
    - Header: title + `NavBar` (import/export + registry modals).
        
    - Split main panel: `Sidebar` (waves list) and `WaveEditor` (detail cards).
        
    - Modals: `AffixesModal`, `BehaviorsModal`, and a globally mounted `ShipPickerModal`.
        
    - `preloadPreviewAssets()` ensures sprite atlas + registry are warmed before first preview paint.
        
- **Sidebar (`sidebar/Sidebar.tsx`).**
    
    - **Authoring list** of waves with concise metadata (duration, ship summary, incident count).
        
    - **Reordering** via drag handle (`⋮`) with explicit drop targets; selection maintained correctly.
        
    - **Add/Delete** wave with confirmation.
        
- **Editor detail (`editor/WaveEditor.tsx`).**
    
    - **WaveSettings** card: toggles and fields for `sustainMode`, `duration` (including ∞ sentinel), `spawnDistribution` (reveals `atCoords` editor for `'at'`), `spawnDelay`, `isBoss`.
        
    - **ShipsCard**: scrollable rows with:
        
        - **Preview tile** (click to open Ship Picker).
            
        - Non-editable ship “pill,” count, hunter checkbox.
            
        - Affix/Behavior `select` bound to registries with “open editor” gear.
            
        - Row-level reorder (drag), duplicate, delete.
            
    - **IncidentsCard**: list of incident cards with sliders + number inputs for `spawnChance`, fields for `script`, `delaySeconds`, and a **JSON textarea** for `options` (validated on blur). Drag-to-reorder at the card level.
        
- **Registries Modals.**
    
    - **BehaviorsModal.**
        
        - Left: searchable list with usage counts (via selectors), “+ New,” and **preset seeds** (`BEHAVIOR_PRESETS`).
            
        - Right: editor for `id`, `preset`, and **common numeric params** (`engagementRange`, `disengageRange`, `siegeRange`) that **merge into** `params JSON` on save.
            
        - **Rename** with collision checks; **delete** with prompted replacement to cascade references.
            
    - **AffixesModal.** (Not shown but parallel coarse-grained CRUD based on store actions.)
        
- **Ship selection & preview.**
    
    - **ShipPickerModal.**
        
        - Loads a **manifest** of ship JSON paths (tries `assets/ships/manifest.json` then `assets/manifest.json`) with `BASE_URL` awareness.
            
        - Builds a **stable directory tree** (`buildTree`) with cached `totalFiles` for each node; supports breadcrumbs, “Up,” folder list, and a **lazy grid** of ship tiles (IntersectionObserver) with **size toggle**.
            
        - Search filters within the current subtree (or recursively when the query is non-blank).
            
        - Choosing sets `shipId` (path sans `.json`).
            
    - **ShipIcon / shipPreview.**
        
        - On-canvas renderer using `BlockRegistry.json` + `atlas.png`; cells composited with an optional overlay row.
            
        - **Caches** loaded ships; guards async paint with “cancelled” flag; **BASE_URL**-aware URL resolver; defensive fallback rendering.
            

## I/O Pipeline

- **Import/Export (`io/`).**
    
    - `import.ts` parses a `WavesFileJSON` and feeds it to `setDoc`.
        
    - `normalize.ts` and `validate.ts` (present in tree) back the **NavBar Export** button to emit canonical, versioned JSON identical to what the game consumes.
        

## Cross-Cutting Concerns & Quality

- **Defaults & invariants.** New waves reflect the spec defaults; `hunter` defaults true; `"Infinity"` handled explicitly in UI.
    
- **Selection semantics.** Robust under reorders/deletes (selection remains meaningful).
    
- **Accessibility/affordances.** Buttons have labels/titles; ship placeholder is keyboard-activatable; sliders + numeric inputs are paired.
    
- **Scalability.** Scrollable cards; lazy ship tiles; usage counts computed via selectors to avoid O(N) scans in the hot path.
    

## Notable Engineering Choices (and small opportunities)

1. **State mutation strategy.** Many actions use `structuredClone` of the full document. That’s simple and safe, but for very large wave sets it’s GC-intensive. You already use **shallow structural sharing** in `setShipId`; extending that pattern (clone `waves`, then one `wave`, then one `ship`) or using Zustand’s **immer middleware** would reduce churn while preserving immutability.
    
2. **At-coords inputs.** In `WaveSettings`, blank inputs coerce to `0` via `x ?? 0`/`y ?? 0`. That silently re-introduces coordinates when a field is cleared. Consider leaving keys **undefined** when the input is blank to avoid JSON noise and preserve intent.
    
3. **Validation UX.** `alert()` in `IncidentsCard` is functional; a non-modal **Problems pane** (aggregating `validate.ts` findings) would keep authors in flow and match the “inline validation + panel” described in the plan.
    
4. **Virtualization (future).** If waves/ships/incidents scale into hundreds, you may want list virtualization for `card-scroll` regions; your row keys and stateless rows are already compatible.
    
5. **Registry ergonomics.** You’ve implemented **rename/delete with cascade**—excellent. Afford “Extract inline → registry” from a ship row when users paste ad-hoc affixes/behaviors.
    
6. **Asset resilience.** Preview bootstrap is BASE-aware and emits clear warnings; Ship Picker tries multiple manifest locations and degrades to an empty dataset with UX hints—good operational hardening.
    
7. **Versioning.** The `version: 1` tag in `WavesFileJSON` is in place; keep `normalize.ts` as the locus for future migration shims.