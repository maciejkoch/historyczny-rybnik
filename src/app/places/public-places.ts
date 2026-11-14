import { Injectable, REQUEST_CONTEXT, TransferState, inject, makeStateKey, signal } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { publicPlaceSchema, publicSummarySchema } from '../../../functions/src/contracts/places.mjs';
import { z } from 'zod';
import type { Place, PlaceSummary } from './place';

type RenderContext = { place?: Place };

@Injectable({ providedIn: 'root' })
export class PublicPlaces {
  private readonly context = inject(REQUEST_CONTEXT, { optional: true }) as RenderContext | null;
  private readonly transfer = inject(TransferState);
  readonly summaries = signal<readonly PlaceSummary[]>([]);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  readonly detailStatus = signal<'ready' | 'missing' | 'error'>('ready');

  async load(): Promise<void> {
    this.status.set('loading');
    try {
      const response = await fetch('/api/public-places', { cache: 'no-store' });
      if (!response.ok) throw new Error('Catalogue unavailable');
      this.summaries.set(z.array(publicSummarySchema).max(1000).parse(await response.json()));
      this.status.set('ready');
    } catch {
      this.status.set('error');
    }
  }

  async detail(slug: string): Promise<Place | null> {
    this.detailStatus.set('ready');
    const key = makeStateKey<Place | null>('place:' + slug);
    if (this.context?.place?.slug === slug || this.context?.place?.previousSlugs.includes(slug)) {
      const place = publicPlaceSchema.parse(this.context.place);
      this.transfer.set(key, place);
      return place;
    }
    if (this.transfer.hasKey(key)) {
      const place = this.transfer.get(key, null);
      this.transfer.remove(key);
      return place ? publicPlaceSchema.parse(place) : null;
    }
    try {
      const response = await fetch('/api/public-places/' + encodeURIComponent(slug), { cache: 'no-store' });
      if (response.status === 404) {
        this.detailStatus.set('missing');
        return null;
      }
      if (!response.ok) throw new Error('Place unavailable');
      return publicPlaceSchema.parse(await response.json());
    } catch {
      this.detailStatus.set('error');
      return null;
    }
  }
}

export const placeResolver: ResolveFn<Place | null> = (route) =>
  inject(PublicPlaces).detail(route.paramMap.get('slug') ?? '');
