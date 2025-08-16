/** Immutable reorder helper. */
export function reorder<T>(arr: readonly T[], from: number, to: number): T[] {
  if (from === to) return arr.slice();
  const a = arr.slice();
  const [it] = a.splice(from, 1);
  a.splice(to, 0, it);
  return a;
}
