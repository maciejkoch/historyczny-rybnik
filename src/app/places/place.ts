export interface PartialDate {
  readonly from: string;
  readonly to: string | null;
  readonly approximate: boolean;
}
export interface PlaceLocation {
  readonly coordinates: { readonly lat: number; readonly lng: number } | null;
  readonly precision: string;
  readonly explanation: string | null;
}
export interface PlaceReference {
  readonly id: string;
  readonly title: string;
  readonly url: string | null;
  readonly page: string | null;
  readonly publicationDate: PartialDate | null;
  readonly historicalDate: PartialDate | null;
  readonly accessedAt: string;
  readonly excerpt: string;
  readonly excerptType: string;
  readonly note: string | null;
  readonly images: readonly {
    readonly storagePath: string;
    readonly thumbnailPath: string;
    readonly alt: string;
    readonly credit: string;
    readonly rights: string;
    readonly sha256: string;
    readonly thumbnailSha256: string;
    readonly provenance: {
      readonly title: string;
      readonly sourcePageUrl: string;
      readonly originalCollectionUrl: string;
      readonly originalImageUrl: string;
      readonly originalSha256: string;
      readonly author: string;
      readonly dateNote: string;
      readonly license: string;
      readonly licenseUrl: string;
      readonly copyrighted: boolean;
      readonly rightsCheckedAt: string;
      readonly transformations: string;
    };
  }[];
}
export interface Place {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly previousSlugs: readonly string[];
  readonly description: string;
  readonly category: string;
  readonly aliases: readonly string[];
  readonly addresses: readonly { readonly type: string; readonly text: string }[];
  readonly district: string | null;
  readonly location: PlaceLocation;
  readonly locationVersion: number;
  readonly updatedAt: string;
  readonly references: readonly PlaceReference[];
}
export interface LocationDto {
  readonly id: string;
  readonly location: PlaceLocation;
  readonly locationVersion: number;
  readonly updatedAt: string;
}
export const normalizeSearch = (value: string): string =>
  value
    .toLocaleLowerCase('pl')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ł/g, 'l');
