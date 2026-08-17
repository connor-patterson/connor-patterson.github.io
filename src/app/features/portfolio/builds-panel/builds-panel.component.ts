import { ChangeDetectionStrategy, Component, output } from '@angular/core';

import type { AppId, ProjectCard } from '../../../core/portfolio.models';
import { BUILDS_INTRO, FEATURED_PROJECTS, PROJECT_DETAILS } from '../../../data/portfolio.data';

@Component({
  selector: 'app-builds-panel',
  standalone: true,
  templateUrl: './builds-panel.component.html',
  styleUrl: './builds-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuildsPanelComponent {
  readonly openApp = output<AppId>();

  readonly intro = BUILDS_INTRO;
  readonly projects: readonly ProjectCard[] = FEATURED_PROJECTS;
  readonly details = PROJECT_DETAILS;

  open(id: AppId): void {
    this.openApp.emit(id);
  }
}
