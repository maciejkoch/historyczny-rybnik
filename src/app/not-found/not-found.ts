import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-not-found',
  template: `<main class="not-found"><img src="/brand/ryba-na-mapie.svg" width="120" height="84" alt="Historyczny Rybnik" /><p class="eyebrow">Błąd 404</p><h1>Nie ma takiej strony</h1><p>Sprawdź adres lub wróć na stronę główną serwisu.</p><a class="btn btn-primary" href="/">Wróć do serwisu</a></main>`,
  styles: `.not-found { min-height: 100svh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; padding: 2rem; text-align: center; } h1 { font-size: 2.5rem; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound {}
