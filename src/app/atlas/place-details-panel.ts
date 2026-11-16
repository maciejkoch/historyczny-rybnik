import { ChangeDetectionStrategy, Component, input, output, OnDestroy } from '@angular/core';
import type PhotoSwipeLightbox from 'photoswipe/lightbox';
import { PartialDate, Place } from '../places/place';
import { FIREBASE_DEV } from '../places/runtime-config';

@Component({
  selector: 'app-place-details-panel',
  templateUrl: './place-details-panel.html',
  styleUrls: ['./panel-content.css', './place-details-panel.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceDetailsPanel implements OnDestroy {
  readonly place = input<Place | null>(null);
  readonly imageOpened = output<{ url: string; alt: string }>();
  private lightbox: PhotoSwipeLightbox | null = null;

  primaryMaterial() {
    return this.place()?.materials.find((material) => material.isPrimary);
  }

  async openGallery(index: number) {
    const materials = this.place()?.materials ?? [];
    if (!materials[index]) return;
    this.lightbox?.destroy();
    const { default: Lightbox } = await import('photoswipe/lightbox');
    const lightbox = new Lightbox({
      dataSource: materials.map((material) => ({
        src: this.imageUrl(material.storagePath),
        msrc: this.imageUrl(material.thumbnailPath),
        width: material.width,
        height: material.height,
        alt: material.alt,
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
    lightbox.loadAndOpen(index);
  }

  ngOnDestroy() {
    this.lightbox?.destroy();
  }

  date(value: PartialDate | null): string {
    return value ? `${value.from}${value.to ? ' – ' + value.to : ''}` : 'Data nieustalona';
  }

  imageUrl(path: string): string {
    return FIREBASE_DEV
      ? `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_DEV.storageBucket}/o/${encodeURIComponent(path)}?alt=media`
      : '';
  }
}
