import { ChangeDetectionStrategy, Component, output } from '@angular/core';

import type { AppId } from '../../../core/portfolio.models';
import { PORTFOLIO_ASSETS, START_COPY, START_METRICS } from '../../../data/portfolio.data';

@Component({
  selector: 'app-start-panel',
  standalone: true,
  templateUrl: './start-panel.component.html',
  styleUrl: './start-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartPanelComponent {
  readonly openApp = output<AppId>();
  readonly startTour = output<void>();

  readonly copy = START_COPY;
  readonly metrics = START_METRICS;
  readonly portrait = PORTFOLIO_ASSETS.portrait;

  open(id: AppId): void {
    this.openApp.emit(id);
  }

  beginTour(): void {
    this.startTour.emit();
  }
}
