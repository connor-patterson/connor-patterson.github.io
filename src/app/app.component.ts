import { DOCUMENT, NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  HostListener,
  inject,
  signal,
  type Type,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { APP_BY_ID, DESKTOP_APPS } from './core/app.registry';
import type { AppId } from './core/portfolio.models';
import { PreferencesService } from './core/preferences.service';
import { WindowManagerService } from './core/window-manager.service';
import { BuildsPanelComponent } from './features/portfolio/builds-panel/builds-panel.component';
import { ContactPanelComponent } from './features/portfolio/contact-panel/contact-panel.component';
import { ImpactPanelComponent } from './features/portfolio/impact-panel/impact-panel.component';
import { ProfilePanelComponent } from './features/portfolio/profile-panel/profile-panel.component';
import { ResumePanelComponent } from './features/portfolio/resume-panel/resume-panel.component';
import { StartPanelComponent } from './features/portfolio/start-panel/start-panel.component';
import { AppIconComponent } from './ui/app-icon/app-icon.component';
import { DesktopShortcutComponent } from './ui/desktop-shortcut/desktop-shortcut.component';
import { LauncherMenuComponent } from './ui/launcher-menu/launcher-menu.component';
import { TaskbarComponent } from './ui/taskbar/taskbar.component';
import { TourBarComponent } from './ui/tour-bar/tour-bar.component';
import { WindowFrameComponent } from './ui/window-frame/window-frame.component';

type LazyAppId = 'arcade' | 'github' | 'settings' | 'systems';

interface DesktopRipple {
  id: number;
  x: number;
  y: number;
}

interface TourStep {
  readonly id: AppId;
  readonly label: string;
  readonly prompt: string;
}

const TOUR_STEPS: readonly TourStep[] = [
  {
    id: 'impact',
    label: 'Work Log',
    prompt: 'Start with the production work and measured results.',
  },
  {
    id: 'systems',
    label: 'System Explorer',
    prompt: 'See how I connect client, service, and delivery decisions.',
  },
  {
    id: 'builds',
    label: 'Builds',
    prompt: 'Move from enterprise work to the projects I own end to end.',
  },
  { id: 'resume', label: 'Résumé', prompt: 'Scan the one-page version or download a copy.' },
  { id: 'contact', label: 'Contact', prompt: 'Finish with the simplest ways to reach me.' },
];

@Component({
  selector: 'app-root',
  imports: [
    NgComponentOutlet,
    RouterOutlet,
    DesktopShortcutComponent,
    LauncherMenuComponent,
    TaskbarComponent,
    TourBarComponent,
    WindowFrameComponent,
    AppIconComponent,
    StartPanelComponent,
    ImpactPanelComponent,
    BuildsPanelComponent,
    ProfilePanelComponent,
    ResumePanelComponent,
    ContactPanelComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly compactQuery = this.document.defaultView?.matchMedia('(max-width: 1180px)');

  readonly windows = inject(WindowManagerService);
  readonly preferences = inject(PreferencesService);
  readonly apps = DESKTOP_APPS;
  readonly desktopApps = DESKTOP_APPS.filter((app) => app.desktopShortcut);
  readonly launcherOpen = signal(false);
  readonly compact = signal(this.compactQuery?.matches ?? false);
  readonly lazyComponents = signal<Partial<Record<LazyAppId, Type<unknown>>>>({});
  readonly booting = signal(true);
  readonly bootStep = signal(0);
  readonly toast = signal<string | null>(null);
  readonly tourActive = signal(false);
  readonly tourStepIndex = signal(0);
  readonly tourSteps = TOUR_STEPS;
  readonly desktopRipples = signal<readonly DesktopRipple[]>([]);
  readonly bootLabels = ['DISPLAY', 'SHORTCUTS', 'WORKSPACE'] as const;
  readonly announcement = signal(
    'PatterOS is ready. Start Here is open. Press Control K to open the launcher.',
  );

  private readonly lazyLoads = new Map<LazyAppId, Promise<void>>();
  private readonly bootTimers: number[] = [];
  private resizeFrame = 0;
  private backdropFrame = 0;
  private nextRippleId = 0;
  private toastTimer = 0;
  private readonly rippleTimers = new Map<number, number>();
  private readonly returnFocusIds = new Map<AppId, string>();
  private readonly onCompactChange = (event: MediaQueryListEvent): void => {
    this.compact.set(event.matches);
    if (event.matches) {
      const view = this.document.defaultView;
      if (view && this.resizeFrame) view.cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = 0;
      return;
    }
    this.scheduleWorkspaceConstraint();
  };

  constructor() {
    this.compactQuery?.addEventListener('change', this.onCompactChange);
    this.destroyRef.onDestroy(() =>
      this.compactQuery?.removeEventListener('change', this.onCompactChange),
    );
    this.destroyRef.onDestroy(() => {
      const view = this.document.defaultView;
      if (!view) return;
      this.bootTimers.forEach((timer) => view.clearTimeout(timer));
      if (this.resizeFrame) view.cancelAnimationFrame(this.resizeFrame);
      if (this.backdropFrame) view.cancelAnimationFrame(this.backdropFrame);
      if (this.toastTimer) view.clearTimeout(this.toastTimer);
      this.rippleTimers.forEach((timer) => view.clearTimeout(timer));
      this.rippleTimers.clear();
    });

    this.afterPaint(() => this.startBoot());
    this.scheduleWorkspaceConstraint();

    effect(() => {
      const activeId = this.windows.activeId();
      if (activeId && !this.booting()) {
        this.announcement.set(`${APP_BY_ID[activeId].label} is active.`);
        this.focusWindow(activeId, true);
      }
    });

    effect(() => {
      for (const id of ['arcade', 'github', 'settings', 'systems'] as const) {
        if (this.windows.stateFor(id).isOpen) this.ensureLazyApp(id);
      }
    });
  }

  @HostListener('document:keydown', ['$event'])
  handleGlobalKeydown(event: KeyboardEvent): void {
    if (this.booting()) {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.toggleLauncher();
      return;
    }

    if (event.key === 'Escape' && this.launcherOpen()) {
      this.closeLauncher(true);
    }
  }

  @HostListener('window:resize')
  handleViewportResize(): void {
    this.scheduleWorkspaceConstraint();
  }

  handleDesktopPointerMove(event: PointerEvent): void {
    if (!this.interactiveBackdropEnabled() || event.pointerType === 'touch') return;

    const stage = event.currentTarget as HTMLElement;
    const bounds = stage.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100));
    const view = this.document.defaultView;
    if (!view) return;

    if (this.backdropFrame) view.cancelAnimationFrame(this.backdropFrame);
    this.backdropFrame = view.requestAnimationFrame(() => {
      stage.style.setProperty('--signal-x', `${x.toFixed(2)}%`);
      stage.style.setProperty('--signal-y', `${y.toFixed(2)}%`);
      this.backdropFrame = 0;
    });
  }

  handleDesktopPointerLeave(): void {
    const view = this.document.defaultView;
    if (view && this.backdropFrame) view.cancelAnimationFrame(this.backdropFrame);
    this.backdropFrame = 0;
  }

  handleDesktopPointerDown(event: PointerEvent): void {
    if (!this.interactiveBackdropEnabled() || (event.button !== 0 && event.button !== -1)) return;

    const target = event.target as Element | null;
    if (
      target?.closest(
        'button, a, input, textarea, select, [role="button"], app-desktop-shortcut, app-window-frame',
      )
    ) {
      return;
    }

    const stage = event.currentTarget as HTMLElement;
    const bounds = stage.getBoundingClientRect();
    const ripple: DesktopRipple = {
      id: ++this.nextRippleId,
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };

    const current = this.desktopRipples();
    if (current.length >= 4) {
      const oldest = current[0];
      if (oldest) this.clearRippleTimer(oldest.id);
    }
    this.desktopRipples.set([...current.slice(-3), ripple]);

    const view = this.document.defaultView;
    if (!view) return;
    const timer = view.setTimeout(() => {
      this.desktopRipples.update((ripples) => ripples.filter(({ id }) => id !== ripple.id));
      this.rippleTimers.delete(ripple.id);
    }, 900);
    this.rippleTimers.set(ripple.id, timer);
  }

  openFromShortcut(id: AppId): void {
    this.returnFocusIds.set(id, `shortcut-${id}`);
    this.openApp(id);
  }

  skipToWorkspace(event: Event): void {
    event.preventDefault();
    this.document.getElementById('workspace')?.focus();
  }

  openFromLauncher(id: AppId): void {
    this.returnFocusIds.set(
      id,
      APP_BY_ID[id].desktopShortcut ? `shortcut-${id}` : 'taskbar-launcher',
    );
    this.openApp(id);
  }

  openApp(id: AppId): void {
    this.windows.open(id);
    this.launcherOpen.set(false);
    this.ensureLazyApp(id);
    this.syncRoute(id);
    this.announcement.set(`${APP_BY_ID[id].label} opened.`);
    this.focusWindow(id);
  }

  selectTaskbarWindow(id: AppId): void {
    const state = this.windows.stateFor(id);
    if (this.windows.activeId() === id && !state.isMinimized) {
      this.minimizeApp(id);
      return;
    }

    this.windows.restore(id);
    this.ensureLazyApp(id);
    this.syncRoute(id);
    this.announcement.set(`${APP_BY_ID[id].label} restored.`);
    this.focusWindow(id);
  }

  closeApp(id: AppId): void {
    this.windows.close(id);
    this.announcement.set(`${APP_BY_ID[id].label} closed.`);

    const nextId = this.windows.activeId();
    if (nextId) {
      this.syncRoute(nextId);
      this.focusWindow(nextId);
    } else {
      this.restoreLaunchFocus(id);
    }
  }

  minimizeApp(id: AppId): void {
    this.windows.minimize(id);
    this.announcement.set(`${APP_BY_ID[id].label} minimized.`);
    const nextId = this.windows.activeId();
    if (nextId) {
      this.syncRoute(nextId);
      this.focusWindow(nextId);
    } else {
      this.restoreLaunchFocus(id);
    }
  }

  toggleMaximize(id: AppId): void {
    this.windows.toggleMaximize(id);
    const verb = this.windows.stateFor(id).isMaximized ? 'maximized' : 'restored';
    this.announcement.set(`${APP_BY_ID[id].label} ${verb}.`);
    this.focusWindow(id);
  }

  async copyWindowLink(id: AppId): Promise<void> {
    const url = new URL(this.document.location.href);
    url.hash = `/${APP_BY_ID[id].route}`;
    const link = url.toString();
    try {
      await globalThis.navigator.clipboard.writeText(link);
      this.announcement.set(`Link to ${APP_BY_ID[id].label} copied.`);
      this.showToast(`Link copied: ${APP_BY_ID[id].taskbarLabel}`);
      return;
    } catch {
      this.document.defaultView?.prompt('Copy this link:', link);
      this.announcement.set(`A copyable link to ${APP_BY_ID[id].label} is open.`);
    }
  }

  startTour(): void {
    this.tourActive.set(true);
    this.tourStepIndex.set(0);
    this.openTourStep();
  }

  moveTour(direction: -1 | 1): void {
    const nextIndex = this.tourStepIndex() + direction;
    if (nextIndex < 0) return;
    if (nextIndex >= this.tourSteps.length) {
      this.endTour();
      return;
    }
    this.tourStepIndex.set(nextIndex);
    this.openTourStep();
  }

  endTour(): void {
    this.tourActive.set(false);
    this.announcement.set('Quick tour ended. The desktop remains open for exploring.');
  }

  toggleLauncher(): void {
    if (this.launcherOpen()) {
      this.closeLauncher(true);
      this.announcement.set('Application launcher closed.');
      return;
    }

    this.launcherOpen.set(true);
    this.announcement.set('Application launcher opened.');

    this.afterPaint(() => this.document.getElementById('launcher-app-start')?.focus());
  }

  closeLauncher(returnFocus = false): void {
    this.launcherOpen.set(false);
    if (returnFocus) {
      this.afterPaint(() => this.document.querySelector<HTMLElement>('.taskbar__start')?.focus());
    }
  }

  private syncRoute(id: AppId): void {
    const target = `/${APP_BY_ID[id].route}`;
    if (this.router.url !== target) {
      void this.router.navigate([APP_BY_ID[id].route], { replaceUrl: true });
    }
  }

  private interactiveBackdropEnabled(): boolean {
    return (
      this.preferences.motion() &&
      !this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  private clearRippleTimer(id: number): void {
    const timer = this.rippleTimers.get(id);
    if (timer === undefined) return;
    this.document.defaultView?.clearTimeout(timer);
    this.rippleTimers.delete(id);
  }

  private startBoot(): void {
    const view = this.document.defaultView;
    if (!view) {
      this.finishBoot();
      return;
    }

    const timings = this.preferences.motion() ? [220, 470, 760, 1_080] : [10, 20, 30, 80];
    timings.slice(0, 3).forEach((delay, index) => {
      this.bootTimers.push(view.setTimeout(() => this.bootStep.set(index + 1), delay));
    });
    this.bootTimers.push(view.setTimeout(() => this.finishBoot(), timings[3]!));
  }

  private finishBoot(): void {
    if (!this.booting()) return;
    const view = this.document.defaultView;
    if (view) this.bootTimers.forEach((timer) => view.clearTimeout(timer));
    this.bootTimers.length = 0;
    this.bootStep.set(this.bootLabels.length);
    this.booting.set(false);
    this.announcement.set('PatterOS is ready. Start Here is open.');
    const activeId = this.windows.activeId();
    if (activeId) this.focusWindow(activeId, true);
  }

  private scheduleWorkspaceConstraint(): void {
    const view = this.document.defaultView;
    if (!view || this.compact()) return;
    if (this.resizeFrame) view.cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = view.requestAnimationFrame(() => {
      this.resizeFrame = 0;
      if (this.compact() || this.compactQuery?.matches) return;
      this.windows.constrain({ width: view.innerWidth, height: view.innerHeight });
    });
  }

  private showToast(message: string): void {
    const view = this.document.defaultView;
    this.toast.set(message);
    if (!view) return;
    if (this.toastTimer) view.clearTimeout(this.toastTimer);
    this.toastTimer = view.setTimeout(() => {
      this.toast.set(null);
      this.toastTimer = 0;
    }, 2_400);
  }

  private openTourStep(): void {
    const step = this.tourSteps[this.tourStepIndex()];
    if (!step) return;
    this.openApp(step.id);
    this.announcement.set(`Tour step ${this.tourStepIndex() + 1}: ${step.label}. ${step.prompt}`);
  }

  private focusWindow(id: AppId, preventScroll = false): void {
    this.afterPaint(() => this.document.getElementById(`window-${id}`)?.focus({ preventScroll }));
  }

  private restoreLaunchFocus(id: AppId): void {
    const preferred = this.returnFocusIds.get(id) ?? `shortcut-${id}`;
    this.afterPaint(() => this.document.getElementById(preferred)?.focus());
  }

  private afterPaint(callback: () => void): void {
    const view = this.document.defaultView;
    if (view) {
      view.requestAnimationFrame(() => callback());
      return;
    }
    callback();
  }

  private ensureLazyApp(id: AppId): void {
    switch (id) {
      case 'arcade':
        void this.loadLazyApp(id, () =>
          import('./features/arcade/arcade-panel.component').then(
            ({ ArcadePanelComponent }) => ArcadePanelComponent,
          ),
        );
        break;
      case 'github':
        void this.loadLazyApp(id, () =>
          import('./features/github/github-panel.component').then(
            ({ GithubPanelComponent }) => GithubPanelComponent,
          ),
        );
        break;
      case 'settings':
        void this.loadLazyApp(id, () =>
          import('./features/settings/settings-panel.component').then(
            ({ SettingsPanelComponent }) => SettingsPanelComponent,
          ),
        );
        break;
      case 'systems':
        void this.loadLazyApp(id, () =>
          import('./features/systems/systems-panel.component').then(
            ({ SystemsPanelComponent }) => SystemsPanelComponent,
          ),
        );
    }
  }

  private loadLazyApp(id: LazyAppId, importComponent: () => Promise<Type<unknown>>): Promise<void> {
    if (this.lazyComponents()[id]) return Promise.resolve();

    const current = this.lazyLoads.get(id);
    if (current) return current;

    const load = importComponent()
      .then((component) =>
        this.lazyComponents.update((components) => ({ ...components, [id]: component })),
      )
      .catch((error: unknown) => {
        const label = APP_BY_ID[id].label;
        console.error(`${label} failed to load.`, error);
        this.announcement.set(`${label} failed to load. Other applications remain available.`);
      })
      .finally(() => this.lazyLoads.delete(id));

    this.lazyLoads.set(id, load);
    return load;
  }
}
