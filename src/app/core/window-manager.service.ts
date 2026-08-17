import { computed, Injectable, signal, untracked } from '@angular/core';

import { DESKTOP_APPS } from './app.registry';
import type { AppId, DesktopWindowState, Point, WindowSize } from './portfolio.models';

const INITIAL_Z_INDEX = 20;
const Z_INDEX_CEILING = 900;
const MIN_WINDOW_WIDTH = 360;
const MIN_WINDOW_HEIGHT = 280;
const WINDOW_EDGE_GAP = 12;
const DESKTOP_CHROME_HEIGHT = 124;
export const WINDOW_LAYOUT_STORAGE_KEY = 'patteros.window-layout.v2';

export interface StoredWindowLayout {
  readonly position: Point;
  readonly size: WindowSize;
}

interface StoredWorkspaceLayout {
  readonly version: 2;
  readonly windows: Partial<Record<AppId, StoredWindowLayout>>;
}

export type WorkspaceAction =
  | { readonly type: 'open'; readonly id: AppId }
  | { readonly type: 'close'; readonly id: AppId }
  | { readonly type: 'minimize'; readonly id: AppId }
  | { readonly type: 'restore'; readonly id: AppId }
  | { readonly type: 'focus'; readonly id: AppId }
  | { readonly type: 'toggle-maximize'; readonly id: AppId }
  | { readonly type: 'move'; readonly id: AppId; readonly position: Point }
  | { readonly type: 'resize'; readonly id: AppId; readonly size: WindowSize }
  | { readonly type: 'reset' };

export type WorkspaceState = Readonly<Record<AppId, DesktopWindowState>>;

export function createInitialWorkspaceState(
  stored: Partial<Record<AppId, StoredWindowLayout>> = {},
): WorkspaceState {
  return Object.fromEntries(
    DESKTOP_APPS.map((app, index) => [
      app.id,
      {
        id: app.id,
        isOpen: app.initiallyOpen ?? false,
        isMinimized: false,
        isMaximized: false,
        zIndex: INITIAL_Z_INDEX + index,
        position: stored[app.id]?.position ?? app.defaultPosition,
        size: stored[app.id]?.size ?? app.defaultSize,
      },
    ]),
  ) as Record<AppId, DesktopWindowState>;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function constrainWindow(window: DesktopWindowState, bounds: WindowSize): DesktopWindowState {
  const availableWidth = Math.max(240, bounds.width - WINDOW_EDGE_GAP * 2);
  const availableHeight = Math.max(
    180,
    bounds.height - DESKTOP_CHROME_HEIGHT - WINDOW_EDGE_GAP * 2,
  );
  const width = clamp(
    window.size.width,
    Math.min(MIN_WINDOW_WIDTH, availableWidth),
    availableWidth,
  );
  const height = clamp(
    window.size.height,
    Math.min(MIN_WINDOW_HEIGHT, availableHeight),
    availableHeight,
  );
  const x = clamp(
    window.position.x,
    WINDOW_EDGE_GAP,
    Math.max(WINDOW_EDGE_GAP, bounds.width - width - WINDOW_EDGE_GAP),
  );
  const y = clamp(
    window.position.y,
    WINDOW_EDGE_GAP,
    Math.max(WINDOW_EDGE_GAP, bounds.height - DESKTOP_CHROME_HEIGHT - height - WINDOW_EDGE_GAP),
  );

  return { ...window, position: { x, y }, size: { width, height } };
}

export function fitWorkspaceToBounds(state: WorkspaceState, bounds: WindowSize): WorkspaceState {
  return Object.fromEntries(
    DESKTOP_APPS.map((app) => [app.id, constrainWindow(state[app.id], bounds)]),
  ) as Record<AppId, DesktopWindowState>;
}

export function getActiveWindowId(state: WorkspaceState): AppId | null {
  const visible = DESKTOP_APPS.map((app) => state[app.id]).filter(
    (window) => window.isOpen && !window.isMinimized,
  );

  if (visible.length === 0) {
    return null;
  }

  return visible.reduce((front, current) => (current.zIndex > front.zIndex ? current : front)).id;
}

function replaceWindow(
  state: WorkspaceState,
  id: AppId,
  changes: Partial<DesktopWindowState>,
): WorkspaceState {
  return {
    ...state,
    [id]: {
      ...state[id],
      ...changes,
    },
  };
}

function normalizedState(state: WorkspaceState): WorkspaceState {
  const byDepth = DESKTOP_APPS.map((app) => state[app.id]).sort(
    (left, right) => left.zIndex - right.zIndex,
  );

  return Object.fromEntries(
    byDepth.map((window, index) => [window.id, { ...window, zIndex: INITIAL_Z_INDEX + index }]),
  ) as Record<AppId, DesktopWindowState>;
}

function bringToFront(state: WorkspaceState, id: AppId): WorkspaceState {
  if (getActiveWindowId(state) === id) {
    return state;
  }

  const highest = Math.max(...DESKTOP_APPS.map((app) => state[app.id].zIndex));
  const bounded = highest >= Z_INDEX_CEILING ? normalizedState(state) : state;
  const next = Math.max(...DESKTOP_APPS.map((app) => bounded[app.id].zIndex)) + 1;
  return replaceWindow(bounded, id, { zIndex: next });
}

/** Pure state transition used by the service and exercised directly in tests. */
export function reduceWorkspace(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  const current = 'id' in action ? state[action.id] : null;

  switch (action.type) {
    case 'open': {
      if (current?.isOpen && !current.isMinimized && getActiveWindowId(state) === action.id) {
        return state;
      }
      const opened = replaceWindow(state, action.id, {
        isOpen: true,
        isMinimized: false,
      });
      return bringToFront(opened, action.id);
    }
    case 'close':
      if (!current?.isOpen) return state;
      return replaceWindow(state, action.id, {
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
      });
    case 'minimize':
      if (!current?.isOpen || current.isMinimized) return state;
      return replaceWindow(state, action.id, { isMinimized: true });
    case 'restore': {
      const restored = replaceWindow(state, action.id, {
        isOpen: true,
        isMinimized: false,
      });
      return bringToFront(restored, action.id);
    }
    case 'focus':
      if (!current?.isOpen || current.isMinimized) return state;
      return bringToFront(state, action.id);
    case 'toggle-maximize': {
      if (!current?.isOpen) return state;
      const resized = replaceWindow(state, action.id, {
        isMaximized: !current.isMaximized,
        isMinimized: false,
      });
      return bringToFront(resized, action.id);
    }
    case 'move':
      if (!current?.isOpen || current.isMaximized) return state;
      return replaceWindow(state, action.id, { position: action.position });
    case 'resize':
      if (!current?.isOpen || current.isMaximized) return state;
      return replaceWindow(state, action.id, { size: action.size });
    case 'reset':
      return createInitialWorkspaceState();
  }
}

function isPoint(value: unknown): value is Point {
  if (!value || typeof value !== 'object') return false;
  const point = value as Partial<Point>;
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function isWindowSize(value: unknown): value is WindowSize {
  if (!value || typeof value !== 'object') return false;
  const size = value as Partial<WindowSize>;
  return (
    Number.isFinite(size.width) &&
    Number.isFinite(size.height) &&
    Number(size.width) > 0 &&
    Number(size.height) > 0
  );
}

function readStoredLayout(): Partial<Record<AppId, StoredWindowLayout>> {
  try {
    const stored = localStorage.getItem(WINDOW_LAYOUT_STORAGE_KEY);
    if (!stored) return {};

    const parsed = JSON.parse(stored) as Partial<StoredWorkspaceLayout>;
    if (parsed.version !== 2 || !parsed.windows) return {};

    return Object.fromEntries(
      DESKTOP_APPS.flatMap((app) => {
        const layout = parsed.windows?.[app.id];
        return layout && isPoint(layout.position) && isWindowSize(layout.size)
          ? [[app.id, layout] as const]
          : [];
      }),
    );
  } catch {
    return {};
  }
}

function storeLayout(state: WorkspaceState): void {
  const layout: StoredWorkspaceLayout = {
    version: 2,
    windows: Object.fromEntries(
      DESKTOP_APPS.map((app) => [
        app.id,
        { position: state[app.id].position, size: state[app.id].size },
      ]),
    ),
  };

  try {
    localStorage.setItem(WINDOW_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Storage is optional. Window controls still work for the current visit.
  }
}

@Injectable({ providedIn: 'root' })
export class WindowManagerService {
  private readonly state = signal<WorkspaceState>(createInitialWorkspaceState(readStoredLayout()));
  private readonly viewportBounds = signal<WindowSize | null>(null);
  private readonly displayState = computed<WorkspaceState>(() => {
    const state = this.state();
    const bounds = this.viewportBounds();
    return bounds ? fitWorkspaceToBounds(state, bounds) : state;
  });

  readonly windows = computed(() =>
    DESKTOP_APPS.map((app) => ({
      definition: app,
      state: this.displayState()[app.id],
    })),
  );

  readonly openWindows = computed(() => this.windows().filter(({ state }) => state.isOpen));

  readonly activeId = computed(() => getActiveWindowId(this.state()));

  stateFor(id: AppId): DesktopWindowState {
    return this.displayState()[id];
  }

  open(id: AppId): void {
    this.dispatch({ type: 'open', id });
  }

  close(id: AppId): void {
    this.dispatch({ type: 'close', id });
  }

  minimize(id: AppId): void {
    this.dispatch({ type: 'minimize', id });
  }

  restore(id: AppId): void {
    this.dispatch({ type: 'restore', id });
  }

  focus(id: AppId): void {
    this.dispatch({ type: 'focus', id });
  }

  toggleMaximize(id: AppId): void {
    this.dispatch({ type: 'toggle-maximize', id });
  }

  move(id: AppId, position: Point): void {
    this.dispatch({ type: 'move', id, position });
  }

  resize(id: AppId, size: WindowSize): void {
    this.dispatch({ type: 'resize', id, size });
  }

  constrain(bounds: WindowSize): void {
    this.viewportBounds.set(bounds);
  }

  reset(): void {
    this.state.set(createInitialWorkspaceState());
    try {
      localStorage.removeItem(WINDOW_LAYOUT_STORAGE_KEY);
    } catch {
      // Storage restrictions do not affect the in-memory reset.
    }
  }

  private dispatch(action: WorkspaceAction): void {
    const current = untracked(this.state);
    const next = reduceWorkspace(current, action);
    if (next === current) return;
    this.state.set(next);
    storeLayout(next);
  }
}
