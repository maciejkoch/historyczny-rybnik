import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PortalMenu } from '../portal-menu/portal-menu';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'header[appPortalHeader]',
  imports: [RouterLink, PortalMenu],
  templateUrl: './portal-header.html',
  styleUrl: './portal-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalHeader {}
