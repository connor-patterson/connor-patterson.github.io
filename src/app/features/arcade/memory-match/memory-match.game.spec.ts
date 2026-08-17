import { describe, expect, it } from 'vitest';

import {
  chooseMemoryCard,
  createMemoryDeck,
  createMemoryState,
  hideMemoryMismatch,
  startMemory,
  toggleMemoryPause,
  type MemoryState,
} from './memory-match.game';

function findPair(state: MemoryState): readonly [number, number] {
  const first = state.cards[0]!;
  return [
    first.id,
    state.cards.find((card) => card.pairId === first.pairId && card.id !== first.id)!.id,
  ];
}

describe('Memory Match rules', () => {
  it('builds a deterministic deck with six pairs', () => {
    expect(createMemoryDeck(22)).toEqual(createMemoryDeck(22));
    expect(createMemoryDeck(22)).not.toEqual(createMemoryDeck(23));
    expect(new Set(createMemoryDeck(22).map((card) => card.pairId)).size).toBe(6);
  });

  it('turns over one card without spending a move', () => {
    const running = startMemory(createMemoryState(5));
    const chosen = chooseMemoryCard(running, running.cards[0]!.id);

    expect(chosen.faceUpIds).toHaveLength(1);
    expect(chosen.moves).toBe(0);
  });

  it('keeps a matching pair visible', () => {
    let state = startMemory(createMemoryState(8));
    const [firstId, secondId] = findPair(state);
    state = chooseMemoryCard(state, firstId);
    state = chooseMemoryCard(state, secondId);

    expect(state.cards.filter((card) => card.matched)).toHaveLength(2);
    expect(state.moves).toBe(1);
    expect(state.locked).toBe(false);
  });

  it('briefly locks a mismatched pair before hiding it', () => {
    let state = startMemory(createMemoryState(8));
    const first = state.cards[0]!;
    const second = state.cards.find((card) => card.pairId !== first.pairId)!;
    state = chooseMemoryCard(state, first.id);
    state = chooseMemoryCard(state, second.id);

    expect(state.locked).toBe(true);
    expect(state.faceUpIds).toHaveLength(2);

    state = hideMemoryMismatch(state);
    expect(state.locked).toBe(false);
    expect(state.faceUpIds).toEqual([]);
  });

  it('finishes when every pair has been found', () => {
    let state = startMemory(createMemoryState(11));
    for (const pairId of new Set(state.cards.map((card) => card.pairId))) {
      const pair = state.cards.filter((card) => card.pairId === pairId);
      state = chooseMemoryCard(state, pair[0]!.id);
      state = chooseMemoryCard(state, pair[1]!.id);
    }

    expect(state.status).toBe('complete');
    expect(state.moves).toBe(6);
  });

  it('does not change cards while paused', () => {
    const paused = toggleMemoryPause(startMemory(createMemoryState(4)));
    expect(chooseMemoryCard(paused, paused.cards[0]!.id)).toBe(paused);
    expect(toggleMemoryPause(paused).status).toBe('running');
  });
});
