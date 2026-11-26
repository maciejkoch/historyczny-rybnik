import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { form, FormField, maxLength, validate } from '@angular/forms/signals';
import { MARKER_CATEGORIES } from '../../atlas-map/place-markers';
import { PlaceTag } from '../../atlas/place-tag';
import { MentionEditor } from './mention-editor';
import { LocationEditor } from './location-editor';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import type { CreatorDraft } from '../creator';

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
  styles: `details:not([open]) > .collapse-content { border: 0; }`,
  template: `
    <h2 class="text-xl font-semibold">Edycja ręczna</h2>
    <details class="collapse collapse-arrow mt-2" open>
      <summary class="collapse-title min-h-0 px-0 py-3 text-lg font-semibold">Informacje główne</summary>
      <div class="collapse-content rounded-box border border-base-300 bg-base-100">
        <fieldset class="fieldset">
          <legend class="fieldset-legend text-sm">Nazwa</legend>
          <input
            class="input w-full"
            [formField]="fields.name"
            (input)="nameChanged($any($event.target).value)"
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend text-sm">Slug</legend>
          <input class="input w-full" [formField]="fields.slug" (input)="slugEdited = true" />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend text-sm">Opis</legend>
          <textarea class="textarea w-full" rows="4" [formField]="fields.description"></textarea>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend text-sm">Tagi</legend>
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
                class="btn btn-xs"
                (click)="remove(i)"
                [attr.aria-label]="'Usuń tag: ' + tag.name"
              >
                Usuń
              </button>
            </div>
          }
          <label class="text-sm" for="creator-tag">Dodaj tag z listy</label
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
          <div class="flex gap-2">
            <label class="grow text-sm"
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
            <label class="grow text-sm"
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
        <h3 class="text-lg font-semibold">Wzmianki</h3>
        <button
          type="button"
          class="btn btn-sm"
          [disabled]="mentions().length >= 100"
          (click)="addMention()"
        >
          Dodaj wzmiankę
        </button>
      </div>
      <div class="mt-3 grid gap-3">
        @for (entry of mentions(); track entry.key) {
          <app-mention-editor
            [initial]="entry.data"
            (removeRequested)="confirmMention(entry.key)"
          />
        } @empty {
          <p class="text-sm">Brak wzmianek.</p>
        }
      </div>
    </section>
    <app-confirm-dialog
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
  readonly changed = output<Data>();
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
  private readonly confirmDialog = viewChild.required(ConfirmDialog);
  private selectedMention: string | null = null;
  constructor() {
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
