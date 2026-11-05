import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mobile-navigation',
  imports: [RouterLink],
  templateUrl: './mobile-navigation.html',
  styleUrl: './mobile-navigation.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileNavigation {
  readonly view = input<'map' | 'search' | 'place'>('map');
  readonly query = input('');
}
