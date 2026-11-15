import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormField, form, maxLength, pattern, required, submit } from '@angular/forms/signals';
import { Locations } from '../places/locations';
import { Place, PlaceContent, normalizeSearch } from '../places/place';

type Point = { lat: number; lng: number };
type Tag = { id: string; name: string };
type EditorModel = {
  name: string;
  slug: string;
  description: string;
  periodStatus: 'confirmed' | 'probable' | 'unverified';
  periodExplanation: string;
  aliases: string;
  previousSlugs: string;
  district: string;
  locationMode: 'known' | 'unknown';
  latitude: string;
  longitude: string;
  precision: 'building' | 'approximate';
  locationExplanation: string;
  addressesJson: string;
  mentionsJson: string;
  materialsJson: string;
};

const emptyModel = (): EditorModel => ({
  name: '',
  slug: '',
  description: '',
  periodStatus: 'unverified',
  periodExplanation: '',
  aliases: '',
  previousSlugs: '',
  district: '',
  locationMode: 'unknown',
  latitude: '',
  longitude: '',
  precision: 'approximate',
  locationExplanation: '',
  addressesJson: '[]',
  mentionsJson: '[]',
  materialsJson: '[]',
});

function lines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function jsonValue(value: string, label: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`Pole „${label}” musi zawierać poprawny JSON.`);
  }
}

@Component({
  selector: 'app-place-editor',
  imports: [FormField],
  templateUrl: './place-editor.html',
  styleUrl: './place-editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceEditor {
  readonly place = input<Place | null>(null);
  readonly tags = input<readonly Tag[]>([]);
  readonly pickedPoint = input<Point | null>(null);
  readonly pickingPoint = input(false);
  readonly cancel = output<void>();
  readonly saved = output<Place>();
  readonly requestPoint = output<void>();

  readonly model = signal<EditorModel>(emptyModel());
  readonly editorForm = form(this.model, (path) => {
    required(path.name, { message: 'Podaj nazwę miejsca.' });
    maxLength(path.name, 200);
    required(path.slug, { message: 'Podaj adres miejsca.' });
    maxLength(path.slug, 100);
    pattern(path.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: 'Adres może zawierać małe litery, cyfry i pojedyncze łączniki.',
    });
    required(path.description, { message: 'Podaj opis miejsca.' });
    maxLength(path.description, 20000);
    required(path.periodExplanation, { message: 'Uzasadnij ocenę okresu.' });
    maxLength(path.periodExplanation, 2000);
    maxLength(path.aliases, 6000);
    maxLength(path.previousSlugs, 4000);
    maxLength(path.district, 200);
    maxLength(path.locationExplanation, 2000);
    maxLength(path.addressesJson, 20000);
    maxLength(path.mentionsJson, 700000);
    maxLength(path.materialsJson, 700000);
  });
  readonly selectedTagIds = signal<string[]>([]);
  readonly customTags = signal<Tag[]>([]);
  readonly newTagName = signal('');
  readonly saving = signal(false);
  readonly message = signal('');
  private readonly locations: Locations;
  private slugEdited = false;

  constructor(locations: Locations) {
    this.locations = locations;
    effect(() => {
      const place = this.place();
      this.slugEdited = Boolean(place);
      this.model.set(
        place
          ? {
              name: place.name,
              slug: place.slug,
              description: place.description,
              periodStatus: place.period.status,
              periodExplanation: place.period.explanation,
              aliases: place.aliases.join('\n'),
              previousSlugs: place.previousSlugs.join('\n'),
              district: place.district ?? '',
              locationMode: place.location.coordinates ? 'known' : 'unknown',
              latitude: place.location.coordinates?.lat.toString() ?? '',
              longitude: place.location.coordinates?.lng.toString() ?? '',
              precision: place.location.precision === 'building' ? 'building' : 'approximate',
              locationExplanation: place.location.explanation ?? '',
              addressesJson: JSON.stringify(place.addresses, null, 2),
              mentionsJson: JSON.stringify(place.mentions, null, 2),
              materialsJson: JSON.stringify(place.materials, null, 2),
            }
          : emptyModel(),
      );
      this.selectedTagIds.set(place?.tags.map((tag) => tag.id) ?? []);
      this.customTags.set([]);
      this.message.set('');
    });
    effect(() => {
      const point = this.pickedPoint();
      if (!point) return;
      this.model.update((value) => ({
        ...value,
        locationMode: 'known',
        latitude: point.lat.toFixed(6),
        longitude: point.lng.toFixed(6),
      }));
    });
  }

  get isNew(): boolean {
    return this.place() === null;
  }

  allTags(): readonly Tag[] {
    const result = new Map<string, Tag>();
    for (const tag of [...this.tags(), ...this.customTags(), ...(this.place()?.tags ?? [])])
      result.set(tag.id, tag);
    return [...result.values()].sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  }

  isTagSelected(id: string): boolean {
    return this.selectedTagIds().includes(id);
  }

  toggleTag(id: string): void {
    this.selectedTagIds.update((ids) =>
      ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id],
    );
  }

  setLocationMode(known: boolean): void {
    this.model.update((value) => ({ ...value, locationMode: known ? 'known' : 'unknown' }));
  }

  setCoordinate(axis: 'latitude' | 'longitude', value: string): void {
    this.model.update((current) => ({ ...current, [axis]: value }));
  }

  addTag(): void {
    const name = this.newTagName().trim();
    if (!name) return;
    if (name.length > 200) {
      this.message.set('Nazwa tagu może mieć najwyżej 200 znaków.');
      return;
    }
    if (this.selectedTagIds().length >= 100) {
      this.message.set('Miejsce może mieć najwyżej 100 tagów.');
      return;
    }
    const existing = this.allTags().find(
      (tag) => normalizeSearch(tag.name) === normalizeSearch(name),
    );
    if (existing) {
      if (!this.isTagSelected(existing.id))
        this.selectedTagIds.update((ids) => [...ids, existing.id]);
      this.newTagName.set('');
      return;
    }
    const base = normalizeSearch(name)
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    if (!base) {
      this.message.set('Nazwa tagu musi zawierać literę lub cyfrę.');
      return;
    }
    const root = `tag_${base}`.slice(0, 100);
    const used = new Set(this.allTags().map((tag) => tag.id));
    let id = root;
    for (let suffix = 2; used.has(id); suffix++) id = `${root.slice(0, 96)}_${suffix}`;
    this.customTags.update((tags) => [...tags, { id, name }]);
    this.selectedTagIds.update((ids) => [...ids, id]);
    this.newTagName.set('');
    this.message.set('');
  }

  nameChanged(value: string): void {
    this.model.update((current) => ({
      ...current,
      name: value,
      slug: this.isNew && !this.slugEdited ? this.slugify(value) : current.slug,
    }));
  }

  slugChanged(value: string): void {
    this.slugEdited = true;
    this.model.update((current) => {
      const previous = new Set(lines(current.previousSlugs));
      const originalSlug = this.place()?.slug;
      if (originalSlug && originalSlug !== value) previous.add(originalSlug);
      previous.delete(value);
      return { ...current, slug: value, previousSlugs: [...previous].join('\n') };
    });
  }

  async save(): Promise<void> {
    if (this.saving()) return;
    this.message.set('');
    await submit(this.editorForm, async () => {
      this.saving.set(true);
      try {
        const value = this.model();
        const byId = new Map(this.allTags().map((tag) => [tag.id, tag]));
        const tags = this.selectedTagIds()
          .map((id) => byId.get(id))
          .filter((tag): tag is Tag => Boolean(tag));
        const location =
          value.locationMode === 'known'
            ? {
                coordinates: { lat: Number(value.latitude), lng: Number(value.longitude) },
                precision: value.precision,
                explanation: value.locationExplanation.trim(),
              }
            : {
                coordinates: null,
                precision: 'unknown' as const,
                explanation: value.locationExplanation.trim() || null,
              };
        if (value.locationMode === 'known' && (!value.latitude.trim() || !value.longitude.trim()))
          throw new Error('Wskaż punkt na mapie lub podaj obie współrzędne.');
        const content = {
          name: value.name.trim(),
          slug: value.slug.trim(),
          previousSlugs: lines(value.previousSlugs),
          description: value.description.trim(),
          tags,
          period: { status: value.periodStatus, explanation: value.periodExplanation.trim() },
          aliases: lines(value.aliases),
          addresses: jsonValue(value.addressesJson, 'Adresy'),
          district: value.district.trim() || null,
          location,
          mentions: jsonValue(value.mentionsJson, 'Wzmianki'),
          materials: jsonValue(value.materialsJson, 'Galeria'),
        };
        if (!tags.length) throw new Error('Wybierz co najmniej jeden tag.');
        const { publicPlaceContentSchema } =
          await import('../../../functions/src/contracts/places.mjs');
        const parsed = publicPlaceContentSchema.safeParse(content);
        if (!parsed.success) {
          const issue = parsed.error.issues[0];
          throw new Error(`Sprawdź dane miejsca (${issue.path.join('.') || 'formularz'}).`);
        }
        const saved = await this.locations.savePlace(
          parsed.data as PlaceContent,
          this.place() ?? undefined,
        );
        this.saved.emit(saved);
      } catch (error) {
        const code = (error as { code?: string }).code;
        const messages: Record<string, string> = {
          'functions/aborted':
            'Miejsce zmieniło się od otwarcia formularza. Anuluj i wczytaj kartę ponownie.',
          'functions/already-exists': 'Ten adres jest już przypisany do innego miejsca.',
          'functions/permission-denied': 'Twoje konto nie ma uprawnienia do edycji miejsc.',
          'functions/unauthenticated': 'Zaloguj się ponownie, aby zapisać miejsce.',
          'functions/invalid-argument': 'Dane nie przeszły walidacji. Sprawdź formularz.',
        };
        this.message.set(
          code
            ? (messages[code] ?? 'Nie udało się zapisać miejsca. Spróbuj ponownie.')
            : error instanceof Error
              ? error.message
              : 'Nie udało się zapisać miejsca.',
        );
      } finally {
        this.saving.set(false);
      }
    });
  }

  private slugify(value: string): string {
    return normalizeSearch(value)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 100)
      .replace(/-$/, '');
  }
}
