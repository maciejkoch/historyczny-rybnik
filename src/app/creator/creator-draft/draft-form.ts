import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
  inject,
} from '@angular/core';
import { form, FormField, maxLength, validate } from '@angular/forms/signals';
import { MARKER_CATEGORIES } from '../../atlas-map/place-markers';
import { PlaceTag } from '../../atlas/place-tag';
import { MentionEditor } from './mention-editor';
import { LocationEditor } from './location-editor';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { Creator, type CreatorDraft } from '../creator';
import { FIREBASE_DEV } from '../../places/runtime-config';
import type PhotoSwipeLightbox from 'photoswipe/lightbox';

type Data = CreatorDraft['data'];

function validPeriod(value: string): boolean {
  return value === '' || /^\d{4}$/.test(value) || /^(0[1-9]|1[0-2])-\d{4}$/.test(value);
}
function displayPeriod(value: string | null | undefined): string {
  return (value ?? '').replace(/^(\d{4})-(\d{2})$/, '$2-$1');
}
function storePeriod(value: string): string | null {
  return value.replace(/^(0[1-9]|1[0-2])-(\d{4})$/, '$2-$1') || null;
}
@Component({
  selector: 'app-draft-form',
  imports: [FormField, PlaceTag, MentionEditor, LocationEditor, ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    details:not([open]) > .collapse-content {
      border: 0;
    }
  `,
  template: `
    <h2 class="text-xl font-semibold">Edycja ręczna</h2>
    <details class="collapse collapse-arrow mt-2" open>
      <summary class="collapse-title min-h-0 px-0 py-3 text-lg font-semibold">
        Informacje główne
      </summary>
      <div class="collapse-content rounded-box border border-base-300 bg-base-100">
        <fieldset class="fieldset">
          <legend class="fieldset-legend text-sm">Nazwa</legend>
          <input
            class="input w-full"
            data-validation="name"
            [attr.aria-invalid]="fieldIssues('name').length ? true : null"
            [formField]="fields.name"
            (input)="nameChanged($any($event.target).value)"
          />
          @for (message of fieldIssues('name'); track $index) {
            <p class="text-error-content text-sm">{{ message }}</p>
          }
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend text-sm">Slug</legend>
          <input
            class="input w-full"
            data-validation="slug"
            [attr.aria-invalid]="fieldIssues('slug').length ? true : null"
            [formField]="fields.slug"
            (input)="slugEdited = true"
          />
          @for (message of fieldIssues('slug'); track $index) {
            <p class="text-error-content text-sm">{{ message }}</p>
          }
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend text-sm">Opis</legend>
          <textarea
            class="textarea w-full"
            rows="4"
            data-validation="description"
            [attr.aria-invalid]="fieldIssues('description').length ? true : null"
            [formField]="fields.description"
          ></textarea>
          @for (message of fieldIssues('description'); track $index) {
            <p class="text-error-content text-sm">{{ message }}</p>
          }
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend text-sm">Tagi</legend>
          <div data-validation="tags" tabindex="-1">
            @for (message of fieldIssues('tags'); track $index) {
              <p class="text-error-content text-sm">{{ message }}</p>
            }
          </div>
          @for (tag of tags(); track $index; let i = $index) {
            <div class="flex items-center gap-2">
              <span class="flex grow items-center gap-2">
                <app-place-tag
                  [tag]="{ id: tag.id || '', name: tag.name || tag.id || 'Niepełny tag' }"
                />
                @if (i === 0) {
                  <span class="badge badge-sm">Główny</span>
                }
              </span>
              <button
                type="button"
                class="btn btn-xs"
                (click)="move(i, -1)"
                [disabled]="i === 0"
                [attr.aria-label]="'Przesuń tag w górę: ' + tag.name"
              >
                ↑
              </button>
              <button
                type="button"
                class="btn btn-xs"
                (click)="move(i, 1)"
                [disabled]="i === tags().length - 1"
                [attr.aria-label]="'Przesuń tag w dół: ' + tag.name"
              >
                ↓
              </button>
              <button
                type="button"
                class="btn btn-outline border-error-content text-error-content"
                (click)="remove(i)"
                [attr.aria-label]="'Usuń tag: ' + tag.name"
              >
                Usuń
              </button>
            </div>
          }
          <label class="fieldset-legend text-sm" for="creator-tag">Dodaj tag z listy</label
          ><select
            id="creator-tag"
            class="select w-full"
            #choice
            (change)="add(choice.value); choice.value = ''"
          >
            <option value="">Wybierz tag</option>
            @for (tag of available(); track tag.id) {
              <option [value]="tag.id">{{ tag.name }}</option>
            }
          </select>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend text-sm">Udokumentowany okres</legend>
          <div data-validation="documentedPeriod" tabindex="-1">
            @for (message of fieldIssues('documentedPeriod'); track $index) {
              <p class="text-error-content text-sm">{{ message }}</p>
            }
          </div>
          <div class="flex gap-2">
            <label class="grow text-sm font-semibold"
              >Od
              <input
                class="input w-full"
                [formField]="fields.from"
                placeholder="RRRR lub MM-RRRR"
              />
              @if (fields.from().touched() && fields.from().invalid()) {
                <span class="text-error-content" role="alert"
                  >Wpisz rok, np. 1939, albo miesiąc i rok, np. 05-1939.</span
                >
              }
            </label>
            <label class="grow text-sm font-semibold"
              >Do
              <input class="input w-full" [formField]="fields.to" placeholder="RRRR lub MM-RRRR" />
              @if (fields.to().touched() && fields.to().invalid()) {
                <span class="text-error-content" role="alert"
                  >Wpisz rok, np. 1939, albo miesiąc i rok, np. 05-1939.</span
                >
              }
            </label>
          </div>
          <p class="text-sm text-base-content/70">
            Rok albo miesiąc i rok; puste „Do” oznacza nieustalony koniec.
          </p>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend text-sm">Adres historyczny</legend>
          <input class="input w-full" [formField]="fields.historicalAddress" />
        </fieldset>
      </div>
    </details>
    <section class="mt-3 border-t border-base-300 pt-3">
      <div class="flex items-center justify-between gap-2">
        <h3 data-validation="mentions" tabindex="-1" class="text-lg font-semibold">Wzmianki</h3>
        <button
          type="button"
          class="btn btn-outline"
          [disabled]="mentions().length >= 100"
          (click)="addMention()"
        >
          Dodaj wzmiankę
        </button>
      </div>
      <div class="mt-3 grid gap-3">
        @for (entry of mentions(); track entry.key; let i = $index) {
          <app-mention-editor
            [attr.data-entry]="'mentions-' + i"
            [publicationIssues]="entryIssues('mentions', i)"
            [initial]="entry.data"
            [materials]="materials()"
            [uploading]="uploading()"
            [uploadError]="uploadError()"
            (selectionAccepted)="setMaterialSelection(entry.key, $event)"
            (uploadRequested)="upload($event.file, $event.onUploaded)"
            (removeRequested)="confirmMention(entry.key)"
          />
        } @empty {
          <p class="text-sm">Brak wzmianek.</p>
        }
      </div>
    </section>
    <section class="mt-3 border-t border-base-300 pt-3">
      <h3 data-validation="materials" tabindex="-1" class="text-lg font-semibold">Materiały</h3>
      <button
        type="button"
        class="btn btn-outline mt-2"
        [disabled]="uploading()"
        (click)="materialFile.click()"
      >
        Dodaj materiał
      </button>
      <input
        #materialFile
        hidden
        type="file"
        accept="image/jpeg,image/png,image/webp"
        (change)="upload($any($event.target).files?.[0]); $any($event.target).value = ''"
      />
      @if (uploading()) {
        <p role="status">Przesyłanie materiału…</p>
      }
      @if (uploadError()) {
        <p role="alert" class="alert alert-error">{{ uploadError() }} Wybierz plik ponownie.</p>
      }
      <div class="mt-3 grid gap-3">
        @for (material of materials(); track $index; let i = $index) {
          <div class="rounded-box border border-base-300 p-3" [attr.data-entry]="'materials-' + i">
            @for (issue of entryIssues('materials', i); track $index) {
              <p class="text-error-content text-sm">{{ issue.message }}</p>
            }
            <button
              type="button"
              class="block w-full cursor-zoom-in"
              (click)="openGallery(i)"
              [disabled]="!material.storagePath || !material.width || !material.height"
              [attr.aria-label]="'Powiększ: ' + (material.alt || 'materiał')"
            >
              <img
                class="max-h-96 w-full object-contain"
                [src]="imageUrl(material.storagePath)"
                [alt]="material.alt || 'Materiał'"
              />
            </button>
            <label class="fieldset"
              ><span>Tekst alternatywny</span
              ><input
                class="input w-full"
                maxlength="500"
                data-field="alt"
                [attr.aria-invalid]="
                  entryIssues('materials', i).some(issueField('alt')) ? true : null
                "
                [value]="material.alt || ''"
                (input)="updateMaterial(i, 'alt', $any($event.target).value)"
              />
              @for (issue of entryIssues('materials', i); track $index) {
                @if (issue.path[2] === 'alt') {
                  <span class="text-error-content text-sm">{{ issue.message }}</span>
                }
              }
            </label>
            <label class="fieldset"
              ><span>Data (RRRR, RRRR-MM lub RRRR-MM-DD)</span
              ><input
                class="input w-full"
                maxlength="32"
                data-field="date"
                [attr.aria-invalid]="
                  entryIssues('materials', i).some(issueField('date')) ? true : null
                "
                [value]="material.date || ''"
                (input)="updateMaterial(i, 'date', $any($event.target).value || null)"
              />
              @for (issue of entryIssues('materials', i); track $index) {
                @if (issue.path[2] === 'date') {
                  <span class="text-error-content text-sm">{{ issue.message }}</span>
                }
              }
            </label>
            <label class="fieldset"
              ><span>Źródło</span
              ><input
                class="input w-full"
                maxlength="500"
                [value]="material.source || ''"
                (input)="updateMaterial(i, 'source', $any($event.target).value || null)"
            /></label>
            <label class="fieldset"
              ><span>Link do źródła</span
              ><input
                class="input w-full"
                maxlength="2000"
                data-field="sourceUrl"
                [attr.aria-invalid]="
                  entryIssues('materials', i).some(issueField('sourceUrl')) ? true : null
                "
                [value]="material.sourceUrl || ''"
                (input)="updateMaterial(i, 'sourceUrl', $any($event.target).value || null)"
              />
              @for (issue of entryIssues('materials', i); track $index) {
                @if (issue.path[2] === 'sourceUrl') {
                  <span class="text-error-content text-sm">{{ issue.message }}</span>
                }
              }
            </label>
            <label class="label flex w-fit text-sm font-semibold"
              ><input
                type="checkbox"
                class="checkbox"
                [checked]="material.isPrimary"
                (change)="setPrimary(i, $any($event.target).checked)"
              />
              Materiał główny</label
            >
            <button
              type="button"
              class="btn btn-outline border-error-content text-error-content mt-3"
              (click)="confirmMaterial(i)"
            >
              Usuń materiał
            </button>
          </div>
        } @empty {
          <p>Brak materiałów.</p>
        }
      </div>
    </section>
    <app-confirm-dialog
      #materialDialog
      title="Usuń materiał"
      [message]="materialRemovalMessage()"
      confirmLabel="Usuń"
      cancelLabel="Anuluj"
      [destructive]="true"
      (closed)="removeMaterial($event)"
    />
    <app-confirm-dialog
      #mentionDialog
      title="Usuń wzmiankę"
      message="Czy na pewno chcesz usunąć tę wzmiankę ze szkicu?"
      confirmLabel="Usuń"
      cancelLabel="Anuluj"
      [destructive]="true"
      (closed)="removeMention($event)"
    />
    <app-location-editor [initial]="initial().location" />
  `,
})
export class DraftForm {
  readonly initial = input.required<Data>();
  readonly draftId = input.required<string>();
  private readonly creator = inject(Creator);
  private lightbox: PhotoSwipeLightbox | null = null;
  readonly materials = signal<NonNullable<Data['materials']>>([]);
  readonly uploading = signal(false);
  readonly uploadError = signal('');
  readonly materialRemovalMessage = signal('');
  private materialToRemove: number | null = null;
  private readonly materialDialog = viewChild.required<ConfirmDialog>('materialDialog');
  readonly changed = output<Data>();
  readonly publicationIssues = input<Array<{ path: string[]; message: string }>>([]);
  issueField(field: string) {
    return (issue: { path: string[] }) => issue.path[2] === field;
  }
  entryIssues(field: string, index: number): Array<{ path: string[]; message: string }> {
    return this.publicationIssues().filter(
      (issue) => issue.path[0] === field && issue.path[1] === String(index),
    );
  }
  fieldIssues(field: string): string[] {
    return this.publicationIssues()
      .filter((issue) => issue.path[0] === field)
      .map((issue) => issue.message);
  }
  readonly model = signal({
    name: '',
    slug: '',
    description: '',
    from: '',
    to: '',
    historicalAddress: '',
  });
  readonly fields = form(this.model, (p) => {
    maxLength(p.name, 200);
    maxLength(p.slug, 100);
    maxLength(p.description, 20000);
    maxLength(p.from, 32);
    maxLength(p.to, 32);
    validate(p.from, ({ value }) => (validPeriod(value()) ? undefined : { kind: 'dateFormat' }));
    validate(p.to, ({ value }) => (validPeriod(value()) ? undefined : { kind: 'dateFormat' }));
    maxLength(p.historicalAddress, 500);
  });
  readonly tags = signal<NonNullable<Data['tags']>>([]);
  readonly available = computed(() =>
    MARKER_CATEGORIES.filter((t) => !this.tags().some((v) => v.id === t.id)),
  );
  slugEdited = false;
  readonly initialized = signal(false);
  readonly mentions = signal<Array<{ key: string; data: NonNullable<Data['mentions']>[number] }>>(
    [],
  );
  private readonly mentionEditors = viewChildren(MentionEditor);
  private readonly locationEditor = viewChild(LocationEditor);
  private readonly confirmDialog = viewChild.required<ConfirmDialog>('mentionDialog');
  private selectedMention: string | null = null;
  constructor() {
    inject(DestroyRef).onDestroy(() => this.lightbox?.destroy());
    effect(() => {
      const data = this.initial();
      if (this.initialized()) return;

      this.slugEdited = !!data.slug;
      this.model.set({
        name: data.name ?? '',
        slug: data.slug ?? '',
        description: data.description ?? '',
        from: displayPeriod(data.documentedPeriod?.from),
        to: displayPeriod(data.documentedPeriod?.to),
        historicalAddress: data.historicalAddress ?? '',
      });
      this.tags.set(data.tags ?? []);
      this.materials.set(data.materials ?? []);
      this.mentions.set((data.mentions ?? []).map((m) => ({ key: crypto.randomUUID(), data: m })));
      this.initialized.set(true);
    });
  }
  nameChanged(name: string): void {
    if (!this.slugEdited)
      this.model.update((v) => ({
        ...v,
        slug: name
          .toLowerCase()
          .replace(/ł/g, 'l')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 100),
      }));
  }
  value(base: Data): Data {
    const m = this.model();
    const initial = this.initial();
    const result = { ...base };
    if (m.name !== (initial.name ?? '')) result.name = m.name;
    if (m.slug !== (initial.slug ?? '')) result.slug = m.slug;
    if (m.description !== (initial.description ?? '')) result.description = m.description;
    if (m.historicalAddress !== (initial.historicalAddress ?? ''))
      result.historicalAddress = m.historicalAddress;
    if (
      m.from !== displayPeriod(initial.documentedPeriod?.from) ||
      m.to !== displayPeriod(initial.documentedPeriod?.to)
    )
      result.documentedPeriod = {
        ...initial.documentedPeriod,
        from:
          m.from === displayPeriod(initial.documentedPeriod?.from)
            ? initial.documentedPeriod?.from
            : storePeriod(m.from),
        to:
          m.to === displayPeriod(initial.documentedPeriod?.to)
            ? initial.documentedPeriod?.to
            : storePeriod(m.to),
      };
    if (JSON.stringify(this.tags()) !== JSON.stringify(initial.tags ?? []))
      result.tags = this.tags();
    if (JSON.stringify(this.materials()) !== JSON.stringify(initial.materials ?? []))
      result.materials = this.materials();
    const entries = this.mentions();
    const editors = this.mentionEditors();
    if (editors.length === entries.length && editors.every((e) => e.initialized())) {
      const mentions = editors.map((e) => e.value());
      if (JSON.stringify(mentions) !== JSON.stringify(initial.mentions ?? []))
        result.mentions = mentions;
    }
    const location = this.locationEditor();
    if (location?.initialized()) {
      const value = location.value();
      if (JSON.stringify(value ?? null) !== JSON.stringify(initial.location ?? null))
        result.location = value;
    }
    return result;
  }
  ready(): boolean {
    const editors = this.mentionEditors();
    return (
      this.initialized() &&
      editors.length === this.mentions().length &&
      editors.every((editor) => editor.initialized()) &&
      !!this.locationEditor()?.initialized()
    );
  }
  invalidDates(): boolean {
    return (
      this.fields.from().invalid() ||
      this.fields.to().invalid() ||
      this.mentionEditors().some((e) => e.invalidDates())
    );
  }
  addMention(): void {
    this.mentions.update((v) => [
      ...v,
      { key: crypto.randomUUID(), data: { id: crypto.randomUUID() } },
    ]);
  }
  imageUrl(path: string | null | undefined): string {
    return path
      ? `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_DEV.storageBucket}/o/${encodeURIComponent(path)}?alt=media`
      : '';
  }
  async openGallery(index: number): Promise<void> {
    const selected = this.materials()[index];
    const materials = this.materials().filter(
      (material) =>
        material.storagePath &&
        material.width &&
        material.height &&
        material.width > 0 &&
        material.height > 0,
    );
    const selectedIndex = materials.indexOf(selected);
    if (selectedIndex < 0) return;
    this.lightbox?.destroy();
    const { default: Lightbox } = await import('photoswipe/lightbox');
    const lightbox = new Lightbox({
      dataSource: materials.map((material) => ({
        src: this.imageUrl(material.storagePath),
        msrc: this.imageUrl(material.thumbnailPath),
        width: material.width!,
        height: material.height!,
        alt: material.alt || 'Materiał',
      })),
      pswpModule: () => import('photoswipe'),
      closeTitle: 'Zamknij',
      zoomTitle: 'Powiększ',
      arrowPrevTitle: 'Poprzednie zdjęcie',
      arrowNextTitle: 'Następne zdjęcie',
      errorMsg: 'Nie udało się wczytać zdjęcia.',
    });
    this.lightbox = lightbox;
    lightbox.init();
    lightbox.loadAndOpen(selectedIndex);
  }
  async upload(file: File | undefined, onUploaded?: (id: string) => void): Promise<void> {
    if (!file || this.uploading()) return;
    if (this.materials().length >= 100) {
      this.uploadError.set('Osiągnięto limit materiałów.');
      return;
    }
    this.uploadError.set('');
    this.uploading.set(true);
    try {
      const material = await this.creator.upload(this.draftId(), file);
      this.materials.update((items) => [...items, material]);
      if (material.materialId) onUploaded?.(material.materialId);
    } catch {
      this.uploadError.set('Nie udało się przesłać obrazu (JPEG, PNG lub WebP, maks. 8 MB).');
    } finally {
      this.uploading.set(false);
    }
  }
  setMaterialSelection(key: string, ids: string[]): void {
    this.mentions.update((entries) =>
      entries.map((entry) =>
        entry.key === key ? { ...entry, data: { ...entry.data, materialIds: ids } } : entry,
      ),
    );
  }
  updateMaterial(
    i: number,
    key: 'alt' | 'date' | 'source' | 'sourceUrl',
    value: string | null,
  ): void {
    this.materials.update((items) =>
      items.map((item, index) => (index === i ? { ...item, [key]: value } : item)),
    );
  }
  setPrimary(i: number, checked: boolean): void {
    this.materials.update((items) =>
      items.map((item, index) => ({ ...item, isPrimary: index === i && checked })),
    );
  }
  confirmMaterial(i: number): void {
    this.materialToRemove = i;
    const id = this.materials()[i]?.materialId;
    const count = this.mentions().filter(
      (entry) => id && entry.data.materialIds?.includes(id),
    ).length;
    this.materialRemovalMessage.set(
      `Usunąć materiał ze szkicu? Powiązania ze wzmiankami: ${count}. Plik pozostanie w Storage.`,
    );
    this.materialDialog().open();
  }
  removeMaterial(confirmed: boolean): void {
    const i = this.materialToRemove;
    this.materialToRemove = null;
    if (!confirmed || i === null) return;
    const id = this.materials()[i]?.materialId;
    this.materials.update((items) => items.filter((_, index) => index !== i));
    if (id)
      this.mentions.update((entries) =>
        entries.map((entry) => ({
          ...entry,
          data: { ...entry.data, materialIds: entry.data.materialIds?.filter((x) => x !== id) },
        })),
      );
  }
  confirmMention(key: string): void {
    this.selectedMention = key;
    this.confirmDialog().open();
  }
  removeMention(confirmed: boolean): void {
    if (confirmed && this.selectedMention)
      this.mentions.update((v) => v.filter((e) => e.key !== this.selectedMention));
    this.selectedMention = null;
  }
  add(id: string): void {
    const tag = MARKER_CATEGORIES.find((t) => t.id === id);
    if (tag) this.tags.update((v) => [...v, { id: tag.id, name: tag.name }]);
  }
  remove(i: number): void {
    this.tags.update((v) => v.filter((_, index) => i !== index));
  }
  move(i: number, delta: number): void {
    this.tags.update((v) => {
      const a = [...v];
      const j = i + delta;
      if (j >= 0 && j < a.length) [a[i], a[j]] = [a[j], a[i]];
      return a;
    });
  }
}
