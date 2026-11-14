import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Place } from '../places/place';
import { markerCategory, markerIcon } from '../atlas-map/place-markers';

@Component({
  selector: 'app-place-search-panel',
  templateUrl: './place-search-panel.html',
  styleUrl: './panel-content.css',
  host: { '[class.mobile-page]': 'mobilePage()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceSearchPanel {
  readonly markerCategory = markerCategory;
  readonly markerIcon = markerIcon;
  readonly tags = input<readonly { id: string; name: string }[]>([]);
  readonly selectedTag = input('');
  readonly tagChanged = output<string>();
  readonly mobilePage = input(false);
  readonly query = input('');
  readonly withoutLocation = input(false);
  readonly withoutLocationChanged = output<boolean>();
  readonly results = input<readonly Place[]>([]);
  readonly selectedId = input<string>();
  readonly queryChanged = output<string>();
  readonly placeSelected = output<Place>();

  tagNames(place: Place): string {
    return place.tags.map((tag) => tag.name).join(' · ');
  }

  historicalAddress(place: Place): string | undefined {
    return place.addresses.find((address) => address.type === 'historical')?.text;
  }

  choose(event: MouseEvent, place: Place): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    this.placeSelected.emit(place);
  }
}
