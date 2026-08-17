import { DESKTOP_APPS } from './app.registry';
import {
  createInitialWorkspaceState,
  fitWorkspaceToBounds,
  getActiveWindowId,
  reduceWorkspace,
} from './window-manager.service';

describe('workspace transitions', () => {
  it('starts with exactly the configured default app visible and active', () => {
    const state = createInitialWorkspaceState();
    const open = DESKTOP_APPS.filter((app) => state[app.id].isOpen);

    expect(open.map((app) => app.id)).toEqual(['start']);
    expect(getActiveWindowId(state)).toBe('start');
  });

  it('treats opening the already active window as a no-op', () => {
    const initial = createInitialWorkspaceState();

    expect(reduceWorkspace(initial, { type: 'open', id: 'start' })).toBe(initial);
  });

  it('opens, focuses, minimizes, restores, and closes without invalid active state', () => {
    let state = createInitialWorkspaceState();
    state = reduceWorkspace(state, { type: 'open', id: 'impact' });
    expect(getActiveWindowId(state)).toBe('impact');

    state = reduceWorkspace(state, { type: 'focus', id: 'start' });
    expect(getActiveWindowId(state)).toBe('start');

    state = reduceWorkspace(state, { type: 'minimize', id: 'start' });
    expect(getActiveWindowId(state)).toBe('impact');

    state = reduceWorkspace(state, { type: 'restore', id: 'start' });
    expect(getActiveWindowId(state)).toBe('start');
    expect(state.start.isMinimized).toBe(false);

    state = reduceWorkspace(state, { type: 'close', id: 'start' });
    expect(getActiveWindowId(state)).toBe('impact');
    expect(state.start.isOpen).toBe(false);
  });

  it('ignores focus and movement commands that cannot be valid', () => {
    const initial = createInitialWorkspaceState();
    const focusedClosed = reduceWorkspace(initial, { type: 'focus', id: 'contact' });
    const movedClosed = reduceWorkspace(initial, {
      type: 'move',
      id: 'contact',
      position: { x: 999, y: 999 },
    });

    expect(focusedClosed).toBe(initial);
    expect(movedClosed).toBe(initial);
  });

  it('ignores resize commands for closed and maximized windows', () => {
    const initial = createInitialWorkspaceState();
    const resizedClosed = reduceWorkspace(initial, {
      type: 'resize',
      id: 'contact',
      size: { width: 500, height: 400 },
    });
    const maximized = reduceWorkspace(initial, { type: 'toggle-maximize', id: 'start' });
    const resizedMaximized = reduceWorkspace(maximized, {
      type: 'resize',
      id: 'start',
      size: { width: 500, height: 400 },
    });

    expect(resizedClosed).toBe(initial);
    expect(resizedMaximized).toBe(maximized);
  });

  it('keeps a customized layout when a window closes and reopens', () => {
    let state = createInitialWorkspaceState();
    state = reduceWorkspace(state, { type: 'open', id: 'builds' });
    state = reduceWorkspace(state, {
      type: 'move',
      id: 'builds',
      position: { x: 12, y: 34 },
    });
    state = reduceWorkspace(state, {
      type: 'resize',
      id: 'builds',
      size: { width: 720, height: 520 },
    });
    state = reduceWorkspace(state, { type: 'toggle-maximize', id: 'builds' });
    state = reduceWorkspace(state, { type: 'close', id: 'builds' });

    expect(state.builds.position).toEqual({ x: 12, y: 34 });
    expect(state.builds.size).toEqual({ width: 720, height: 520 });
    expect(state.builds.isMaximized).toBe(false);
    expect(state.builds.isMinimized).toBe(false);
  });

  it('fits restored layouts without overwriting the preferred geometry', () => {
    const state = createInitialWorkspaceState({
      start: {
        position: { x: 1_800, y: 900 },
        size: { width: 1_600, height: 1_200 },
      },
    });

    const fitted = fitWorkspaceToBounds(state, { width: 1_280, height: 720 });

    expect(fitted.start.position.x).toBeGreaterThanOrEqual(12);
    expect(fitted.start.position.y).toBeGreaterThanOrEqual(12);
    expect(fitted.start.position.x + fitted.start.size.width).toBeLessThanOrEqual(1_280);
    expect(fitted.start.position.y + fitted.start.size.height).toBeLessThanOrEqual(596);
    expect(state.start.position).toEqual({ x: 1_800, y: 900 });
    expect(state.start.size).toEqual({ width: 1_600, height: 1_200 });

    const roomy = fitWorkspaceToBounds(state, { width: 4_000, height: 2_500 });
    expect(roomy.start.position).toEqual(state.start.position);
    expect(roomy.start.size).toEqual(state.start.size);
  });

  it('keeps exactly one record per registered app after repeated transitions', () => {
    let state = createInitialWorkspaceState();
    for (let iteration = 0; iteration < 1_000; iteration += 1) {
      const id = DESKTOP_APPS[iteration % DESKTOP_APPS.length]!.id;
      state = reduceWorkspace(state, { type: 'open', id });
    }

    expect(Object.keys(state).sort()).toEqual([...DESKTOP_APPS.map((app) => app.id)].sort());
    expect(Math.max(...Object.values(state).map((window) => window.zIndex))).toBeLessThan(910);
  });
});
