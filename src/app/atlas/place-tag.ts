import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { markerCategory, markerIcon } from '../atlas-map/place-markers';

@Component({
  selector: 'app-place-tag',
  imports: [NgTemplateOutlet],
  template: `
    @if (interactive()) {
      <button type="button" class="btn btn-outline btn-xs rounded-full uppercase tag"
        [class.btn-primary]="selected()" [attr.aria-pressed]="selected()" (click)="chosen.emit()">
        <ng-container *ngTemplateOutlet="content" />
      </button>
    } @else {
      <span class="btn btn-outline btn-xs rounded-full uppercase tag cursor-default">
        <ng-container *ngTemplateOutlet="content" />
      </span>
    }
    <ng-template #content>
      <span class="tag-icon" [style.mask-image]="'url(' + icon() + ')'" aria-hidden="true"></span>
      {{ tag().name }}
    </ng-template>
  `,
  styles: `
    :host { display: inline-flex; }
    .tag { height: 32px; min-height: 32px; }
    .tag-icon {
      display: inline-block;
      width: 1.1rem;
      height: 1.1rem;
      flex: none;
      background: currentColor;
      mask: center / contain no-repeat;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceTag {
  readonly tag = input.required<{ id: string; name: string }>();
  readonly interactive = input(false);
  readonly selected = input(false);
  readonly chosen = output<void>();

  icon(): string {
    return markerIcon(markerCategory({ tags: [this.tag()] }).icon);
  }
}
