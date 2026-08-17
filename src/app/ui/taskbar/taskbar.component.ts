import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { OnDestroy } from '@angular/core';

import type {
  AppId,
  DesktopAppDefinition,
  DesktopWindowState,
  ThemeMode,
} from '../../core/portfolio.models';
import { AppIconComponent } from '../app-icon/app-icon.component';

export interface TaskbarWindow {
  readonly definition: DesktopAppDefinition;
  readonly state: DesktopWindowState;
}

@Component({
  selector: 'app-taskbar',
  imports: [AppIconComponent],
  templateUrl: './taskbar.component.html',
  styleUrl: './taskbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskbarComponent implements OnDestroy {
  readonly windows = input.required<readonly TaskbarWindow[]>();
  readonly activeId = input<AppId | null>(null);
  readonly launcherOpen = input(false);
  readonly theme = input<ThemeMode>('day');

  readonly launcherToggled = output<void>();
  readonly windowSelected = output<AppId>();
  readonly themeToggled = output<void>();

  private readonly now = signal(new Date());
  private readonly clockTimer = setInterval(() => this.now.set(new Date()), 30_000);

  readonly time = computed(() =>
    new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(this.now()),
  );

  readonly date = computed(() =>
    new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
    }).format(this.now()),
  );

  readonly timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  readonly clockLabel = computed(() =>
    new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'long',
    }).format(this.now()),
  );

  readonly dateTime = computed(() => this.now().toISOString());

  ngOnDestroy(): void {
    clearInterval(this.clockTimer);
  }
}
