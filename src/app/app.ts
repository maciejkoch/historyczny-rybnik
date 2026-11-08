import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConsentBanner } from './privacy/consent-banner/consent-banner';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { PortalMenu } from './layout/portal-menu/portal-menu';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConsentBanner, PortalMenu],
  template: '<app-portal-menu><router-outlet /><app-consent-banner /></app-portal-menu>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly path = signal<string | null>(null);

  constructor() {
    inject(Router)
      .events.pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          // Updating the search query is not a change of page.
          this.path.set(event.urlAfterRedirects.split(/[?#]/)[0]);
        }
      });
    afterRenderEffect((onCleanup) => {
      if (this.path() === null) return;
      const frame = requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
      onCleanup(() => cancelAnimationFrame(frame));
    });
  }
}
