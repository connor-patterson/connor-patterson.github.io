import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';

import type { ThemeMode, ThemePreferences } from './portfolio.models';

const STORAGE_KEY = 'patteros.preferences.v3';
const LEGACY_STORAGE_KEY = 'patteros.preferences.v2';

const DEFAULT_PREFERENCES: ThemePreferences = {
  theme: 'day',
  crtIntensity: 100,
  motion: true,
  readingMode: false,
};

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly document = inject(DOCUMENT);
  private readonly prefersReducedMotion =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  readonly theme = signal<ThemeMode>(DEFAULT_PREFERENCES.theme);
  readonly crtIntensity = signal(DEFAULT_PREFERENCES.crtIntensity);
  readonly motion = signal(!this.prefersReducedMotion);
  readonly readingMode = signal(DEFAULT_PREFERENCES.readingMode);

  constructor() {
    this.readStoredPreferences();

    effect(() => {
      const preferences: ThemePreferences = {
        theme: this.theme(),
        crtIntensity: this.crtIntensity(),
        motion: this.motion(),
        readingMode: this.readingMode(),
      };

      this.document.documentElement.dataset['theme'] = preferences.theme;
      const crtStrength = preferences.crtIntensity / 100;
      this.document.body.classList.toggle('crt-screen', preferences.crtIntensity > 0);
      this.document.documentElement.style.setProperty('--crt-strength', `${crtStrength}`);
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

  setCrtIntensity(intensity: number): void {
    this.crtIntensity.set(Math.min(100, Math.max(0, Math.round(intensity))));
  }

  setMotion(enabled: boolean): void {
    this.motion.set(enabled);
  }

  setReadingMode(enabled: boolean): void {
    this.readingMode.set(enabled);
  }

  reset(): void {
    this.theme.set(DEFAULT_PREFERENCES.theme);
    this.crtIntensity.set(DEFAULT_PREFERENCES.crtIntensity);
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
      const currentStored = localStorage.getItem(STORAGE_KEY);
      const stored = currentStored ?? localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored) as Partial<ThemePreferences>;
      if (parsed.theme === 'day' || parsed.theme === 'night' || parsed.theme === 'contrast') {
        this.theme.set(parsed.theme);
      }
      if (currentStored && typeof parsed.crtIntensity === 'number') {
        this.setCrtIntensity(parsed.crtIntensity);
      }
      if (typeof parsed.motion === 'boolean' && !this.prefersReducedMotion) {
        this.motion.set(parsed.motion);
      }
      if (typeof parsed.readingMode === 'boolean') {
        this.readingMode.set(parsed.readingMode);
      }
    } catch {
      // Invalid or unavailable local preferences should never block the portfolio.
    }
  }
}
