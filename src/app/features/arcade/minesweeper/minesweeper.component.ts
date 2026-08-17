import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { nextRandom, seedForDay } from '../arcade-session';

interface MineCell {
  readonly mine: boolean;
  readonly nearby: number;
  readonly revealed: boolean;
  readonly flagged: boolean;
}

const BOARD_SIZE = 8;
const MINE_COUNT = 9;

@Component({
  selector: 'app-minesweeper',
  templateUrl: './minesweeper.component.html',
  styleUrl: './minesweeper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MinesweeperComponent {
  protected readonly cells = signal<readonly MineCell[]>(this.blankBoard());
  protected readonly started = signal(false);
  protected readonly flagMode = signal(false);
  protected readonly status = signal<'playing' | 'won' | 'lost'>('playing');
  protected readonly minesLeft = computed(
    () => MINE_COUNT - this.cells().filter(({ flagged }) => flagged).length,
  );

  protected choose(index: number): void {
    if (this.status() !== 'playing') return;
    if (!this.started()) {
      this.cells.set(this.createBoard(index));
      this.started.set(true);
    }
    if (this.flagMode()) {
      this.toggleFlag(index);
      return;
    }
    this.reveal(index);
  }

  protected toggleFlag(index: number): void {
    if (this.status() !== 'playing') return;
    this.cells.update((cells) =>
      cells.map((cell, cellIndex) =>
        cellIndex === index && !cell.revealed ? { ...cell, flagged: !cell.flagged } : cell,
      ),
    );
  }

  protected restart(): void {
    this.cells.set(this.blankBoard());
    this.started.set(false);
    this.flagMode.set(false);
    this.status.set('playing');
  }

  protected cellLabel(cell: MineCell, index: number): string {
    if (cell.flagged) return `Cell ${index + 1}, flagged`;
    if (!cell.revealed) return `Reveal cell ${index + 1}`;
    if (cell.mine) return `Cell ${index + 1}, mine`;
    return `Cell ${index + 1}, ${cell.nearby || 'no'} nearby mines`;
  }

  private reveal(index: number): void {
    const current = this.cells();
    if (current[index]?.flagged || current[index]?.revealed) return;
    if (current[index]?.mine) {
      this.cells.set(current.map((cell) => (cell.mine ? { ...cell, revealed: true } : cell)));
      this.status.set('lost');
      return;
    }

    const next = [...current];
    const queue = [index];
    const visited = new Set<number>();
    while (queue.length) {
      const cellIndex = queue.shift()!;
      if (visited.has(cellIndex)) continue;
      visited.add(cellIndex);
      const cell = next[cellIndex];
      if (!cell || cell.mine || cell.flagged) continue;
      next[cellIndex] = { ...cell, revealed: true };
      if (cell.nearby === 0) queue.push(...this.neighbors(cellIndex));
    }
    this.cells.set(next);
    if (next.filter(({ mine }) => !mine).every(({ revealed }) => revealed)) this.status.set('won');
  }

  private createBoard(safeIndex: number): readonly MineCell[] {
    const mineIndexes = new Set<number>();
    let seed = seedForDay('minesweeper');
    while (mineIndexes.size < MINE_COUNT) {
      let random: number;
      [random, seed] = nextRandom(seed);
      const candidate = Math.floor(random * BOARD_SIZE * BOARD_SIZE);
      if (candidate !== safeIndex && !this.neighbors(safeIndex).includes(candidate)) {
        mineIndexes.add(candidate);
      }
    }
    return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => ({
      mine: mineIndexes.has(index),
      nearby: this.neighbors(index).filter((neighbor) => mineIndexes.has(neighbor)).length,
      revealed: false,
      flagged: false,
    }));
  }

  private blankBoard(): readonly MineCell[] {
    return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, () => ({
      mine: false,
      nearby: 0,
      revealed: false,
      flagged: false,
    }));
  }

  private neighbors(index: number): number[] {
    const row = Math.floor(index / BOARD_SIZE);
    const column = index % BOARD_SIZE;
    const result: number[] = [];
    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
        if (rowOffset === 0 && columnOffset === 0) continue;
        const nextRow = row + rowOffset;
        const nextColumn = column + columnOffset;
        if (nextRow >= 0 && nextRow < BOARD_SIZE && nextColumn >= 0 && nextColumn < BOARD_SIZE) {
          result.push(nextRow * BOARD_SIZE + nextColumn);
        }
      }
    }
    return result;
  }
}
