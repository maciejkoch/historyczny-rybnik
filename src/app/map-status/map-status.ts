import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type MapState = 'planned' | 'loading' | 'error';

@Component({
  selector: 'app-map-status',
  template: `
    <div aria-live="polite" aria-atomic="true">
      @switch (state()) {
        @case ('loading') {
          <p role="status"><span class="loading loading-spinner loading-sm" aria-hidden="true"></span> Ładowanie mapy…</p>
        }
        @case ('error') {
          <div class="alert alert-error" role="alert">
            <p>Nie udało się wczytać mapy. Treść panelu jest nadal dostępna.</p>
            <button type="button" class="btn btn-outline" (click)="retry.emit()">Spróbuj ponownie</button>
          </div>
        }
        @default { <p>Mapa jest w przygotowaniu.</p> }
      }
    </div>
  `,
  styles: `:host { display: block; color: var(--color-muted); } p { margin: 0; } .alert { display: flex; flex-wrap: wrap; text-align: left; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapStatus {
  readonly state = input<MapState>('planned');
  readonly retry = output<void>();
}
