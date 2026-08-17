import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { PreferencesService } from '../../core/preferences.service';
import { WindowManagerService } from '../../core/window-manager.service';
import { AppIconComponent } from '../../ui/app-icon/app-icon.component';

@Component({
  selector: 'app-settings-panel',
  imports: [AppIconComponent],
  templateUrl: './settings-panel.component.html',
  styleUrl: './settings-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPanelComponent {
  readonly preferences = inject(PreferencesService);
  private readonly document = inject(DOCUMENT);
  private readonly windows = inject(WindowManagerService);

  setScanlines(event: Event): void {
    this.preferences.setScanlines((event.target as HTMLInputElement).checked);
  }

  setMotion(event: Event): void {
    this.preferences.setMotion((event.target as HTMLInputElement).checked);
  }

  setReadingMode(event: Event): void {
    this.preferences.setReadingMode((event.target as HTMLInputElement).checked);
  }

  resetWorkspace(): void {
    this.preferences.reset();
    this.windows.reset();
  }

  resetLocalData(): void {
    const confirmed = this.document.defaultView?.confirm(
      'Clear game scores, display settings, and your saved window layout?',
    );
    if (!confirmed) return;

    this.preferences.reset();
    this.windows.reset();
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('patteros.')) {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // Storage may be unavailable in privacy-restricted contexts.
    }
  }
}
