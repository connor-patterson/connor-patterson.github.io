import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

type Mark = 'X' | 'O';
type Cell = Mark | null;
type GameStatus = 'playing' | 'won' | 'lost' | 'draw';

const WINS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

@Component({
  selector: 'app-tic-tac-toe',
  templateUrl: './tic-tac-toe.component.html',
  styleUrl: './tic-tac-toe.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicTacToeComponent {
  protected readonly board = signal<readonly Cell[]>(Array<Cell>(9).fill(null));
  protected readonly status = signal<GameStatus>('playing');
  protected readonly gamesWon = signal(0);
  protected readonly statusText = computed(() => {
    switch (this.status()) {
      case 'won':
        return 'You got three in a row.';
      case 'lost':
        return 'PatterOS got this one.';
      case 'draw':
        return 'Draw. Nobody blinked.';
      default:
        return 'You are X. Pick a square.';
    }
  });

  protected choose(index: number): void {
    if (this.status() !== 'playing' || this.board()[index]) return;
    const next = [...this.board()];
    next[index] = 'X';
    if (this.finishIfNeeded(next, 'X')) return;

    const aiIndex = this.pickAiMove(next);
    if (aiIndex !== -1) next[aiIndex] = 'O';
    if (this.finishIfNeeded(next, 'O')) return;
    this.board.set(next);
  }

  protected restart(): void {
    this.board.set(Array<Cell>(9).fill(null));
    this.status.set('playing');
  }

  private finishIfNeeded(board: readonly Cell[], mark: Mark): boolean {
    if (this.hasWon(board, mark)) {
      this.board.set(board);
      this.status.set(mark === 'X' ? 'won' : 'lost');
      if (mark === 'X') this.gamesWon.update((score) => score + 1);
      return true;
    }
    if (board.every(Boolean)) {
      this.board.set(board);
      this.status.set('draw');
      return true;
    }
    return false;
  }

  private pickAiMove(board: readonly Cell[]): number {
    const available = board.flatMap((cell, index) => (cell ? [] : [index]));
    for (const mark of ['O', 'X'] as const) {
      const winning = available.find((index) => {
        const candidate = [...board];
        candidate[index] = mark;
        return this.hasWon(candidate, mark);
      });
      if (winning !== undefined) return winning;
    }
    return [4, 0, 2, 6, 8, 1, 3, 5, 7].find((index) => !board[index]) ?? -1;
  }

  private hasWon(board: readonly Cell[], mark: Mark): boolean {
    return WINS.some(([a, b, c]) => board[a] === mark && board[b] === mark && board[c] === mark);
  }
}
