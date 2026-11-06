import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ConsentBanner } from './privacy/consent-banner/consent-banner';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConsentBanner],
  template: '<router-outlet /><app-consent-banner />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
