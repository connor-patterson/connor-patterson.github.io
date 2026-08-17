import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { AppIconName } from '../../core/portfolio.models';

@Component({
  selector: 'app-icon',
  templateUrl: './app-icon.component.html',
  styleUrl: './app-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppIconComponent {
  readonly name = input.required<AppIconName>();
}
