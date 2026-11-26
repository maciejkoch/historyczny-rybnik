import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { form, FormField, maxLength, validate } from '@angular/forms/signals';
import type { CreatorDraft } from '../creator';
import { FIREBASE_DEV } from '../../places/runtime-config';
import { displayMentionDate, storeMentionDate, validMentionDate } from './mention-date';
type Mention = NonNullable<CreatorDraft['data']['mentions']>[number];
@Component({
  selector: 'app-mention-editor',
  imports: [FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <details class="collapse collapse-arrow border border-base-300 bg-base-100" open>
    <summary class="collapse-title font-semibold">{{ model().title || 'Nowa wzmianka' }}</summary>
    <div class="collapse-content">
      <label class="fieldset"
        ><span class="fieldset-legend text-sm">Tytuł</span
        ><input class="input w-full" [formField]="fields.title"
      /></label>
      <label class="fieldset"
        ><span class="fieldset-legend text-sm">Opis</span
        ><textarea class="textarea w-full" rows="3" [formField]="fields.description"></textarea>
      </label>
      <label class="fieldset"
        ><span class="fieldset-legend text-sm">Data publikacji źródła</span
        ><input
          class="input w-full"
          [formField]="fields.publicationDate"
          placeholder="RRRR, MM-RRRR lub DD-MM-RRRR"
        />
        @if (fields.publicationDate().touched() && fields.publicationDate().invalid()) {
          <span class="text-error-content text-sm" role="alert"
            >Wpisz poprawną datę: RRRR, MM-RRRR lub DD-MM-RRRR.</span
          >
        }
      </label>
      <fieldset class="fieldset">
        <legend class="fieldset-legend text-sm">Okres, którego dotyczy wzmianka</legend>
        <div class="flex gap-2">
          <label class="grow text-sm font-semibold"
            >Od<input
              class="input w-full"
              [formField]="fields.from"
              placeholder="RRRR, MM-RRRR lub DD-MM-RRRR"
            />
            @if (fields.from().touched() && fields.from().invalid()) {
              <span class="text-error-content" role="alert">Wpisz poprawną datę.</span>
            }
          </label>
          <label class="grow text-sm font-semibold"
            >Do<input class="input w-full" [formField]="fields.to" placeholder="Opcjonalnie" />
            @if (fields.to().touched() && fields.to().invalid()) {
              <span class="text-error-content" role="alert">Wpisz poprawną datę.</span>
            }
          </label>
        </div>
        <p class="text-sm text-base-content/70">Puste „Do” oznacza pojedynczą datę.</p>
      </fieldset>
      <label class="fieldset"
        ><span class="fieldset-legend text-sm">Nazwa źródła</span
        ><input class="input w-full" [formField]="fields.source"
      /></label>
      <label class="fieldset"
        ><span class="fieldset-legend text-sm">Link do źródła</span
        ><input class="input w-full" [formField]="fields.sourceUrl"
      /></label>
      <label class="fieldset"
        ><span class="fieldset-legend text-sm">Wskazanie fragmentu źródła</span
        ><input class="input w-full" [formField]="fields.sourceNote" placeholder="Np. strona 4"
      /></label>
      <div class="mt-4">
        <p class="font-semibold">Powiązane materiały</p>
        <div class="mt-2 flex flex-wrap gap-2">
          @for (material of materials(); track $index) {
            @if (isSelected(material.materialId)) {
              <button
                type="button"
                class="btn h-auto p-1"
                (click)="openPicker(materialPicker)"
                [attr.aria-label]="'Edytuj powiązane materiały: ' + (material.alt || 'obraz')"
              >
                <img
                  class="h-24 w-24 object-cover"
                  [src]="imageUrl(material.thumbnailPath)"
                  [alt]="material.alt || 'Materiał'"
                />
              </button>
            }
          }
        </div>
        <button type="button" class="btn btn-outline mt-2" (click)="openPicker(materialPicker)">
          Dodaj materiał
        </button>
        <dialog
          #materialPicker
          class="modal"
          aria-label="Wybierz materiały"
          (close)="pickerClosed()"
        >
          <div class="modal-box">
            <h3 class="text-lg font-semibold">Wybierz materiały</h3>
            <div class="mt-2 flex flex-wrap gap-2">
              @for (material of materials(); track $index) {
                @if (material.materialId) {
                  <button
                    type="button"
                    class="btn h-auto p-1"
                    [class.btn-primary]="pendingIds().includes(material.materialId)"
                    [attr.aria-pressed]="pendingIds().includes(material.materialId)"
                    (click)="togglePending(material.materialId)"
                  >
                    <img
                      class="h-24 w-24 object-cover"
                      [src]="imageUrl(material.thumbnailPath)"
                      [alt]="material.alt || 'Materiał'"
                    />
                  </button>
                }
              } @empty {
                <p>Nie dodano jeszcze materiałów.</p>
              }
            </div>
            <input
              #mentionFile
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp"
              (change)="uploadFile($any($event.target).files?.[0]); $any($event.target).value = ''"
            />
            @if (uploading()) {
              <p role="status">Przesyłanie materiału…</p>
            }
            @if (uploadError()) {
              <p role="alert" class="alert alert-error">
                {{ uploadError() }} Wybierz plik ponownie.
              </p>
            }
            <div class="modal-action flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                class="btn btn-outline"
                [disabled]="uploading()"
                (click)="mentionFile.click()"
              >
                Dodaj nowy materiał
              </button>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="btn btn-primary"
                  [disabled]="uploading()"
                  (click)="acceptPicker(materialPicker)"
                >
                  OK
                </button>
                <button type="button" class="btn" (click)="materialPicker.close()">Anuluj</button>
              </div>
            </div>
          </div>
          <form method="dialog" class="modal-backdrop">
            <button aria-label="Zamknij okno">Zamknij</button>
          </form>
        </dialog>
      </div>
      <button
        type="button"
        class="btn btn-outline border-error-content text-error-content mt-3"
        (click)="removeRequested.emit()"
      >
        Usuń wzmiankę
      </button>
    </div>
  </details>`,
})
export class MentionEditor {
  readonly initial = input.required<Mention>();
  readonly removeRequested = output<void>();
  readonly materials = input<NonNullable<CreatorDraft['data']['materials']>>([]);
  readonly uploading = input(false);
  readonly uploadError = input('');
  readonly selectionAccepted = output<string[]>();
  readonly uploadRequested = output<{ file: File; onUploaded: (id: string) => void }>();
  readonly pendingIds = signal<string[]>([]);
  private pickerSession = 0;
  openPicker(dialog: HTMLDialogElement): void {
    this.pickerSession++;
    this.pendingIds.set([...(this.initial().materialIds ?? [])]);
    dialog.showModal();
  }
  pickerClosed(): void {
    this.pickerSession++;
  }
  togglePending(id: string): void {
    this.pendingIds.update((ids) =>
      ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id],
    );
  }
  acceptPicker(dialog: HTMLDialogElement): void {
    this.selectionAccepted.emit(this.pendingIds());
    dialog.close();
  }
  uploadFile(file: File | undefined): void {
    if (!file) return;
    const session = this.pickerSession;
    this.uploadRequested.emit({
      file,
      onUploaded: (id) => {
        if (session === this.pickerSession) this.pendingIds.update((ids) => [...ids, id]);
      },
    });
  }
  isSelected(id: string | null | undefined): boolean {
    return !!id && (this.initial().materialIds ?? []).includes(id);
  }
  imageUrl(path: string | null | undefined): string {
    return path
      ? `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_DEV.storageBucket}/o/${encodeURIComponent(path)}?alt=media`
      : '';
  }
  readonly initialized = signal(false);
  readonly model = signal({
    title: '',
    description: '',
    publicationDate: '',
    from: '',
    to: '',
    source: '',
    sourceUrl: '',
    sourceNote: '',
  });
  readonly fields = form(this.model, (p) => {
    maxLength(p.title, 500);
    maxLength(p.description, 10000);
    maxLength(p.publicationDate, 32);
    maxLength(p.from, 32);
    maxLength(p.to, 32);
    maxLength(p.source, 500);
    maxLength(p.sourceUrl, 2000);
    maxLength(p.sourceNote, 2000);
    for (const path of [p.publicationDate, p.from, p.to])
      validate(path, ({ value }) =>
        validMentionDate(value()) ? undefined : { kind: 'dateFormat' },
      );
  });
  constructor() {
    effect(() => {
      const m = this.initial();
      if (this.initialized()) return;
      this.model.set({
        title: m.title ?? '',
        description: m.description ?? '',
        publicationDate: displayMentionDate(m.publicationDate),
        from: displayMentionDate(m.documentedDate?.from),
        to: displayMentionDate(m.documentedDate?.to),
        source: m.source ?? '',
        sourceUrl: m.sourceUrl ?? '',
        sourceNote: m.sourceNote ?? '',
      });
      this.initialized.set(true);
    });
  }
  invalidDates(): boolean {
    return (
      this.fields.publicationDate().invalid() ||
      this.fields.from().invalid() ||
      this.fields.to().invalid()
    );
  }
  value(): Mention {
    const m = this.model(),
      original = this.initial();
    const date = (current: string, prior: string | null | undefined) =>
      current === displayMentionDate(prior) ? prior : storeMentionDate(current);
    const result: Mention = { ...original };
    for (const key of ['title', 'description', 'source', 'sourceUrl', 'sourceNote'] as const)
      if (m[key] !== (original[key] ?? '')) result[key] = m[key];
    if (m.publicationDate !== displayMentionDate(original.publicationDate))
      result.publicationDate = storeMentionDate(m.publicationDate);
    if (
      m.from !== displayMentionDate(original.documentedDate?.from) ||
      m.to !== displayMentionDate(original.documentedDate?.to)
    )
      result.documentedDate = {
        ...original.documentedDate,
        from: date(m.from, original.documentedDate?.from),
        to: date(m.to, original.documentedDate?.to),
      };
    return result;
  }
}
