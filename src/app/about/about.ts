import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { PortalHeader } from '../layout/portal-header/portal-header';
import { PortalFooter } from '../layout/portal-footer/portal-footer';
import { MobileNavigation } from '../layout/mobile-navigation/mobile-navigation';

@Component({
  selector: 'app-about',
  imports: [RouterLink, PortalHeader, PortalFooter, MobileNavigation],
  templateUrl: './about.html',
  styleUrl: './about.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {
  constructor() {
    const document = inject(DOCUMENT);
    const meta = inject(Meta);
    const title = 'O nas — Historyczny Rybnik';
    const description =
      'Poznaj ideę Historycznego Rybnika: miejsca międzywojennego miasta, plan z 1932 roku i historie odczytywane ze źródeł.';
    const url = 'https://historyczny-rybnik-dev.web.app/o-nas';
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
