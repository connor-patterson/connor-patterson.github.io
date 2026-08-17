import {
  APP_BY_ID,
  APP_ID_BY_ROUTE,
  APP_IDS,
  ARCADE_CARTRIDGES,
  DESKTOP_APPS,
} from './app.registry';

describe('application registry', () => {
  it('is the unique source of truth for app identifiers and routes', () => {
    expect(new Set(APP_IDS).size).toBe(DESKTOP_APPS.length);
    expect(new Set(DESKTOP_APPS.map((app) => app.route)).size).toBe(DESKTOP_APPS.length);

    for (const app of DESKTOP_APPS) {
      expect(APP_BY_ID[app.id]).toBe(app);
      expect(APP_ID_BY_ROUTE.get(app.route)).toBe(app.id);
    }
  });

  it('has one useful default and a description for every app', () => {
    expect(DESKTOP_APPS.filter((app) => app.initiallyOpen).map((app) => app.id)).toEqual(['start']);
    expect(DESKTOP_APPS.every((app) => app.label && app.description)).toBe(true);
  });

  it('assigns every application its own icon', () => {
    expect(new Set(DESKTOP_APPS.map((app) => app.icon)).size).toBe(DESKTOP_APPS.length);
  });

  it('makes every useful application easy to find on the desktop', () => {
    expect(DESKTOP_APPS.filter((app) => app.desktopShortcut).map((app) => app.id)).toEqual([
      'start',
      'impact',
      'builds',
      'systems',
      'github',
      'arcade',
      'profile',
      'resume',
      'contact',
      'settings',
    ]);
  });

  it('keeps the arcade choices familiar and plainly named', () => {
    expect(ARCADE_CARTRIDGES.map((game) => game.title)).toEqual([
      'Snake',
      'Memory Match',
      'Tic Tac Toe',
      'Minesweeper',
    ]);
    expect(ARCADE_CARTRIDGES.every((game) => game.description.length < 70)).toBe(true);
  });
});
