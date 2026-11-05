import { Injectable, signal } from '@angular/core';
import { PLACES } from './catalog.generated';
import { LocationDto } from './place';
import { FIREBASE_DEV } from './runtime-config';
@Injectable({ providedIn: 'root' })
export class Locations {
  readonly current = signal<readonly LocationDto[]>([]);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  private reader?: Promise<() => Promise<readonly LocationDto[]>>;
  private async initialize(): Promise<() => Promise<readonly LocationDto[]>> {
    const [
      { initializeApp, getApps },
      { initializeAppCheck, ReCaptchaEnterpriseProvider },
      { getFunctions, httpsCallable },
    ] = await Promise.all([
      import('firebase/app'),
      import('firebase/app-check'),
      import('firebase/functions'),
    ]);
    const app = getApps()[0] ?? initializeApp(FIREBASE_DEV.firebase);
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(FIREBASE_DEV.appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
    const read = httpsCallable<{ ids: string[] }, { places: LocationDto[] }>(
      getFunctions(app, 'europe-central2'),
      'placesDevRead',
    );
    return async () => (await read({ ids: PLACES.map((p) => p.id) })).data.places;
  }
  async refresh(): Promise<void> {
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
