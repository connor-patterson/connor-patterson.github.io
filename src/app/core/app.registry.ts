import type { AppId, ArcadeCartridge, DesktopAppDefinition } from './portfolio.models';

export const DESKTOP_APPS = [
  {
    id: 'start',
    route: 'start',
    label: 'Start Here',
    shortcutLabel: 'Start Here',
    taskbarLabel: 'Start',
    description: 'A quick hello and the useful bits.',
    icon: 'start',
    kind: 'system',
    defaultPosition: { x: 300, y: 36 },
    defaultSize: { width: 840, height: 720 },
    initiallyOpen: true,
    desktopShortcut: true,
  },
  {
    id: 'impact',
    route: 'impact',
    label: 'Work Log',
    shortcutLabel: 'Work Log',
    taskbarLabel: 'Work',
    description: 'Production fixes and what changed.',
    icon: 'impact',
    kind: 'work',
    defaultPosition: { x: 330, y: 28 },
    defaultSize: { width: 900, height: 690 },
    initiallyOpen: false,
    desktopShortcut: true,
  },
  {
    id: 'builds',
    route: 'builds',
    label: 'Builds',
    shortcutLabel: 'Builds',
    taskbarLabel: 'Builds',
    description: 'Isotara and PredictChain, up close.',
    icon: 'builds',
    kind: 'project',
    defaultPosition: { x: 320, y: 54 },
    defaultSize: { width: 880, height: 650 },
    initiallyOpen: false,
    desktopShortcut: true,
  },
  {
    id: 'arcade',
    route: 'arcade',
    label: 'PatterOS Arcade',
    shortcutLabel: 'PatterOS Arcade',
    taskbarLabel: 'Arcade',
    description: 'Take a break. Chase a high score.',
    icon: 'arcade',
    kind: 'arcade',
    defaultPosition: { x: 350, y: 40 },
    defaultSize: { width: 860, height: 660 },
    initiallyOpen: false,
    desktopShortcut: true,
  },
  {
    id: 'profile',
    route: 'profile',
    label: 'About Connor',
    shortcutLabel: 'About Connor',
    taskbarLabel: 'Profile',
    description: 'Tools I use and how I like to work.',
    icon: 'profile',
    kind: 'system',
    defaultPosition: { x: 340, y: 62 },
    defaultSize: { width: 820, height: 640 },
    initiallyOpen: false,
    desktopShortcut: true,
  },
  {
    id: 'resume',
    route: 'resume',
    label: 'Résumé',
    shortcutLabel: 'Résumé 2026',
    taskbarLabel: 'Résumé',
    description: 'One page. Easy to skim. Ready to print.',
    icon: 'resume',
    kind: 'work',
    defaultPosition: { x: 390, y: 38 },
    defaultSize: { width: 760, height: 660 },
    initiallyOpen: false,
    desktopShortcut: true,
  },
  {
    id: 'contact',
    route: 'contact',
    label: 'Say Hello',
    shortcutLabel: 'Say Hello',
    taskbarLabel: 'Contact',
    description: 'Come say hi on email, LinkedIn, or GitHub.',
    icon: 'contact',
    kind: 'utility',
    defaultPosition: { x: 410, y: 90 },
    defaultSize: { width: 650, height: 470 },
    initiallyOpen: false,
    desktopShortcut: true,
  },
  {
    id: 'settings',
    route: 'settings',
    label: 'Desktop Settings',
    shortcutLabel: 'Settings',
    taskbarLabel: 'Settings',
    description: 'Colors, motion, type, and a fresh start button.',
    icon: 'settings',
    kind: 'utility',
    defaultPosition: { x: 430, y: 110 },
    defaultSize: { width: 620, height: 600 },
    initiallyOpen: false,
    desktopShortcut: true,
  },
] as const satisfies readonly DesktopAppDefinition[];

export const APP_IDS = DESKTOP_APPS.map((app) => app.id);

export const APP_BY_ID: Readonly<Record<AppId, DesktopAppDefinition>> = Object.freeze(
  Object.fromEntries(DESKTOP_APPS.map((app) => [app.id, app])) as Record<
    AppId,
    DesktopAppDefinition
  >,
);

export const APP_ID_BY_ROUTE = new Map(DESKTOP_APPS.map((app) => [app.route, app.id] as const));

export const ARCADE_CARTRIDGES = [
  {
    id: 'snake',
    title: 'Snake',
    shortTitle: 'SNAKE',
    description: 'Eat apples, grow longer, and stay out of your own way.',
    skills: ['arrow keys', 'touch', 'high score'],
    color: 'orange',
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    shortTitle: 'MEMORY MATCH',
    description: 'Flip the cards and find all six matching pairs.',
    skills: ['one click', 'touch', 'best turns'],
    color: 'green',
  },
] as const satisfies readonly ArcadeCartridge[];

export function isAppId(value: string | null | undefined): value is AppId {
  return typeof value === 'string' && APP_IDS.some((id) => id === value);
}
