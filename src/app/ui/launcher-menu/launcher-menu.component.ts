import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { AppId, DesktopAppDefinition, ThemeMode } from '../../core/portfolio.models';
import { AppIconComponent } from '../app-icon/app-icon.component';

@Component({
  selector: 'app-launcher-menu',
  imports: [AppIconComponent],
  templateUrl: './launcher-menu.component.html',
  styleUrl: './launcher-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LauncherMenuComponent {
  readonly apps = input.required<readonly DesktopAppDefinition[]>();
  readonly theme = input<ThemeMode>('day');
  readonly launch = output<AppId>();
  readonly shutdown = output<void>();
}
