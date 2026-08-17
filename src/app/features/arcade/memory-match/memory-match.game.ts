import { nextRandom } from '../arcade-session';

export type MemoryStatus = 'ready' | 'running' | 'paused' | 'complete';

export interface MemoryCard {
  readonly id: number;
  readonly pairId: string;
  readonly glyph: string;
  readonly label: string;
  readonly matched: boolean;
}

export interface MemoryState {
  readonly cards: readonly MemoryCard[];
  readonly faceUpIds: readonly number[];
  readonly status: MemoryStatus;
  readonly locked: boolean;
  readonly moves: number;
  readonly announcement: string;
}

const PAIRS = [
  { pairId: 'star', glyph: '★', label: 'Star' },
  { pairId: 'diamond', glyph: '◆', label: 'Diamond' },
  { pairId: 'circle', glyph: '●', label: 'Circle' },
  { pairId: 'triangle', glyph: '▲', label: 'Triangle' },
  { pairId: 'sun', glyph: '☀', label: 'Sun' },
  { pairId: 'music', glyph: '♫', label: 'Music note' },
] as const;

export function createMemoryDeck(seed: number): readonly MemoryCard[] {
  const cards = PAIRS.flatMap((pair) => [
    { ...pair, id: 0, matched: false },
    { ...pair, id: 0, matched: false },
  ]);
  let cursor = seed;

  for (let index = cards.length - 1; index > 0; index -= 1) {
    const [random, nextSeed] = nextRandom(cursor);
    cursor = nextSeed;
    const swapIndex = Math.floor(random * (index + 1));
    [cards[index], cards[swapIndex]] = [cards[swapIndex]!, cards[index]!];
  }

  return cards.map((card, id) => ({ ...card, id }));
}

export function createMemoryState(seed: number): MemoryState {
  return {
    cards: createMemoryDeck(seed),
    faceUpIds: [],
    status: 'ready',
    locked: false,
    moves: 0,
    announcement: 'Memory Match is ready.',
  };
}

export function startMemory(state: MemoryState): MemoryState {
  if (state.status !== 'ready') {
    return state;
  }
  return { ...state, status: 'running', announcement: 'Game started. Choose a card.' };
}

export function chooseMemoryCard(state: MemoryState, cardId: number): MemoryState {
  if (state.status !== 'running' || state.locked || state.faceUpIds.includes(cardId)) {
    return state;
  }

  const card = state.cards.find((candidate) => candidate.id === cardId);
  if (!card || card.matched) {
    return state;
  }

  if (state.faceUpIds.length === 0) {
    return {
      ...state,
      faceUpIds: [cardId],
      announcement: `${card.label}. Choose one more card.`,
    };
  }

  const firstId = state.faceUpIds[0]!;
  const first = state.cards.find((candidate) => candidate.id === firstId)!;
  const moves = state.moves + 1;

  if (first.pairId !== card.pairId) {
    return {
      ...state,
      faceUpIds: [firstId, cardId],
      locked: true,
      moves,
      announcement: `${first.label} and ${card.label} do not match.`,
    };
  }

  const cards = state.cards.map((candidate) =>
    candidate.pairId === card.pairId ? { ...candidate, matched: true } : candidate,
  );
  const complete = cards.every((candidate) => candidate.matched);
  return {
    ...state,
    cards,
    faceUpIds: [],
    status: complete ? 'complete' : 'running',
    moves,
    announcement: complete
      ? `All pairs found in ${moves} turns.`
      : `${card.label} pair found. Choose another card.`,
  };
}

export function hideMemoryMismatch(state: MemoryState): MemoryState {
  if (!state.locked) {
    return state;
  }
  return {
    ...state,
    faceUpIds: [],
    locked: false,
    announcement: 'Cards hidden. Try again.',
  };
}

export function toggleMemoryPause(state: MemoryState): MemoryState {
  if (state.status === 'running') {
    return { ...state, status: 'paused', announcement: 'Game paused.' };
  }
  if (state.status === 'paused') {
    return { ...state, status: 'running', announcement: 'Game resumed.' };
  }
  return state;
}
