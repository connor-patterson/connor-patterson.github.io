export type AppId =
  | 'start'
  | 'impact'
  | 'builds'
  | 'systems'
  | 'github'
  | 'arcade'
  | 'profile'
  | 'resume'
  | 'contact'
  | 'settings';

export type AppKind = 'system' | 'work' | 'project' | 'arcade' | 'utility';

export type AppIconName = AppId | 'patter';

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface WindowSize {
  readonly width: number;
  readonly height: number;
}

export interface DesktopAppDefinition {
  readonly id: AppId;
  readonly route: string;
  readonly label: string;
  readonly shortcutLabel: string;
  readonly taskbarLabel: string;
  readonly description: string;
  readonly icon: AppIconName;
  readonly kind: AppKind;
  readonly defaultPosition: Point;
  readonly defaultSize: WindowSize;
  readonly initiallyOpen?: boolean;
  readonly desktopShortcut?: boolean;
}

export interface DesktopWindowState {
  readonly id: AppId;
  readonly isOpen: boolean;
  readonly isMinimized: boolean;
  readonly isMaximized: boolean;
  readonly zIndex: number;
  readonly position: Point;
  readonly size: WindowSize;
}

export type ThemeMode = 'day' | 'night' | 'contrast';

export interface ThemePreferences {
  readonly theme: ThemeMode;
  readonly scanlines: boolean;
  readonly motion: boolean;
  readonly readingMode: boolean;
}

export interface Metric {
  readonly value: string;
  readonly label: string;
  readonly detail: string;
}

export interface CapabilityGroup {
  readonly title: string;
  readonly items: readonly string[];
}

export interface CaseStudy {
  readonly id: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly challenge: string;
  readonly approach: readonly string[];
  readonly results: readonly Metric[];
  readonly role: string;
  readonly stack: readonly string[];
}

export interface ProjectCard {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly status: string;
  readonly description: string;
  readonly proof: readonly string[];
  readonly stack: readonly string[];
  readonly accent: 'orange' | 'green' | 'violet';
  readonly primaryAction?: {
    readonly label: string;
    readonly href?: string;
    readonly appId?: AppId;
  };
}

export interface ArcadeCartridge {
  readonly id: 'snake' | 'memory-match' | 'tic-tac-toe' | 'minesweeper';
  readonly title: string;
  readonly shortTitle: string;
  readonly description: string;
  readonly skills: readonly string[];
  readonly color: 'orange' | 'green' | 'blue' | 'violet';
}
