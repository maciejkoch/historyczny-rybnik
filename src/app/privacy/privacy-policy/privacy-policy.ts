import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { PUBLIC_ORIGIN } from '../../places/runtime-config';
import { PortalHeader } from '../../layout/portal-header/portal-header';
import { MobileNavigation } from '../../layout/mobile-navigation/mobile-navigation';
@Component({
  selector: 'app-privacy-policy',
  imports: [PortalHeader, MobileNavigation],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicy {
  constructor() {
    const document = inject(DOCUMENT);
    const meta = inject(Meta);
    const title = 'Prywatność — Historyczny Rybnik';
    const description =
      'Informacje o prywatności, plikach cookie i ustawieniach zgód w serwisie Historyczny Rybnik.';
    const url = PUBLIC_ORIGIN + '/prywatnosc';
    meta.updateTag({ name: 'description', content: description });
    for (const [property, content] of Object.entries({
      'og:title': title,
      'og:description': description,
      'og:url': url,
      'og:type': 'website',
    }))
      meta.updateTag({ property, content });
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }
}
