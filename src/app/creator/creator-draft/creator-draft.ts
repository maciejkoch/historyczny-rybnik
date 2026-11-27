import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PanelLayout } from '../../atlas/panel-layout';
import { PortalHeader } from '../../layout/portal-header/portal-header';
import { Creator, CreatorDraft as Draft } from '../creator';
import { DraftForm } from './draft-form';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { Account } from '../../places/account';
import { PlaceDetailsPanel } from '../../atlas/place-details-panel';
import { draftPreview } from './draft-preview';
@Component({
  selector: 'app-creator-draft',
  host: { class: 'flex h-dvh flex-col' },
  imports: [RouterLink, PanelLayout, PortalHeader, DraftForm, ConfirmDialog, PlaceDetailsPanel],
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
        <span role="status" class="text-sm">{{ statusText() }}</span>
        @if (saveState() === 'error') {
          <button class="btn btn-sm" (click)="retry()">Ponów zapis</button>
        }
      </div>
      <app-confirm-dialog
        title="Niezapisane zmiany"
        message="Zmiany nie zostały zapisane. Czy chcesz opuścić edytor?"
        confirmLabel="Opuść"
        cancelLabel="Zostań"
        [destructive]="true"
        (closed)="confirmLeave($event)"
      />
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
            [equalThirds]="true"
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
            <app-draft-form [initial]="draft()!.data" [draftId]="draft()!.id" />
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
            [equalThirds]="true"
            preferenceKey="historyczny-rybnik.creator-preview.v1"
            class="min-w-0 shrink-0 overflow-y-auto rounded-box border border-base-300 bg-base-100 p-5"
            style="width: var(--panel-width)"
          >
            <div class="flex flex-wrap items-center gap-3">
              <h2 class="text-xl font-semibold">Podgląd</h2>
              <span class="badge badge-warning">Szkic — ostatnia zapisana wersja</span>
            </div>
            <app-place-details-panel [place]="preview()" />
          </section>
        </div>
      }
    </main>`,
})
export class CreatorDraft {
  readonly creator = inject(Creator);
  private readonly route = inject(ActivatedRoute);
  readonly draft = signal<Draft | null>(null);
  readonly savedData = signal<Draft['data'] | null>(null);
  readonly preview = computed(() => {
    const data = this.savedData();
    return data ? draftPreview(data) : null;
  });
  readonly error = signal(false);
  readonly saveState = signal<'saved' | 'dirty' | 'saving' | 'error'>('saved');
  readonly statusText = () =>
    ({
      saved: 'Szkic zapisany',
      dirty: 'Niezapisane zmiany',
      saving: 'Zapisywanie…',
      error: 'Nie udało się zapisać',
    })[this.saveState()];
  private readonly form = viewChild(DraftForm);
  private readonly dialog = viewChild.required(ConfirmDialog);
  private readonly account = inject(Account);
  private baseline: string | null = null;
  private latest: Draft['data'] | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private pending: Promise<void> | null = null;
  private resolveLeave: ((allow: boolean) => void) | null = null;
  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
    afterNextRender(() => void this.load());
    effect(() => this.captureChanges());
  }
  private captureChanges(): void {
    const form = this.form();
    const draft = this.draft();
    if (!form || !draft || !form.ready()) return;
    const value = form.value(draft.data);
    const serialized = JSON.stringify(value);
    if (this.baseline === null) {
      this.baseline = serialized;
      return;
    }
    if (serialized === this.baseline) return;
    this.baseline = serialized;
    this.latest = value;
    this.saveState.set('dirty');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), 500);
  }
  private hasInvalidDates(): boolean {
    const form = this.form();
    return !!form && form.invalidDates();
  }
  async flush(): Promise<void> {
    clearTimeout(this.timer);
    if (this.pending) {
      await this.pending;
      if (this.saveState() === 'error') return;
    }
    if (!this.latest) return;
    if (this.hasInvalidDates()) {
      this.saveState.set('dirty');
      return;
    }
    const data = this.latest;
    this.latest = null;
    this.saveState.set('saving');
    this.pending = this.creator
      .save(this.draft()!.id, data)
      .then(() => {
        this.savedData.set(data);
        this.saveState.set(this.latest ? 'dirty' : 'saved');
      })
      .catch(() => {
        this.latest ??= data;
        this.saveState.set('error');
      })
      .finally(() => {
        this.pending = null;
      });
    await this.pending;
    if (this.latest && this.saveState() !== 'error') await this.flush();
  }
  retry(): void {
    void this.flush();
  }
  async canLeave(): Promise<boolean> {
    if (this.account.authorizationReady() && !this.account.admin()) return true;
    if (this.form()?.uploading()) return false;
    this.captureChanges();
    await this.flush();
    if (this.saveState() === 'saved') return true;
    return new Promise((resolve) => {
      this.resolveLeave = resolve;
      this.dialog().open();
    });
  }
  confirmLeave(confirmed: boolean): void {
    this.resolveLeave?.(confirmed);
    this.resolveLeave = null;
  }
  async load(): Promise<void> {
    this.error.set(false);
    try {
      const draft = await this.creator.open(this.route.snapshot.paramMap.get('id') ?? '');
      this.savedData.set(draft.data);
      this.draft.set(draft);
    } catch {
      this.error.set(true);
    }
  }
}
