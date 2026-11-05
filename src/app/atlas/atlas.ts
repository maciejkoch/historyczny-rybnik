import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MapStatus } from '../map-status/map-status';

@Component({
  selector: 'app-atlas',
  imports: [MapStatus],
  templateUrl: './atlas.html',
  styleUrl: './atlas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Atlas {}
