import { Consent } from '../../privacy/consent';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mobile-navigation',
  imports: [RouterLink],
  templateUrl: './mobile-navigation.html',
  styleUrl: './mobile-navigation.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileNavigation {
  readonly consent = inject(Consent);
  readonly view = input<'map' | 'search' | 'place' | 'privacy' | 'about'>('map');
  readonly query = input('');
}
