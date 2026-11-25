import { afterNextRender, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PanelLayout } from '../../atlas/panel-layout';
import { PortalHeader } from '../../layout/portal-header/portal-header';
import { Creator, CreatorDraft as Draft } from '../creator';
@Component({
  selector: 'app-creator-draft',
  host: { class: 'flex h-dvh flex-col' },
  imports: [RouterLink, PanelLayout, PortalHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .creator-separator {
      display: grid;
      place-items: center;
      width: 8px;
      flex: none;
      cursor: col-resize;
      touch-action: none;
      background: var(--color-base-200);
      border-inline: 1px solid var(--color-line);
    }
    .creator-separator span {
      width: 2px;
      height: 2.5rem;
      border-radius: 2px;
      background: var(--color-muted);
    }
    .creator-separator:hover,
    .creator-separator:focus-visible {
      background: var(--color-line);
    }
    .creator-separator:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: -2px;
    }
  `,
  template: ` <header appPortalHeader></header>
    <main class="flex w-full min-h-0 flex-1 flex-col px-5 py-6">
      <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
        <a routerLink="/kreator" class="link">← Lista miejsc</a>
        <h1 class="text-2xl font-semibold">{{ draft()?.data?.name || 'Nowy szkic' }}</h1>
      </div>
      @if (error()) {
        <p role="alert" class="alert alert-error mt-5">
          Nie udało się otworzyć szkicu. <button class="btn btn-sm" (click)="load()">Ponów</button>
        </p>
      } @else if (!draft()) {
        <p class="mt-5" role="status">Wczytywanie szkicu…</p>
      } @else {
        <p id="creator-resize-help" class="sr-only">
          Przeciągnij krawędź panelu. Strzałki lewo i prawo przesuwają krawędź; Shift przyspiesza
          zmianę, Home i End ustawiają skrajne szerokości.
        </p>
        <div class="mt-5 flex min-h-0 flex-1 overflow-x-auto">
          <section
            id="creator-ai"
            appPanelLayout
            #aiLayout="panelLayout"
            [split]="true"
            preferenceKey="historyczny-rybnik.creator-ai.v1"
            class="min-w-0 shrink-0 overflow-y-auto rounded-box border border-base-300 bg-base-100 p-5"
            style="width: var(--panel-width)"
          >
            <h2 class="text-xl font-semibold">AI</h2>
            <p class="mt-3">Asystent pojawi się w kolejnym etapie.</p>
          </section>
          <div
            class="creator-separator"
            role="separator"
            tabindex="0"
            aria-orientation="vertical"
            aria-label="Szerokość panelu AI"
            aria-controls="creator-ai"
            [attr.aria-valuemin]="aiLayout.minWidth"
            [attr.aria-valuemax]="aiLayout.maxWidth()"
            [attr.aria-valuenow]="aiLayout.expandedWidth()"
            [attr.aria-valuetext]="aiLayout.expandedWidth() + ' pikseli'"
            aria-describedby="creator-resize-help"
            (pointerdown)="aiLayout.startResize($event)"
            (pointermove)="aiLayout.moveResize($event)"
            (pointerup)="aiLayout.stopResize($event)"
            (pointercancel)="aiLayout.stopResize($event, true)"
            (lostpointercapture)="aiLayout.stopResize($event)"
            (keydown)="aiLayout.resizeByKeyboard($event)"
            (dblclick)="aiLayout.resetWidth()"
          >
            <span aria-hidden="true"></span>
          </div>
          <section
            class="min-w-[280px] flex-1 overflow-y-auto rounded-box border border-base-300 bg-base-100 p-5"
          >
            <h2 class="text-xl font-semibold">Edycja ręczna</h2>
            <p class="mt-3">Formularz miejsca pojawi się w kolejnym etapie.</p>
          </section>
          <div
            class="creator-separator"
            role="separator"
            tabindex="0"
            aria-orientation="vertical"
            aria-label="Szerokość podglądu"
            aria-controls="creator-preview"
            [attr.aria-valuemin]="previewLayout.minWidth"
            [attr.aria-valuemax]="previewLayout.maxWidth()"
            [attr.aria-valuenow]="previewLayout.expandedWidth()"
            [attr.aria-valuetext]="previewLayout.expandedWidth() + ' pikseli'"
            aria-describedby="creator-resize-help"
            (pointerdown)="previewLayout.startResize($event)"
            (pointermove)="previewLayout.moveResize($event)"
            (pointerup)="previewLayout.stopResize($event)"
            (pointercancel)="previewLayout.stopResize($event, true)"
            (lostpointercapture)="previewLayout.stopResize($event)"
            (keydown)="previewLayout.resizeByKeyboard($event)"
            (dblclick)="previewLayout.resetWidth()"
          >
            <span aria-hidden="true"></span>
          </div>
          <section
            id="creator-preview"
            appPanelLayout
            #previewLayout="panelLayout"
            side="right"
            [split]="true"
            preferenceKey="historyczny-rybnik.creator-preview.v1"
            class="min-w-0 shrink-0 overflow-y-auto rounded-box border border-base-300 bg-base-100 p-5"
            style="width: var(--panel-width)"
          >
            <h2 class="text-xl font-semibold">Podgląd</h2>
            <p class="mt-3">Podgląd szkicu pojawi się w kolejnym etapie.</p>
          </section>
        </div>
      }
    </main>`,
})
export class CreatorDraft {
  readonly creator = inject(Creator);
  private readonly route = inject(ActivatedRoute);
  readonly draft = signal<Draft | null>(null);
  readonly error = signal(false);
  constructor() {
    afterNextRender(() => void this.load());
  }
  async load(): Promise<void> {
    this.error.set(false);
    try {
      this.draft.set(await this.creator.open(this.route.snapshot.paramMap.get('id') ?? ''));
    } catch {
      this.error.set(true);
    }
  }
}
