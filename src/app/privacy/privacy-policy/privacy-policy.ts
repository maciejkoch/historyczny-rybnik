import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PortalHeader } from '../../layout/portal-header/portal-header';
import { MobileNavigation } from '../../layout/mobile-navigation/mobile-navigation';
@Component({
  selector: 'app-privacy-policy',
  imports: [PortalHeader, MobileNavigation],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicy {}
