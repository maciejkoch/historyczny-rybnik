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
