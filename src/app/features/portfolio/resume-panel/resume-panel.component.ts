import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  EVIDENCE_BRIEF,
  PORTFOLIO_ASSETS,
  RESUME_COPY,
  RESUME_HIGHLIGHTS,
} from '../../../data/portfolio.data';

@Component({
  selector: 'app-resume-panel',
  standalone: true,
  templateUrl: './resume-panel.component.html',
  styleUrl: './resume-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumePanelComponent {
  readonly copy = RESUME_COPY;
  readonly resume = PORTFOLIO_ASSETS.resume;
  readonly brief = EVIDENCE_BRIEF;
  readonly highlights = RESUME_HIGHLIGHTS;
}
