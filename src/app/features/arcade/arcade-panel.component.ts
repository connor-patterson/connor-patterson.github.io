import { ChangeDetectionStrategy, Component, effect, signal, viewChild } from '@angular/core';
import type { ElementRef } from '@angular/core';

import { ARCADE_CARTRIDGES } from '../../core/app.registry';
import type { ArcadeCartridge } from '../../core/portfolio.models';
import { MemoryMatchComponent } from './memory-match/memory-match.component';
import { SnakeComponent } from './snake/snake.component';

type ArcadeView = 'shelf' | ArcadeCartridge['id'];

@Component({
  selector: 'app-arcade-panel',
  imports: [MemoryMatchComponent, SnakeComponent],
  templateUrl: './arcade-panel.component.html',
  styleUrl: './arcade-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArcadePanelComponent {
  protected readonly cartridges = ARCADE_CARTRIDGES;
  protected readonly activeView = signal<ArcadeView>('shelf');
  protected readonly announcement = signal('Arcade ready. Choose a game.');

  private readonly backButton = viewChild<ElementRef<HTMLButtonElement>>('backButton');
  private readonly shelfHeading = viewChild<ElementRef<HTMLElement>>('shelfHeading');
  private hasLaunched = false;

  constructor() {
    effect(() => {
      const view = this.activeView();
      if (view === 'shelf') {
        const heading = this.shelfHeading();
        if (this.hasLaunched && heading) {
          heading.nativeElement.focus();
        }
        return;
      }

      this.backButton()?.nativeElement.focus();
    });
  }

  protected launch(game: ArcadeCartridge): void {
    this.hasLaunched = true;
    this.announcement.set(`${game.title} opened. ${game.description}`);
    this.activeView.set(game.id);
  }

  protected returnToShelf(): void {
    this.announcement.set('Returned to the game list.');
    this.activeView.set('shelf');
  }
}
