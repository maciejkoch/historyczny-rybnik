import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PortalMenu } from '../portal-menu/portal-menu';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'header[appPortalHeader]',
  imports: [RouterLink, PortalMenu],
  templateUrl: './portal-header.html',
  styleUrl: './portal-header.css',
  host: { '[class.compact]': 'compact()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalHeader {
  readonly compact = input(false);
}
