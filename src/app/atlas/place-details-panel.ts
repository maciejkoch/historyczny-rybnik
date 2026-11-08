import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PartialDate, Place } from '../places/place';
import { FIREBASE_DEV } from '../places/runtime-config';

@Component({
  selector: 'app-place-details-panel',
  templateUrl: './place-details-panel.html',
  styleUrls: ['./panel-content.css', './place-details-panel.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceDetailsPanel {
  readonly place = input<Place | null>(null);
  readonly imageOpened = output<{ url: string; alt: string }>();

  verifiedMentions() {
    return (this.place()?.mentions || []).filter((m) => m.verification === 'verified');
  }
  draftMentions() {
    return (this.place()?.mentions || []).filter((m) => m.verification !== 'verified');
  }

  documentedDates() {
    const dates = new Map<string, PartialDate>();
    for (const mention of this.place()?.mentions || [])
      if (mention.verification === 'verified' && mention.documentedDate)
        dates.set(JSON.stringify(mention.documentedDate), mention.documentedDate);
    return [...dates.values()].sort((a, b) => a.from.localeCompare(b.from));
  }

  date(value: PartialDate | null): string {
    return value
      ? `${value.approximate ? 'około ' : ''}${value.from}${value.to ? ' – ' + value.to : ''}`
      : 'Data nieustalona';
  }

  imageUrl(path: string): string {
    return FIREBASE_DEV
      ? `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_DEV.storageBucket}/o/${encodeURIComponent(path)}?alt=media`
      : '';
  }
}
