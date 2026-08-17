import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import type { ElementRef, OnDestroy } from '@angular/core';

import { WindowManagerService } from '../../../core/window-manager.service';
import { readBestScore, seedForDay, writeBestScore } from '../arcade-session';
import {
  createSnakeState,
  startSnake,
  stepSnake,
  toggleSnakePause,
  turnSnake,
  type SnakeDirection,
} from './snake.game';

interface SnakeCell {
  readonly key: number;
  readonly kind: 'empty' | 'snake' | 'head' | 'food';
}

@Component({
  selector: 'app-snake',
  templateUrl: './snake.component.html',
  styleUrl: './snake.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnakeComponent implements OnDestroy {
  private readonly windows = inject(WindowManagerService);
  protected readonly state = signal(createSnakeState(seedForDay('snake')));
  protected readonly bestScore = signal(readBestScore('snake', 'all-time'));
  protected readonly cells = computed<readonly SnakeCell[]>(() => {
    const state = this.state();
    const snakeCells = new Map(
      state.snake.map((segment, index) => [`${segment.x}:${segment.y}`, index] as const),
    );
    const cells: SnakeCell[] = [];

    for (let y = 0; y < state.boardSize; y += 1) {
      for (let x = 0; x < state.boardSize; x += 1) {
        const snakeIndex = snakeCells.get(`${x}:${y}`);
        const isFood = state.food?.x === x && state.food.y === y;
        cells.push({
          key: y * state.boardSize + x,
          kind:
            snakeIndex === 0
              ? 'head'
              : snakeIndex !== undefined
                ? 'snake'
                : isFood
                  ? 'food'
                  : 'empty',
        });
      }
    }

    return cells;
  });
  protected readonly boardLabel = computed(
    () => `Snake board. Score ${this.state().score}. Use arrow keys or the direction buttons.`,
  );

  private readonly gameStage = viewChild<ElementRef<HTMLElement>>('gameStage');
  private clockId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      const arcade = this.windows.stateFor('arcade');
      if (
        (this.windows.activeId() !== 'arcade' || arcade.isMinimized) &&
        this.state().status === 'running'
      ) {
        this.pause();
      }
    });
  }

  protected start(): void {
    this.state.update(startSnake);
    this.startClock();
    queueMicrotask(() => this.gameStage()?.nativeElement.focus());
  }

  protected turn(direction: SnakeDirection): void {
    if (this.state().status === 'ready') {
      this.start();
    }
    this.state.update((state) => turnSnake(state, direction));
  }

  protected pause(): void {
    const status = this.state().status;
    this.state.update(toggleSnakePause);
    if (status === 'running') {
      this.stopClock();
    } else if (status === 'paused') {
      this.startClock();
      queueMicrotask(() => this.gameStage()?.nativeElement.focus());
    }
  }

  protected restart(): void {
    this.stopClock();
    this.state.set(startSnake(createSnakeState(seedForDay('snake'))));
    this.startClock();
    queueMicrotask(() => this.gameStage()?.nativeElement.focus());
  }

  @HostListener('keydown', ['$event'])
  protected handleKeyboard(event: KeyboardEvent): void {
    if (event.repeat || this.isInteractiveTarget(event.target)) {
      return;
    }

    const key = event.key.toLowerCase();
    const directionByKey: Readonly<Record<string, SnakeDirection>> = {
      arrowup: 'up',
      w: 'up',
      arrowdown: 'down',
      s: 'down',
      arrowleft: 'left',
      a: 'left',
      arrowright: 'right',
      d: 'right',
    };
    const direction = directionByKey[key];

    if (direction) {
      event.preventDefault();
      this.turn(direction);
    } else if ((key === ' ' || key === 'enter') && this.state().status === 'ready') {
      event.preventDefault();
      this.start();
    } else if (key === 'p' || key === 'escape') {
      event.preventDefault();
      this.pause();
    } else if (key === 'r') {
      event.preventDefault();
      this.restart();
    }
  }

  @HostListener('document:visibilitychange')
  protected handleVisibility(): void {
    if (document.hidden && this.state().status === 'running') {
      this.pause();
    }
  }

  ngOnDestroy(): void {
    this.stopClock();
  }

  private startClock(): void {
    if (this.clockId !== null || this.state().status !== 'running') {
      return;
    }

    this.clockId = setInterval(() => {
      this.state.update(stepSnake);
      this.finishIfNeeded();
    }, 140);
  }

  private stopClock(): void {
    if (this.clockId !== null) {
      clearInterval(this.clockId);
      this.clockId = null;
    }
  }

  private finishIfNeeded(): void {
    const state = this.state();
    if (state.score > this.bestScore()) {
      this.bestScore.set(state.score);
      writeBestScore('snake', 'all-time', state.score);
    }
    if (state.status === 'game-over' || state.status === 'won') {
      this.stopClock();
    }
  }

  private isInteractiveTarget(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLElement &&
      Boolean(target.closest('button, a, input, textarea, select, summary'))
    );
  }
}
