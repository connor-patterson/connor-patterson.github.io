import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { AppId, DesktopAppDefinition } from '../../core/portfolio.models';
import { AppIconComponent } from '../app-icon/app-icon.component';

@Component({
  selector: 'app-desktop-shortcut',
  imports: [AppIconComponent],
  templateUrl: './desktop-shortcut.component.html',
  styleUrl: './desktop-shortcut.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesktopShortcutComponent {
  readonly app = input.required<DesktopAppDefinition>();
  readonly launch = output<AppId>();
}
