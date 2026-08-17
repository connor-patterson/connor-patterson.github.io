import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import {
  IMPACT_CASE_PAGES,
  IMPACT_CASE_STUDIES,
  IMPACT_INTRO,
  IMPACT_PATCH_NOTES,
} from '../../../data/portfolio.data';

@Component({
  selector: 'app-impact-panel',
  standalone: true,
  templateUrl: './impact-panel.component.html',
  styleUrl: './impact-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpactPanelComponent {
  readonly intro = IMPACT_INTRO;
  readonly caseStudies = IMPACT_CASE_STUDIES;
  readonly casePages = IMPACT_CASE_PAGES;
  readonly patchNotes = IMPACT_PATCH_NOTES;
  readonly years = ['2026', '2025', '2024', '2023'] as const;
  readonly selectedYear = signal<(typeof this.years)[number]>('2026');
  readonly selectedNotes = computed(() =>
    this.patchNotes.filter((note) => note.year === this.selectedYear()),
  );

  selectYear(year: (typeof this.years)[number]): void {
    this.selectedYear.set(year);
  }
}
