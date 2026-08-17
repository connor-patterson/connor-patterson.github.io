import {
  ChangeDetectionStrategy,
  Component,
  effect,
  HostListener,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import type { ElementRef, OnDestroy } from '@angular/core';

import { WindowManagerService } from '../../../core/window-manager.service';
import { readBestScore, seedForDay, writeBestScore } from '../arcade-session';
import {
  chooseMemoryCard,
  createMemoryState,
  hideMemoryMismatch,
  startMemory,
  toggleMemoryPause,
  type MemoryCard,
} from './memory-match.game';

function readBestMoves(): number | null {
  const moves = readBestScore('memory-match', 'best');
  return moves > 0 ? moves : null;
}

@Component({
  selector: 'app-memory-match',
  templateUrl: './memory-match.component.html',
  styleUrl: './memory-match.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemoryMatchComponent implements OnDestroy {
  private readonly windows = inject(WindowManagerService);
  protected readonly state = signal(createMemoryState(seedForDay('memory-match')));
  protected readonly bestMoves = signal<number | null>(readBestMoves());

  private readonly cardButtons = viewChildren<ElementRef<HTMLButtonElement>>('memoryCard');
  private mismatchId: ReturnType<typeof setTimeout> | null = null;

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
    this.state.update(startMemory);
    this.focusFirstCard();
  }

  protected choose(cardId: number): void {
    this.state.update((state) => chooseMemoryCard(state, cardId));
    if (this.state().locked) {
      this.scheduleMismatch();
    }
    this.saveBestIfComplete();
  }

  protected pause(): void {
    const status = this.state().status;
    if (status === 'running') {
      this.clearMismatch();
    }
    this.state.update(toggleMemoryPause);
    if (status === 'paused') {
      if (this.state().locked) {
        this.scheduleMismatch();
      } else {
        this.focusFirstAvailableCard();
      }
    }
  }

  protected restart(): void {
    this.clearMismatch();
    this.state.set(startMemory(createMemoryState(seedForDay('memory-match'))));
    this.focusFirstCard();
  }

  protected isFaceUp(card: MemoryCard): boolean {
    return card.matched || this.state().faceUpIds.includes(card.id);
  }

  protected cardLabel(card: MemoryCard, index: number): string {
    if (card.matched) {
      return `${card.label}, matched`;
    }
    if (this.state().faceUpIds.includes(card.id)) {
      return `${card.label}, face up`;
    }
    return `Hidden card ${index + 1}`;
  }

  @HostListener('keydown', ['$event'])
  protected handleKeyboard(event: KeyboardEvent): void {
    if (event.repeat || this.isInteractiveTarget(event.target)) {
      return;
    }

    const key = event.key.toLowerCase();
    if ((key === ' ' || key === 'enter') && this.state().status === 'ready') {
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
    this.clearMismatch();
  }

  private scheduleMismatch(): void {
    this.clearMismatch();
    this.mismatchId = setTimeout(() => {
      this.state.update(hideMemoryMismatch);
      this.mismatchId = null;
      this.focusFirstAvailableCard();
    }, 650);
  }

  private clearMismatch(): void {
    if (this.mismatchId !== null) {
      clearTimeout(this.mismatchId);
      this.mismatchId = null;
    }
  }

  private saveBestIfComplete(): void {
    const state = this.state();
    const previousBest = this.bestMoves();
    if (state.status !== 'complete' || (previousBest !== null && previousBest <= state.moves)) {
      return;
    }
    this.bestMoves.set(state.moves);
    writeBestScore('memory-match', 'best', state.moves);
  }

  private focusFirstCard(): void {
    queueMicrotask(() => this.cardButtons()[0]?.nativeElement.focus());
  }

  private focusFirstAvailableCard(): void {
    queueMicrotask(() => {
      const button = this.cardButtons().find((candidate) => !candidate.nativeElement.disabled);
      button?.nativeElement.focus();
    });
  }

  private isInteractiveTarget(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLElement &&
      Boolean(target.closest('button, a, input, textarea, select, summary'))
    );
  }
}
