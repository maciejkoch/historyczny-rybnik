import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Consent } from '../../privacy/consent';
@Component({
  selector: 'footer[appPortalFooter]',
  imports: [RouterLink],
  templateUrl: './portal-footer.html',
  styleUrl: './portal-footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalFooter {
  readonly consent = inject(Consent);
}
