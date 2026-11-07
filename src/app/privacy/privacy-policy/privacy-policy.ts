import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PortalHeader } from '../../layout/portal-header/portal-header';
import { PortalFooter } from '../../layout/portal-footer/portal-footer';
import { MobileNavigation } from '../../layout/mobile-navigation/mobile-navigation';
@Component({
  selector: 'app-privacy-policy',
  imports: [PortalHeader, PortalFooter, MobileNavigation],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicy {}
