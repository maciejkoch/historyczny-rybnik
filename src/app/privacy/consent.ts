import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  computed,
  DestroyRef,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';

const KEY = 'historyczny-rybnik.consent.v1';
const PREFERENCES = [
  'historyczny-rybnik.panel.v1',
  'historyczny-rybnik.details-panel.v1',
  'historyczny-rybnik.layers.v1',
];
const MAX_AGE = 180 * 24 * 60 * 60 * 1000;
interface Decision {
  version: 1;
  preferences: boolean;
  google: boolean;
  savedAt: number;
}

@Injectable({ providedIn: 'root' })
export class Consent {
  private readonly window = isPlatformBrowser(inject(PLATFORM_ID))
    ? inject(DOCUMENT).defaultView
    : null;
  private readonly decision = signal<Decision | null>(null);
  readonly ready = signal(false);
  readonly decided = computed(() => this.decision() !== null);
  readonly preferences = computed(() => this.decision()?.preferences === true);
  readonly google = computed(() => this.decision()?.google === true);
  readonly storageFailed = signal(false);
  readonly settingsRequested = signal(0);

  constructor() {
    this.decision.set(this.read());
    // A URL override also stops Google if persistent storage becomes unavailable at withdrawal.
    if (this.window) {
      const url = new URL(this.window.location.href);
      if (url.searchParams.get('privacy') === 'google-off') {
        const decision: Decision = {
          version: 1,
          preferences: this.preferences(),
          google: false,
          savedAt: Date.now(),
        };
        this.decision.set(decision);
        try {
          this.window.localStorage.setItem(KEY, JSON.stringify(decision));
        } catch {
          this.storageFailed.set(true);
        }
        url.searchParams.delete('privacy');
        this.window.history.replaceState(this.window.history.state, '', url);
      }
      if (!this.preferences()) this.clearPreferences();
    }
    afterNextRender(() => this.ready.set(true));
    const changed = (event: StorageEvent) => {
      if (event.key === KEY || event.key === null) this.window?.location.reload();
    };
    this.window?.addEventListener('storage', changed);
    inject(DestroyRef).onDestroy(() => this.window?.removeEventListener('storage', changed));
  }

  openSettings(): void {
    this.settingsRequested.update((value) => value + 1);
  }

  save(preferences: boolean, google: boolean): void {
    const withdrawGoogle = this.google() && !google;
    const decision: Decision = { version: 1, preferences, google, savedAt: Date.now() };
    this.decision.set(decision);
    this.storageFailed.set(false);
    try {
      this.window?.localStorage.setItem(KEY, JSON.stringify(decision));
    } catch {
      this.storageFailed.set(true);
    }
    if (!preferences) this.clearPreferences();
    // Unload reCAPTCHA and Firebase's token refresh, including in-flight initialization.
    if (withdrawGoogle && this.window) {
      const url = new URL(this.window.location.href);
      url.searchParams.set('privacy', 'google-off');
      this.window.location.replace(url.href);
    }
  }

  readPreference(key: string): string | null {
    if (!this.preferences() || !PREFERENCES.includes(key)) return null;
    try {
      return this.window?.localStorage.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  writePreference(key: string, value: string): void {
    if (!this.preferences() || !PREFERENCES.includes(key)) return;
    try {
      this.window?.localStorage.setItem(key, value);
    } catch {
      /* Session controls remain usable. */
    }
  }

  private clearPreferences(): void {
    for (const key of PREFERENCES) {
      try {
        this.window?.localStorage.removeItem(key);
      } catch {
        /* Storage may be blocked. */
      }
    }
  }

  private read(): Decision | null {
    try {
      const value = JSON.parse(this.window?.localStorage.getItem(KEY) ?? 'null');
      if (
        value?.version === 1 &&
        typeof value.preferences === 'boolean' &&
        typeof value.google === 'boolean' &&
        typeof value.savedAt === 'number' &&
        value.savedAt <= Date.now() &&
        Date.now() - value.savedAt < MAX_AGE
      )
        return value;
    } catch {
      /* Invalid, expired or inaccessible storage means no optional consent. */
    }
    return null;
  }
}
