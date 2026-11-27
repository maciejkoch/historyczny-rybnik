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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PanelLayout } from '../../atlas/panel-layout';
import { PortalHeader } from '../../layout/portal-header/portal-header';
import { Creator, CreatorDraft as Draft } from '../creator';
import { DraftForm } from './draft-form';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { Account } from '../../places/account';
import { PlaceDetailsPanel } from '../../atlas/place-details-panel';
import { draftPreview } from './draft-preview';
import { PublicPlaces } from '../../places/public-places';
import type { Place } from '../../places/place';
import { validatePublication } from '../../../../functions/src/contracts/publication.mjs';
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
        <div class="ml-auto flex items-center gap-2">
          @if (draft() && placeStatus() === 'published' && saveState() === 'saved') {
            <span class="badge badge-success" role="status">Opublikowane</span>
          } @else {
            <button
              type="button"
              class="btn btn-primary"
              [disabled]="
                !draft() || busy() || saveState() !== 'saved' || placeStatus() === 'unknown'
              "
              (click)="requestPublish()"
            >
              {{ published() ? 'Publikuj zmiany' : 'Publikuj' }}
            </button>
          }
          @if (draft() && placeStatus() === 'unknown' && saveState() === 'saved') {
            <span role="alert" class="text-sm text-error-content"
              >Nie udało się sprawdzić stanu publikacji.</span
            >
            <button type="button" class="btn btn-sm" (click)="refreshPlaceStatus()">
              Sprawdź stan publikacji
            </button>
          }
          <details #actionsMenu class="dropdown dropdown-end">
            <summary class="btn btn-outline" [class.btn-disabled]="busy()">Więcej</summary>
            <ul class="menu dropdown-content z-20 w-72 rounded-box bg-base-100 p-2 shadow">
              @if (published()) {
                <li>
                  <button
                    type="button"
                    [disabled]="busy()"
                    (click)="actionsMenu.open = false; requestAction('restore')"
                  >
                    Przywróć szkic do wersji opublikowanej
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    [disabled]="busy()"
                    (click)="actionsMenu.open = false; requestAction('unpublish')"
                  >
                    Wycofaj z publikacji
                  </button>
                </li>
              } @else if (draft() && placeStatus() === 'draft') {
                <li>
                  <button
                    type="button"
                    [disabled]="busy() || !!form()?.uploading()"
                    (click)="actionsMenu.open = false; requestAction('delete')"
                  >
                    Usuń szkic
                  </button>
                </li>
              }
            </ul>
          </details>
        </div>
        @if (saveState() === 'error') {
          <button class="btn btn-sm" (click)="retry()">Ponów zapis</button>
        }
      </div>
      <app-confirm-dialog
        #actionDialog
        [title]="actionTitle()"
        [message]="actionMessage()"
        [confirmLabel]="action() === 'restore' ? 'Przywróć szkic' : actionTitle()"
        [destructive]="action() !== 'publish'"
        (closed)="confirmAction($event)"
      />
      @if (operationMessage()) {
        <p role="alert" class="alert alert-error mt-3">{{ operationMessage() }}</p>
      }
      @if (issues().length) {
        <div role="alert" class="alert alert-error mt-3 block">
          <p>Nie można opublikować. Popraw wskazane pola:</p>
          <ul>
            @for (issue of issues(); track $index) {
              <li>
                <button type="button" class="link" (click)="focusIssue(issue.path)">
                  {{ issue.message }}
                </button>
              </li>
            }
          </ul>
        </div>
      }
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
            [inert]="busy()"
            class="min-w-[280px] flex-1 overflow-y-auto rounded-box border border-base-300 bg-base-100 p-5"
          >
            @for (key of [formRevision()]; track key) {
              <app-draft-form
                [initial]="draft()!.data"
                [draftId]="draft()!.id"
                [publicationIssues]="issues()"
              />
            }
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
              <div class="join ml-auto" role="group" aria-label="Wersja podglądu">
                <button
                  type="button"
                  class="btn btn-sm join-item"
                  [class.btn-primary]="previewMode() === 'draft'"
                  [attr.aria-pressed]="previewMode() === 'draft'"
                  (click)="showDraft()"
                >
                  Szkic
                </button>
                <button
                  type="button"
                  class="btn btn-sm join-item"
                  [class.btn-primary]="previewMode() === 'published'"
                  [attr.aria-pressed]="previewMode() === 'published'"
                  [disabled]="!published() || previewLoading()"
                  [attr.title]="published() ? null : 'Miejsce nie jest opublikowane'"
                  (click)="showPublished()"
                >
                  Opublikowane
                </button>
              </div>
            </div>
            @if (previewLoading()) {
              <p role="status">Wczytywanie wersji opublikowanej…</p>
            }
            @if (previewError()) {
              <p role="alert" class="alert alert-error mt-3">
                Nie udało się pobrać wersji opublikowanej.
                <button type="button" class="btn btn-sm" (click)="showPublished()">Ponów</button>
              </p>
            }
            <app-place-details-panel
              [place]="previewMode() === 'draft' ? preview() : publishedPreview()"
            />
          </section>
        </div>
      }
    </main>`,
})
export class CreatorDraft {
  readonly creator = inject(Creator);
  private readonly publicPlaces = inject(PublicPlaces);
  readonly previewMode = signal<'draft' | 'published'>('draft');
  readonly previewLoading = signal(false);
  readonly previewError = signal(false);
  readonly publishedPreview = signal<Place | null>(null);
  private previewRequest = 0;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private deleted = false;
  readonly draft = signal<Draft | null>(null);
  readonly savedData = signal<Draft['data'] | null>(null);
  readonly preview = computed(() => {
    const data = this.savedData();
    return data ? draftPreview(data) : null;
  });
  readonly error = signal(false);
  readonly published = signal(false);
  readonly placeStatus = signal<'draft' | 'modified' | 'published' | 'unknown'>('unknown');
  readonly formRevision = signal(0);
  readonly busy = signal(false);
  readonly action = signal<'publish' | 'restore' | 'unpublish' | 'delete'>('publish');
  readonly operationMessage = signal('');
  readonly issues = signal<Array<{ path: string[]; message: string }>>([]);
  readonly actionTitle = computed(
    () =>
      ({
        publish: 'Publikuj',
        restore: 'Przywróć szkic do wersji opublikowanej',
        unpublish: 'Wycofaj z publikacji',
        delete: 'Usuń szkic',
      })[this.action()],
  );
  readonly actionMessage = computed(
    () =>
      ({
        publish: 'Czy na pewno opublikować zapisany szkic?',
        delete: 'Szkic zostanie usunięty. Tej operacji nie można cofnąć.',
        restore:
          'Nieopublikowane zmiany w szkicu zostaną utracone. Szkic będzie zawierał aktualną wersję opublikowaną.',
        unpublish:
          'Miejsce zniknie z mapy, wyszukiwarki i publicznej karty. Szkic pozostanie; przesłane obrazy nadal będą dostępne pod bezpośrednimi adresami.',
      })[this.action()],
  );
  private readonly actionDialog = viewChild.required<ConfirmDialog>('actionDialog');
  readonly saveState = signal<'saved' | 'dirty' | 'saving' | 'error'>('saved');
  readonly statusText = () =>
    ({
      saved: 'Szkic zapisany',
      dirty: 'Niezapisane zmiany',
      saving: 'Zapisywanie…',
      error: 'Nie udało się zapisać',
    })[this.saveState()];
  readonly form = viewChild(DraftForm);
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
    if (this.issues().length) this.validateForPublication(value);
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
      .then(async () => {
        this.savedData.set(data);
        await this.refreshPlaceStatus();
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
    if (this.deleted) return true;
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
  private validateForPublication(data: Draft['data']): boolean {
    const now = new Date().toISOString();
    const result = validatePublication(this.draft()!.id, data, now, now);
    if (result.success) {
      this.issues.set([]);
      return true;
    }
    this.issues.set(
      result.error.issues.map((issue) => {
        const path = issue.path.map(String);
        const label: Record<string, string> = {
          name: 'Nazwa',
          slug: 'Slug',
          description: 'Opis',
          tags: 'Tagi',
          documentedPeriod: 'Udokumentowany okres',
          mentions: 'Wzmianka',
          materials: 'Materiał',
          location: 'Lokalizacja',
          historicalAddress: 'Adres historyczny',
        };
        const suffix = path[1] && /^\d+$/.test(path[1]) ? ` ${Number(path[1]) + 1}` : '';
        const field: Record<string, string> = {
          title: 'tytuł',
          description: 'opis',
          sourceUrl: 'link do źródła',
          publicationDate: 'data publikacji',
          documentedDate: 'data zdarzenia',
          alt: 'tekst alternatywny',
          date: 'data',
          materialIds: 'powiązane materiały',
        };
        const detail = path[2] && field[path[2]] ? ` — ${field[path[2]]}` : '';
        return {
          path,
          message: `${label[path[0]] ?? 'Dane miejsca'}${suffix}${detail}: uzupełnij lub popraw wartość.`,
        };
      }),
    );
    return false;
  }
  focusIssue(path: string[]): void {
    const root = document.querySelector('app-draft-form');
    const entry =
      path[1] && /^\d+$/.test(path[1])
        ? root?.querySelector<HTMLElement>(`[data-entry="${path[0]}-${path[1]}"]`)
        : null;
    const field =
      entry && path[2] ? entry.querySelector<HTMLElement>(`[data-field="${path[2]}"]`) : null;
    const el = field ?? entry ?? root?.querySelector<HTMLElement>(`[data-validation="${path[0]}"]`);
    if (!el) return;
    for (let parent = el.parentElement; parent; parent = parent.parentElement)
      if (parent instanceof HTMLDetailsElement) parent.open = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (el.matches('input,textarea,select,button')
      ? el
      : el.querySelector<HTMLElement>('input,textarea,select,button')
    )?.focus();
  }
  showDraft(): void {
    ++this.previewRequest;
    this.previewMode.set('draft');
    this.previewLoading.set(false);
    this.previewError.set(false);
  }
  private invalidatePublishedPreview(): void {
    ++this.previewRequest;
    this.publishedPreview.set(null);
    this.previewLoading.set(false);
  }
  async showPublished(): Promise<void> {
    const id = this.draft()?.id;
    if (!id || !this.published()) return;
    const request = ++this.previewRequest;
    this.previewMode.set('published');
    this.previewError.set(false);
    if (this.publishedPreview()) return;
    this.previewLoading.set(true);
    try {
      await this.publicPlaces.load();
      if (this.publicPlaces.status() !== 'ready') throw new Error('Catalogue unavailable');
      const summary = this.publicPlaces.summaries().find((place) => place.id === id);
      if (!summary) throw new Error('Place unavailable');
      const place = await this.publicPlaces.detail(summary.slug);
      if (!place || place.id !== id) throw new Error('Place unavailable');
      if (request === this.previewRequest) this.publishedPreview.set(place);
    } catch {
      if (request === this.previewRequest) this.previewError.set(true);
    } finally {
      if (request === this.previewRequest) this.previewLoading.set(false);
    }
  }
  async requestPublish(): Promise<void> {
    if (this.busy() || this.form()?.uploading()) return;
    this.operationMessage.set('');
    this.captureChanges();
    await this.flush();
    if (this.saveState() !== 'saved' || !this.savedData()) {
      this.operationMessage.set('Najpierw zapisz szkic i popraw błędy dat.');
      return;
    }
    if (!this.validateForPublication(this.savedData()!)) return;
    this.busy.set(true);
    try {
      const result = await this.creator.validatePublication(this.draft()!.id, this.savedData()!);
      if (!result.ok) {
        this.showServerIssues(result.issues);
        return;
      }
    } catch {
      this.operationMessage.set('Nie udało się sprawdzić szkicu. Spróbuj ponownie.');
      return;
    } finally {
      this.busy.set(false);
    }
    this.requestAction('publish');
  }
  private showServerIssues(issues: Array<{ path: string[]; code: string }>): void {
    this.issues.set(
      issues.map((i) => ({
        path: i.path,
        message:
          i.code === 'slug_taken'
            ? 'Slug: ten adres jest już zajęty.'
            : i.code === 'slug_changed'
              ? 'Slug: nie można zmienić adresu istniejącego miejsca.'
              : `Popraw dane: ${i.path.join(' / ')}`,
      })),
    );
  }
  requestAction(action: 'publish' | 'restore' | 'unpublish' | 'delete'): void {
    if (this.busy()) return;
    this.action.set(action);
    this.busy.set(true);
    this.actionDialog().open();
  }
  async confirmAction(confirmed: boolean): Promise<void> {
    if (!confirmed || !this.draft()) {
      this.busy.set(false);
      return;
    }
    this.operationMessage.set('');
    try {
      if (this.action() === 'restore' || this.action() === 'delete') {
        clearTimeout(this.timer);
        if (this.pending) await this.pending;
        clearTimeout(this.timer);
        this.latest = null;
      } else {
        this.captureChanges();
        await this.flush();
        if (this.saveState() !== 'saved' || !this.savedData()) throw new Error('save');
      }
      const id = this.draft()!.id;
      if (this.action() === 'publish') {
        if (!this.validateForPublication(this.savedData()!)) return;
        const result = await this.creator.publish(id, this.savedData()!);
        if (!result.ok) {
          this.showServerIssues(result.issues);
          return;
        }
        this.published.set(true);
        this.placeStatus.set('published');
        this.invalidatePublishedPreview();
        if (this.previewMode() === 'published') await this.showPublished();
      } else if (this.action() === 'restore') {
        await this.creator.restore(id);
        this.baseline = null;
        this.latest = null;
        this.savedData.set(null);
        this.draft.set(null);
        this.formRevision.update((value) => value + 1);
        this.issues.set([]);
        this.saveState.set('saved');
        await this.load();
        this.invalidatePublishedPreview();
        if (this.previewMode() === 'published') await this.showPublished();
      } else if (this.action() === 'delete') {
        await this.creator.remove(id);
        this.deleted = true;
        await this.router.navigate(['/kreator']);
      } else {
        await this.creator.unpublish(id);
        this.published.set(false);
        this.placeStatus.set('draft');
        this.invalidatePublishedPreview();
        this.showDraft();
      }
    } catch {
      this.operationMessage.set(
        'Nie udało się potwierdzić operacji. Sprawdź stan miejsca przed ponowieniem.',
      );
    } finally {
      this.busy.set(false);
    }
  }
  async refreshPlaceStatus(): Promise<void> {
    const id = this.draft()?.id;
    if (!id) return;
    try {
      const item = (await this.creator.list()).find((place) => place.id === id);
      if (!item) throw new Error('Place unavailable');
      this.placeStatus.set(item.status);
      this.published.set(item.status !== 'draft');
    } catch {
      this.placeStatus.set('unknown');
    }
  }
  async load(): Promise<void> {
    this.error.set(false);
    try {
      const draft = await this.creator.open(this.route.snapshot.paramMap.get('id') ?? '');
      const items = await this.creator.list();
      const item = items.find((place) => place.id === draft.id);
      if (!item) throw new Error('Place unavailable');
      this.placeStatus.set(item.status);
      this.published.set(item.status !== 'draft');
      this.savedData.set(draft.data);
      this.draft.set(draft);
    } catch {
      this.error.set(true);
    }
  }
}
