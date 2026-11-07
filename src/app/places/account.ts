import { afterNextRender, effect, inject, Injectable, Injector, signal } from '@angular/core';
import type { User } from 'firebase/auth';
import { Consent } from '../privacy/consent';
import { FIREBASE_DEV } from './runtime-config';

@Injectable({ providedIn: 'root' })
export class Account {
  readonly consent = inject(Consent);
  readonly user = signal<User | null>(null);
  readonly admin = signal(false);
  readonly busy = signal(false);
  readonly message = signal('');
  private client?: Promise<import('firebase/auth').Auth>;
  constructor() {
    const injector = inject(Injector);
    afterNextRender(() =>
      effect(
        () => {
          if (this.consent.google())
            void this.initialize().catch(() =>
              this.message.set('Logowanie jest niedostępne. Spróbuj ponownie.'),
            );
        },
        { injector },
      ),
    );
  }
  private initialize() {
    return (this.client ??= (async () => {
      const [{ getApps, initializeApp }, { getAuth, onIdTokenChanged }] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
      ]);
      const auth = getAuth(getApps()[0] ?? initializeApp(FIREBASE_DEV.firebase));
      auth.languageCode = 'pl';
      onIdTokenChanged(auth, async (user) => {
        this.admin.set(false);
        this.user.set(user);
        if (user) {
          try {
            const token = await user.getIdTokenResult();
            if (auth.currentUser === user) this.admin.set(token.claims['admin'] === true);
          } catch {
            this.admin.set(false);
          }
        }
      });
      await auth.authStateReady();
      return auth;
    })().catch((error) => {
      this.client = undefined;
      throw error;
    }));
  }
  async toggle(): Promise<void> {
    if (this.busy()) return;
    if (!this.consent.google()) {
      this.message.set('Aby się zalogować, włącz usługi Google w ustawieniach prywatności.');
      this.consent.openSettings();
      return;
    }
    this.busy.set(true);
    this.message.set('');
    try {
      const auth = await this.initialize();
      const { signOut, signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      if (auth.currentUser) await signOut(auth);
      else await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request')
        this.message.set(
          code === 'auth/popup-blocked'
            ? 'Zezwól na okno logowania i spróbuj ponownie.'
            : 'Nie udało się zalogować. Spróbuj ponownie.',
        );
    } finally {
      this.busy.set(false);
    }
  }
}
