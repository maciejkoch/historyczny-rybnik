import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { form, FormField, maxLength, validate } from '@angular/forms/signals';
import type { CreatorDraft } from '../creator';
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
        ><span class="text-sm font-semibold">Tytuł</span
        ><input class="input w-full" [formField]="fields.title"
      /></label>
      <label class="fieldset"
        ><span class="text-sm font-semibold">Opis</span
        ><textarea class="textarea w-full" rows="3" [formField]="fields.description"></textarea>
      </label>
      <label class="fieldset"
        ><span class="text-sm font-semibold">Data publikacji źródła</span
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
          <label class="grow text-sm"
            >Od<input
              class="input w-full"
              [formField]="fields.from"
              placeholder="RRRR, MM-RRRR lub DD-MM-RRRR"
            />
            @if (fields.from().touched() && fields.from().invalid()) {
              <span class="text-error-content" role="alert">Wpisz poprawną datę.</span>
            }
          </label>
          <label class="grow text-sm"
            >Do<input class="input w-full" [formField]="fields.to" placeholder="Opcjonalnie" />
            @if (fields.to().touched() && fields.to().invalid()) {
              <span class="text-error-content" role="alert">Wpisz poprawną datę.</span>
            }
          </label>
        </div>
        <p class="text-sm text-base-content/70">Puste „Do” oznacza pojedynczą datę.</p>
      </fieldset>
      <label class="fieldset"
        ><span class="text-sm font-semibold">Nazwa źródła</span
        ><input class="input w-full" [formField]="fields.source"
      /></label>
      <label class="fieldset"
        ><span class="text-sm font-semibold">Link do źródła</span
        ><input class="input w-full" [formField]="fields.sourceUrl"
      /></label>
      <label class="fieldset"
        ><span class="text-sm font-semibold">Wskazanie fragmentu źródła</span
        ><input class="input w-full" [formField]="fields.sourceNote" placeholder="Np. strona 4"
      /></label>
      <button type="button" class="btn btn-outline btn-sm mt-3" (click)="removeRequested.emit()">
        Usuń wzmiankę
      </button>
    </div>
  </details>`,
})
export class MentionEditor {
  readonly initial = input.required<Mention>();
  readonly removeRequested = output<void>();
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
