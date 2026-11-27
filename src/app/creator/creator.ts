import { Injectable } from '@angular/core';
import { z } from 'zod';
import {
  creatorListResponseSchema,
  draftResponseSchema,
  draftMaterialSchema,
} from '../../../functions/src/contracts/creator.mjs';
import { FIREBASE_DEV } from '../places/runtime-config';

export type CreatorItem = z.infer<typeof creatorListResponseSchema>['places'][number];
export type CreatorDraft = z.infer<typeof draftResponseSchema>;
@Injectable({ providedIn: 'root' })
export class Creator {
  private readonly local =
    typeof window !== 'undefined' &&
    window.location.hostname === 'localhost' &&
    ['4200', '4300'].includes(window.location.port);
  private async call(name: string, data: object): Promise<unknown> {
    if (this.local) {
      const [{ getApp }, { getAuth }] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
      ]);
      const user = getAuth(getApp()).currentUser;
      if (!user) throw new Error('Authentication required');
      const token = await user.getIdToken();
      const response = await fetch(
        `http://127.0.0.1:5002/historyczny-rybnik/europe-central2/${name}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ data }),
        },
      );
      if (!response.ok) throw new Error('Creator request failed');
      return (await response.json()).result;
    }
    const [
      { getApps, initializeApp },
      { getFunctions, httpsCallable },
      { initializeAppCheck, ReCaptchaEnterpriseProvider },
    ] = await Promise.all([
      import('firebase/app'),
      import('firebase/functions'),
      import('firebase/app-check'),
    ]);
    const app = getApps()[0] ?? initializeApp(FIREBASE_DEV.firebase);
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(FIREBASE_DEV.appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
    return (await httpsCallable(getFunctions(app, 'europe-central2'), name)(data)).data;
  }
  async list(): Promise<CreatorItem[]> {
    return creatorListResponseSchema.parse(await this.call('placesDevCreatorList', {})).places;
  }
  async create(): Promise<CreatorDraft> {
    return draftResponseSchema.parse(await this.call('placesDevCreatorCreate', {}));
  }
  async open(id: string): Promise<CreatorDraft> {
    return draftResponseSchema.parse(await this.call('placesDevCreatorOpen', { id }));
  }
  async save(id: string, data: CreatorDraft['data']): Promise<void> {
    z.strictObject({ ok: z.literal(true) }).parse(
      await this.call('placesDevCreatorSave', { id, data }),
    );
  }
  async remove(id: string): Promise<void> {
    z.strictObject({ ok: z.literal(true) }).parse(
      await this.call('placesDevCreatorDelete', { id }),
    );
  }
  async validatePublication(id: string, data: CreatorDraft['data']) {
    return z
      .strictObject({
        ok: z.boolean(),
        issues: z.array(z.strictObject({ path: z.array(z.string()), code: z.string() })),
      })
      .parse(await this.call('placesDevCreatorValidate', { id, data }));
  }
  async publish(id: string, data: CreatorDraft['data']) {
    return z
      .strictObject({
        ok: z.boolean(),
        issues: z.array(z.strictObject({ path: z.array(z.string()), code: z.string() })),
      })
      .parse(await this.call('placesDevCreatorPublish', { id, data }));
  }
  async restore(id: string): Promise<void> {
    z.strictObject({ ok: z.literal(true) }).parse(
      await this.call('placesDevCreatorRestore', { id }),
    );
  }
  async unpublish(id: string): Promise<void> {
    z.strictObject({ ok: z.literal(true) }).parse(
      await this.call('placesDevCreatorUnpublish', { id }),
    );
  }
  async upload(id: string, file: File): Promise<z.infer<typeof draftMaterialSchema>> {
    if (file.size > 8 * 1024 * 1024) throw new Error('Plik jest za duży');
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += 32768)
      binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
    return draftMaterialSchema.parse(
      await this.call('placesDevCreatorUpload', { id, content: btoa(binary) }),
    );
  }
}
