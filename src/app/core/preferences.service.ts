import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';

import type { ThemeMode, ThemePreferences } from './portfolio.models';

const STORAGE_KEY = 'patteros.preferences.v2';
const SCANLINE_DEFAULT_KEY = 'patteros.scanlines-visible.v1';

const DEFAULT_PREFERENCES: ThemePreferences = {
  theme: 'day',
  scanlines: true,
  motion: true,
  readingMode: false,
};

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly document = inject(DOCUMENT);
  private readonly prefersReducedMotion =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  readonly theme = signal<ThemeMode>(DEFAULT_PREFERENCES.theme);
  readonly scanlines = signal(DEFAULT_PREFERENCES.scanlines);
  readonly motion = signal(!this.prefersReducedMotion);
  readonly readingMode = signal(DEFAULT_PREFERENCES.readingMode);

  constructor() {
    this.readStoredPreferences();

    effect(() => {
      const preferences: ThemePreferences = {
        theme: this.theme(),
        scanlines: this.scanlines(),
        motion: this.motion(),
        readingMode: this.readingMode(),
      };

      this.document.documentElement.dataset['theme'] = preferences.theme;
      this.document.body.classList.toggle('scanlines', preferences.scanlines);
      this.document.body.classList.toggle('motion-disabled', !preferences.motion);
      this.document.body.classList.toggle('reading-mode', preferences.readingMode);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      } catch {
        // The site remains fully functional when storage is unavailable.
      }
    });
  }

  setTheme(theme: ThemeMode): void {
    this.theme.set(theme);
  }

  toggleTheme(): void {
    this.theme.update((theme) => (theme === 'day' ? 'night' : 'day'));
  }

  setScanlines(enabled: boolean): void {
    this.scanlines.set(enabled);
  }

  setMotion(enabled: boolean): void {
    this.motion.set(enabled);
  }

  setReadingMode(enabled: boolean): void {
    this.readingMode.set(enabled);
  }

  reset(): void {
    this.theme.set(DEFAULT_PREFERENCES.theme);
    this.scanlines.set(DEFAULT_PREFERENCES.scanlines);
    this.motion.set(!this.prefersReducedMotion);
    this.readingMode.set(DEFAULT_PREFERENCES.readingMode);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage restrictions.
    }
  }

  private readStoredPreferences(): void {
    try {
      const hasVisibleScanlineDefault = localStorage.getItem(SCANLINE_DEFAULT_KEY) === 'true';
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(SCANLINE_DEFAULT_KEY, 'true');
        return;
      }

      const parsed = JSON.parse(stored) as Partial<ThemePreferences>;
      if (parsed.theme === 'day' || parsed.theme === 'night' || parsed.theme === 'contrast') {
        this.theme.set(parsed.theme);
      }
      if (hasVisibleScanlineDefault && typeof parsed.scanlines === 'boolean') {
        this.scanlines.set(parsed.scanlines);
      }
      if (typeof parsed.motion === 'boolean' && !this.prefersReducedMotion) {
        this.motion.set(parsed.motion);
      }
      if (typeof parsed.readingMode === 'boolean') {
        this.readingMode.set(parsed.readingMode);
      }
      localStorage.setItem(SCANLINE_DEFAULT_KEY, 'true');
    } catch {
      // Invalid or unavailable local preferences should never block the portfolio.
    }
  }
}
