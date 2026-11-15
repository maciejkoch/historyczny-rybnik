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
  historicalAddress: string;
  currentAddress: string;
  mentions: PlaceContent['mentions'];
  materials: PlaceContent['materials'];
};
type UploadDraft = {
  file: File | null;
  target: string;
  alt: string;
  credit: string;
  rights: string;
  sourceTitle: string;
  sourcePageUrl: string;
  originalCollectionUrl: string;
  originalImageUrl: string;
  author: string;
  dateNote: string;
  license: string;
  licenseUrl: string;
};
type ImageRecord = {
  materialId: string;
  storagePath: string;
  thumbnailPath: string;
  alt: string;
  credit: string;
  rights: string;
  sha256: string;
  thumbnailSha256: string;
  provenance: {
    title: string;
    sourcePageUrl: string | null;
    originalCollectionUrl: string | null;
    originalImageUrl: string | null;
    originalSha256: string;
    author: string | null;
    dateNote: string;
    license: string;
    licenseUrl: string | null;
    copyrighted: boolean | null;
    rightsCheckedAt: string;
    transformations: string;
  };
};
const emptyUpload = (): UploadDraft => ({
  file: null,
  target: 'gallery',
  alt: '',
  credit: '',
  rights: '',
  sourceTitle: '',
  sourcePageUrl: '',
  originalCollectionUrl: '',
  originalImageUrl: '',
  author: '',
  dateNote: '',
  license: '',
  licenseUrl: '',
});

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
  historicalAddress: '',
  currentAddress: '',
  mentions: [],
  materials: [],
});

function lines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
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
    maxLength(path.historicalAddress, 500);
    maxLength(path.currentAddress, 500);
  });
  readonly selectedTagIds = signal<string[]>([]);
  readonly customTags = signal<Tag[]>([]);
  readonly newTagName = signal('');
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly uploadDraft = signal<UploadDraft>(emptyUpload());
  readonly rightsConfirmed = signal(false);
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
              historicalAddress: place.addresses
                .filter((a) => a.type === 'historical')
                .map((a) => a.text)
                .join('\n'),
              currentAddress: place.addresses
                .filter((a) => a.type === 'current')
                .map((a) => a.text)
                .join('\n'),
              mentions: structuredClone(place.mentions) as PlaceContent['mentions'],
              materials: structuredClone(place.materials) as PlaceContent['materials'],
            }
          : emptyModel(),
      );
      this.selectedTagIds.set(place?.tags.map((tag) => tag.id) ?? []);
      this.customTags.set([]);
      this.message.set('');
      this.uploadDraft.set(emptyUpload());
      this.rightsConfirmed.set(false);
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

  addMention(): void {
    this.model.update((model) => ({
      ...model,
      mentions: [
        ...model.mentions,
        {
          id: `mention_${crypto.randomUUID().replaceAll('-', '')}`,
          title: '',
          url: null,
          page: null,
          publicationDate: null,
          documentedDate: null,
          verification: 'draft',
          accessedAt: new Date().toISOString(),
          excerpt: '',
          excerptType: 'summary',
          note: null,
          materials: [],
        },
      ],
    }));
  }

  updateMention(index: number, field: string, value: string): void {
    this.model.update((model) => ({
      ...model,
      mentions: model.mentions.map((mention, i) =>
        i === index
          ? {
              ...mention,
              [field]: ['url', 'page', 'note'].includes(field) ? value || null : value,
            }
          : mention,
      ),
    }));
  }

  updateMentionDate(
    index: number,
    field: 'publicationDate' | 'documentedDate',
    value: string,
  ): void {
    this.model.update((model) => ({
      ...model,
      mentions: model.mentions.map((mention, i) =>
        i === index
          ? {
              ...mention,
              [field]: value
                ? {
                    from: value,
                    to: mention[field]?.to ?? null,
                    approximate: mention[field]?.approximate ?? false,
                  }
                : null,
            }
          : mention,
      ),
    }));
  }

  updateMentionDateEnd(
    index: number,
    field: 'publicationDate' | 'documentedDate',
    value: string,
  ): void {
    this.model.update((model) => ({
      ...model,
      mentions: model.mentions.map((mention, i) =>
        i === index
          ? {
              ...mention,
              [field]: mention[field] ? { ...mention[field]!, to: value || null } : null,
            }
          : mention,
      ),
    }));
  }

  toggleMentionDateApproximate(
    index: number,
    field: 'publicationDate' | 'documentedDate',
    approximate: boolean,
  ): void {
    this.model.update((model) => ({
      ...model,
      mentions: model.mentions.map((mention, i) =>
        i === index
          ? { ...mention, [field]: mention[field] ? { ...mention[field]!, approximate } : null }
          : mention,
      ),
    }));
  }

  removeMention(index: number): void {
    this.model.update((model) => ({
      ...model,
      mentions: model.mentions.filter((_, i) => i !== index),
    }));
  }

  setUploadFile(file: File | null): void {
    this.uploadDraft.update((draft) => ({ ...draft, file }));
  }

  updateUpload(field: Exclude<keyof UploadDraft, 'file' | 'target'>, value: string): void {
    this.uploadDraft.update((draft) => ({ ...draft, [field]: value }));
  }

  async uploadMaterial(): Promise<void> {
    if (this.uploading()) return;
    const draft = this.uploadDraft();
    if (!draft.file) return this.message.set('Wybierz plik obrazu.');
    if (!this.rightsConfirmed()) return this.message.set('Potwierdź prawo do udostępnienia pliku.');
    if (
      !draft.alt.trim() ||
      !draft.credit.trim() ||
      !draft.rights.trim() ||
      !draft.sourceTitle.trim() ||
      !draft.dateNote.trim() ||
      !draft.license.trim()
    )
      return this.message.set(
        'Uzupełnij opis alternatywny, podpis, prawa, źródło, datę i licencję.',
      );
    if (draft.file.size <= 0 || draft.file.size > 10 * 1024 * 1024)
      return this.message.set('Plik musi mieć rozmiar od 1 B do 10 MB.');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(draft.file.type))
      return this.message.set('Obsługiwane są obrazy JPEG, PNG i WebP.');
    if (
      draft.target !== 'gallery' &&
      !this.model().mentions.some((mention) => mention.id === draft.target)
    )
      return this.message.set('Wybrana wzmianka już nie istnieje.');
    if (draft.target !== 'gallery') {
      const mention = this.model().mentions.find((value) => value.id === draft.target)!;
      if (mention.verification !== 'verified' || !mention.documentedDate)
        return this.message.set('Materiały można dodać tylko do zweryfikowanej wzmianki z datą.');
    }
    this.uploading.set(true);
    this.message.set('');
    try {
      const head = new Uint8Array(await draft.file.slice(0, 12).arrayBuffer());
      const signatures = {
        'image/jpeg': head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff,
        'image/png': head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47,
        'image/webp': String.fromCharCode(...head.slice(8, 12)) === 'WEBP',
      };
      if (!signatures[draft.file.type as keyof typeof signatures])
        throw new Error('Zawartość pliku nie zgadza się z jego typem.');
      const bitmap = await createImageBitmap(draft.file);
      try {
        if (bitmap.width > 30000 || bitmap.height > 30000)
          throw new Error('Obraz ma zbyt duże wymiary.');
        const originalSha256 = await this.hash(draft.file);
        const imageBlob = await this.toWebp(bitmap, 2400, 0.9);
        const thumbBlob = await this.toWebp(bitmap, 480, 0.82);
        if (imageBlob.size > 10 * 1024 * 1024 || thumbBlob.size > 10 * 1024 * 1024)
          throw new Error('Przetworzony obraz przekracza limit Storage.');
        const sha256 = await this.hash(imageBlob);
        const thumbnailSha256 = await this.hash(thumbBlob);
        const materialId = `upload_${crypto.randomUUID().replaceAll('-', '')}`;
        const storagePath = `public/materials/${materialId}/${sha256}.webp`;
        const thumbnailPath = `public/materials/${materialId}/${thumbnailSha256}.webp`;
        const [{ getApp }, { getStorage, ref, uploadBytes }] = await Promise.all([
          import('firebase/app'),
          import('firebase/storage'),
        ]);
        const storage = getStorage(getApp());
        await uploadBytes(ref(storage, storagePath), imageBlob, { contentType: 'image/webp' });
        if (thumbnailPath !== storagePath)
          await uploadBytes(ref(storage, thumbnailPath), thumbBlob, { contentType: 'image/webp' });
        const record: ImageRecord = {
          materialId,
          storagePath,
          thumbnailPath,
          alt: draft.alt.trim(),
          credit: draft.credit.trim(),
          rights: draft.rights.trim(),
          sha256,
          thumbnailSha256,
          provenance: {
            title: draft.sourceTitle.trim(),
            sourcePageUrl: draft.sourcePageUrl.trim() || null,
            originalCollectionUrl: draft.originalCollectionUrl.trim() || null,
            originalImageUrl: draft.originalImageUrl.trim() || null,
            originalSha256,
            author: draft.author.trim() || null,
            dateNote: draft.dateNote.trim(),
            license: draft.license.trim(),
            licenseUrl: draft.licenseUrl.trim() || null,
            copyrighted: null,
            rightsCheckedAt: new Date().toISOString().slice(0, 10),
            transformations:
              'Konwersja do WebP, usunięcie metadanych osadzonych w obrazie; miniatura wygenerowana w przeglądarce.',
          },
        };
        this.model.update((model) => {
          if (draft.target === 'gallery') {
            const wasPrimary = model.materials.some((material) => material.isPrimary);
            const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
            return {
              ...model,
              materials: [
                ...model.materials,
                {
                  ...record,
                  width: Math.round(bitmap.width * scale),
                  height: Math.round(bitmap.height * scale),
                  isPrimary: !wasPrimary,
                },
              ],
            };
          }
          return {
            ...model,
            mentions: model.mentions.map((mention) =>
              mention.id === draft.target
                ? {
                    ...mention,
                    materials: [
                      ...mention.materials,
                      { ...record, documentedDate: mention.documentedDate! },
                    ],
                  }
                : mention,
            ),
          };
        });
      } finally {
        bitmap.close();
      }
      this.uploadDraft.set(emptyUpload());
      this.rightsConfirmed.set(false);
      this.message.set('Materiał przesłano. Zapisz kartę, aby dodać go do publicznej galerii.');
    } catch (error) {
      this.message.set(error instanceof Error ? error.message : 'Nie udało się przesłać obrazu.');
    } finally {
      this.uploading.set(false);
    }
  }

  setPrimaryMaterial(materialId: string): void {
    this.model.update((model) => ({
      ...model,
      materials: model.materials.map((material) => ({
        ...material,
        isPrimary: material.materialId === materialId,
      })),
    }));
  }

  removeGalleryMaterial(materialId: string): void {
    this.model.update((model) => {
      let materials = model.materials.filter((material) => material.materialId !== materialId);
      if (materials.length && !materials.some((material) => material.isPrimary))
        materials = materials.map((material, index) => ({ ...material, isPrimary: index === 0 }));
      return { ...model, materials };
    });
  }

  removeMentionMaterial(mentionIndex: number, materialId: string): void {
    this.model.update((model) => ({
      ...model,
      mentions: model.mentions.map((mention, index) =>
        index === mentionIndex
          ? {
              ...mention,
              materials: mention.materials.filter((material) => material.materialId !== materialId),
            }
          : mention,
      ),
    }));
  }

  updateImageMetadata(
    mentionIndex: number | null,
    materialId: string,
    field: 'alt' | 'credit' | 'rights' | 'sourceTitle' | 'sourcePageUrl' | 'dateNote' | 'license',
    value: string,
  ): void {
    this.model.update((model) => {
      const update = <
        T extends Pick<ImageRecord, 'materialId' | 'alt' | 'credit' | 'rights' | 'provenance'>,
      >(
        material: T,
      ): T => {
        if (material.materialId !== materialId) return material;
        if (
          field === 'sourceTitle' ||
          field === 'sourcePageUrl' ||
          field === 'dateNote' ||
          field === 'license'
        ) {
          const provenanceField =
            field === 'sourceTitle' ? 'title' : field === 'sourcePageUrl' ? 'sourcePageUrl' : field;
          return {
            ...material,
            provenance: {
              ...material.provenance,
              [provenanceField]: value || (field === 'sourcePageUrl' ? null : ''),
            },
          } as T;
        }
        return { ...material, [field]: value } as T;
      };
      if (mentionIndex === null) return { ...model, materials: model.materials.map(update) };
      return {
        ...model,
        mentions: model.mentions.map((mention, index) =>
          index === mentionIndex
            ? { ...mention, materials: mention.materials.map(update) }
            : mention,
        ),
      };
    });
  }

  private async hash(blob: Blob): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  private async toWebp(bitmap: ImageBitmap, maxDimension: number, quality: number): Promise<Blob> {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Przeglądarka nie może przetworzyć obrazu.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', quality),
    );
    if (!blob) throw new Error('Nie udało się przygotować obrazu WebP.');
    return blob;
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
          addresses: [
            ...lines(value.historicalAddress).map((text) => ({
              type: 'historical' as const,
              text,
            })),
            ...lines(value.currentAddress).map((text) => ({ type: 'current' as const, text })),
          ],
          district: value.district.trim() || null,
          location,
          mentions: value.mentions,
          materials: value.materials,
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
