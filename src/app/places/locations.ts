import { Consent } from '../privacy/consent';
import { inject, Injectable, signal } from '@angular/core';
import { PLACES } from './catalog.generated';
import { LocationDto } from './place';
import { FIREBASE_DEV } from './runtime-config';
@Injectable({ providedIn: 'root' })
export class Locations {
  private readonly consent = inject(Consent);
  readonly current = signal<readonly LocationDto[]>([]);
  readonly status = signal<'loading' | 'ready' | 'error' | 'disabled'>('loading');
  private reader?: Promise<() => Promise<readonly LocationDto[]>>;
  private async initialize(): Promise<() => Promise<readonly LocationDto[]>> {
    const [
      { initializeApp, getApps },
      { initializeAppCheck, ReCaptchaEnterpriseProvider },
      { getFunctions, httpsCallable },
      { parseReadResponse, readRequestSchema },
    ] = await Promise.all([
      import('firebase/app'),
      import('firebase/app-check'),
      import('firebase/functions'),
      import('../../../functions/src/contracts/places.mjs'),
    ]);
    const app = getApps()[0] ?? initializeApp(FIREBASE_DEV.firebase);
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(FIREBASE_DEV.appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
    const read = httpsCallable<{ ids: string[] }, unknown>(
      getFunctions(app, 'europe-central2'),
      'placesDevRead',
    );
    return async () => {
      const request = readRequestSchema.parse({ ids: PLACES.map((p) => p.id) });
      return parseReadResponse((await read(request)).data, request.ids).places;
    };
  }
  async refresh(): Promise<void> {
    if (!this.consent.google()) {
      this.status.set('disabled');
      return;
    }
    this.status.set('loading');
    try {
      this.reader ??= this.initialize();
      const read = await this.reader;
      this.current.set(await read());
      this.status.set('ready');
    } catch {
      this.status.set('error');
    }
  }
}
