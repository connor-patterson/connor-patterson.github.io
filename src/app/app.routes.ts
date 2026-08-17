import type { Routes } from '@angular/router';

import { DESKTOP_APPS } from './core/app.registry';
import { RouteSyncComponent } from './core/route-sync.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'start',
  },
  ...DESKTOP_APPS.map((app) => ({
    path: app.route,
    component: RouteSyncComponent,
    data: { appId: app.id },
  })),
  {
    path: '**',
    redirectTo: 'start',
  },
];
