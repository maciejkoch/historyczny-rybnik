import { Account } from '../../places/account';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PortalMenuState } from '../portal-menu/portal-menu-state';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'header[appPortalHeader]',
  imports: [RouterLink],
  templateUrl: './portal-header.html',
  styleUrl: './portal-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalHeader {
  readonly account = inject(Account);
  readonly menu = inject(PortalMenuState);
}
