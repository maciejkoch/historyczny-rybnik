import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ConsentBanner } from './privacy/consent-banner/consent-banner';
import { RouterOutlet } from '@angular/router';
import { PortalMenu } from './layout/portal-menu/portal-menu';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConsentBanner, PortalMenu],
  template: '<app-portal-menu><router-outlet /><app-consent-banner /></app-portal-menu>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
