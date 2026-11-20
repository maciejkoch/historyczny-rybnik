import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { afterRenderEffect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { Consent } from './consent';

const MEASUREMENT_ID = 'G-7W7VH2ME8W';
type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

@Injectable({ providedIn: 'root' })
export class VisitAnalytics {
  private readonly consent = inject(Consent);
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly path = signal<string | null>(null);
  private initialized = false;

  constructor() {
    const router = inject(Router);
    router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) this.path.set(event.urlAfterRedirects.split(/[?#]/)[0]);
    });
    afterRenderEffect(() => {
      const path = this.path();
      const window = this.document.defaultView as AnalyticsWindow | null;
      if (
        !this.browser ||
        !window ||
        !this.consent.analytics() ||
        !path ||
        window.location.origin !== 'https://historyczny.rybnik.pl'
      )
        return;
      const page = window.location.origin + path;
      if (!this.initialized) {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () {
          window.dataLayer?.push(arguments);
        };
        window.gtag('js', new Date());
        window.gtag('config', MEASUREMENT_ID, {
          send_page_view: false,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
          page_location: page,
          page_referrer: '',
        });
        const script = this.document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
        this.document.head.appendChild(script);
        this.initialized = true;
      }
      window.gtag?.('event', 'page_view', { page_location: page, page_referrer: '' });
    });
  }
}
