import { Injectable } from '@angular/core';
import { z } from 'zod';
import { creatorListResponseSchema, draftResponseSchema } from '../../../functions/src/contracts/creator.mjs';
import { FIREBASE_DEV } from '../places/runtime-config';
import { isLocalCreator } from './creator-local';

export type CreatorItem = z.infer<typeof creatorListResponseSchema>['places'][number];
export type CreatorDraft = z.infer<typeof draftResponseSchema>;
@Injectable({ providedIn: 'root' })
export class Creator {
  readonly local = isLocalCreator();
  private async call(name: string, data: object): Promise<unknown> {
    if (this.local) {
      const response = await fetch(`http://127.0.0.1:5002/historyczny-rybnik/europe-central2/${name}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }),
      });
      if (!response.ok) throw new Error('Creator request failed');
      return (await response.json()).result;
    }
    const [{ getApps, initializeApp }, { getFunctions, httpsCallable }, { initializeAppCheck, ReCaptchaEnterpriseProvider }] = await Promise.all([
      import('firebase/app'), import('firebase/functions'), import('firebase/app-check'),
    ]);
    const app = getApps()[0] ?? initializeApp(FIREBASE_DEV.firebase);
    initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(FIREBASE_DEV.appCheckSiteKey), isTokenAutoRefreshEnabled: true });
    return (await httpsCallable(getFunctions(app, 'europe-central2'), name)(data)).data;
  }
  async list(): Promise<CreatorItem[]> { return creatorListResponseSchema.parse(await this.call('placesDevCreatorList', {})).places; }
  async create(): Promise<CreatorDraft> { return draftResponseSchema.parse(await this.call('placesDevCreatorCreate', {})); }
  async open(id: string): Promise<CreatorDraft> { return draftResponseSchema.parse(await this.call('placesDevCreatorOpen', { id })); }
  async remove(id: string): Promise<void> { z.strictObject({ ok: z.literal(true) }).parse(await this.call('placesDevCreatorDelete', { id })); }
}
