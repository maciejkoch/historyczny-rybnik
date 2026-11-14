import { Consent } from '../privacy/consent';
import { inject, Injectable, signal } from '@angular/core';
import { LocationDto } from './place';
import { FIREBASE_DEV } from './runtime-config';
@Injectable({ providedIn: 'root' })
export class Locations {
  private readonly consent = inject(Consent);
  readonly current = signal<readonly LocationDto[]>([]);
  readonly status = signal<'loading' | 'ready' | 'error' | 'disabled'>('loading');
  private reader?: Promise<(ids: readonly string[]) => Promise<readonly LocationDto[]>>;
  private async initialize(): Promise<(ids: readonly string[]) => Promise<readonly LocationDto[]>> {
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
    return async (ids) => {
      const places: LocationDto[] = [];
      for (let offset = 0; offset < ids.length; offset += 100) {
        const request = readRequestSchema.parse({ ids: ids.slice(offset, offset + 100) });
        places.push(...parseReadResponse((await read(request)).data, request.ids).places);
      }
      return places;
    };
  }
  async update(request: import('./place').UpdateLocationRequest): Promise<void> {
    if (!this.consent.google()) throw new Error('Google consent required');
    this.reader ??= this.initialize();
    await this.reader;
    const [{ getFunctions, httpsCallable }, { getApp }, { writeRequestSchema, locationDtoSchema }] =
      await Promise.all([
        import('firebase/functions'),
        import('firebase/app'),
        import('../../../functions/src/contracts/places.mjs'),
      ]);
    const result = await httpsCallable(
      getFunctions(getApp(), 'europe-central2'),
      'placesDevUpdate',
    )(writeRequestSchema.parse(request));
    const saved = locationDtoSchema.parse(result.data);
    this.current.update((values) => [...values.filter((value) => value.id !== saved.id), saved]);
  }
  async refresh(ids: readonly string[]): Promise<void> {
    if (!this.consent.google()) {
      this.status.set('disabled');
      return;
    }
    this.status.set('loading');
    try {
      this.reader ??= this.initialize();
      const read = await this.reader;
      this.current.set(await read(ids));
      this.status.set('ready');
    } catch {
      this.status.set('error');
    }
  }
}
