import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-mobile-navigation',
  templateUrl: './mobile-navigation.html',
  styleUrl: './mobile-navigation.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileNavigation {
  readonly view = input<'search' | 'details'>('search');
  readonly hasPlace = input(false);
  readonly searchRequested = output<void>();
  readonly mapRequested = output<void>();
  readonly detailsRequested = output<void>();
}
