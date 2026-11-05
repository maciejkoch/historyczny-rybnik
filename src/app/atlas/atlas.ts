import { ChangeDetectionStrategy, Component, ElementRef, signal, viewChild } from '@angular/core';
import { AtlasMap } from '../atlas-map/atlas-map';
import { DEMO_PLACES, DemoPlace } from './demo-places';

@Component({
  selector: 'app-atlas',
  imports: [AtlasMap],
  templateUrl: './atlas.html',
  styleUrl: './atlas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Atlas {
  readonly places = DEMO_PLACES;
  readonly selected = signal<DemoPlace | null>(null);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  select(place: DemoPlace): void {
    this.selected.set(place);
    requestAnimationFrame(() => this.panel()?.nativeElement.querySelector<HTMLElement>('#place-title')?.focus());
  }

  close(): void {
    const id = this.selected()?.id;
    this.selected.set(null);
    requestAnimationFrame(() => this.panel()?.nativeElement.querySelector<HTMLElement>(`[data-place="${id}"]`)?.focus({ preventScroll: true }));
  }
}
