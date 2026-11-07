import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Consent } from '../consent';

@Component({
  selector: 'app-consent-banner',
  imports: [RouterLink],
  templateUrl: './consent-banner.html',
  styleUrl: './consent-banner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsentBanner {
  readonly consent = inject(Consent);
  readonly preferences = signal(false);
  readonly google = signal(false);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('settings');
  private handledRequest = 0;
  constructor() {
    afterRenderEffect(() => {
      const request = this.consent.settingsRequested();
      if (request !== this.handledRequest) {
        this.handledRequest = request;
        this.open();
      }
    });
  }
  open(): void {
    this.preferences.set(this.consent.preferences());
    this.google.set(this.consent.google());
    this.dialog().nativeElement.showModal();
  }
  save(preferences: boolean, google: boolean): void {
    this.dialog().nativeElement.close();
    this.consent.save(preferences, google);
  }
}
