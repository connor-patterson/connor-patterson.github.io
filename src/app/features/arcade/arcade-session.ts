export function localDayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function seedForDay(namespace: string, dayKey = localDayKey()): number {
  let hash = 2166136261;
  const source = `${namespace}:${dayKey}`;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function nextRandom(seed: number): readonly [number, number] {
  let value = seed >>> 0;
  value += 0x6d2b79f5;
  let mixed = value;
  mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
  mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
  const random = ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  return [random, value >>> 0] as const;
}

export function readBestScore(gameId: string, scoreKey: string): number {
  try {
    const value = globalThis.localStorage?.getItem(`patteros.arcade.${gameId}.${scoreKey}`);
    return value ? Math.max(0, Number.parseInt(value, 10) || 0) : 0;
  } catch {
    return 0;
  }
}

export function writeBestScore(gameId: string, scoreKey: string, score: number): void {
  try {
    globalThis.localStorage?.setItem(
      `patteros.arcade.${gameId}.${scoreKey}`,
      String(Math.max(0, Math.round(score))),
    );
  } catch {
    // Storage can be unavailable in private browsing. The game remains fully playable.
  }
}
