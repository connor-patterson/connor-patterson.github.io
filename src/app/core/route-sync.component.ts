import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';

import type { AppId } from './portfolio.models';
import { WindowManagerService } from './window-manager.service';

@Component({
  selector: 'app-route-sync',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RouteSyncComponent {
  readonly appId = input<AppId>();

  private readonly windows = inject(WindowManagerService);

  constructor() {
    effect(() => {
      const id = this.appId();
      if (id) {
        this.windows.open(id);
      }
    });
  }
}
