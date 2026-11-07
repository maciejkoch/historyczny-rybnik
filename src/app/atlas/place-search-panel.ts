import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Place } from '../places/place';

@Component({
  selector: 'app-place-search-panel',
  templateUrl: './place-search-panel.html',
  styleUrl: './panel-content.css',
  host: { '[class.mobile-page]': 'mobilePage()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceSearchPanel {
  readonly mobilePage = input(false);
  readonly query = input('');
  readonly withoutLocation = input(false);
  readonly withoutLocationChanged = output<boolean>();
  readonly results = input<readonly Place[]>([]);
  readonly selectedId = input<string>();
  readonly queryChanged = output<string>();
  readonly placeSelected = output<Place>();

  choose(event: MouseEvent, place: Place): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    this.placeSelected.emit(place);
  }
}
