import { Account } from '../../places/account';
import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'header[appPortalHeader]',
  imports: [RouterLink],
  templateUrl: './portal-header.html',
  styleUrl: './portal-header.css',
  host: { '[class.compact]': 'compact()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalHeader {
  readonly account = inject(Account);
  readonly compact = input(false);
}
