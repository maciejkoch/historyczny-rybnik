import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PortalHeader } from '../../layout/portal-header/portal-header';
import { normalizeSearch } from '../../places/place';
import { Creator, CreatorItem } from '../creator';
import { MARKER_CATEGORIES, markerIcon } from '../../atlas-map/place-markers';

@Component({
  selector: 'app-creator-list',
  imports: [PortalHeader, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header appPortalHeader></header>
    <main class="mx-auto max-w-3xl px-[1.4rem] py-10">
      <h1 class="text-3xl font-semibold">Kreator miejsc</h1>
      <div class="mt-6 flex flex-wrap gap-4">
        <label class="input input-bordered flex-1"
          ><span class="sr-only">Szukaj miejsca</span
          ><input
            type="search"
            placeholder="Szukaj miejsca"
            [value]="query()"
            (input)="query.set($any($event.target).value)" /></label
        ><button class="btn btn-primary" [disabled]="busy()" (click)="create()">
          Dodaj nowe miejsce
        </button>
      </div>
      <div class="join mt-4" role="group" aria-label="Filtr stanu publikacji">
        @for (option of filters; track option.value) {
          <button
            type="button"
            class="btn btn-sm join-item"
            [class.btn-primary]="statusFilter() === option.value"
            [attr.aria-pressed]="statusFilter() === option.value"
            (click)="statusFilter.set(option.value)"
          >
            {{ option.label }}
          </button>
        }
      </div>
      @if (error()) {
        <div role="alert" class="alert alert-error mt-4">
          <span>{{ error() }}</span
          ><button class="btn btn-sm" (click)="load()">Ponów</button>
        </div>
      }
      @if (loading()) {
        <p class="mt-5" role="status">Wczytywanie miejsc…</p>
      } @else {
        <ul class="mt-6 divide-y divide-base-300">
          @for (item of filtered(); track item.id) {
            <li>
              <a
                class="flex items-center gap-4 rounded-box px-2 py-4 hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-primary"
                [routerLink]="['/kreator', item.id]"
              >
                <img
                  class="h-6 w-6 shrink-0 brightness-0"
                  [src]="icon(item.tagId)"
                  alt=""
                  aria-hidden="true"
                />
                <span class="min-w-0 flex-1"
                  ><strong>{{ item.name || 'Nowy szkic' }}</strong
                  ><span class="block text-sm">{{ label(item.status) }}</span></span
                >
              </a>
            </li>
          } @empty {
            <li class="py-5">Brak miejsc do wyświetlenia.</li>
          }
        </ul>
      }
    </main>
  `,
})
export class CreatorList {
  readonly creator = inject(Creator);
  private readonly router = inject(Router);
  readonly query = signal('');
  readonly statusFilter = signal<'all' | 'drafts' | 'published'>('all');
  readonly filters = [
    { value: 'all', label: 'Wszystko' },
    { value: 'drafts', label: 'Szkice' },
    { value: 'published', label: 'Opublikowane' },
  ] as const;
  readonly items = signal<CreatorItem[]>([]);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly filtered = computed(() => {
    const q = normalizeSearch(this.query());
    const status = this.statusFilter();
    return this.items().filter(
      (item) =>
        normalizeSearch(item.name).includes(q) &&
        (status === 'all' ||
          (status === 'drafts' ? item.status !== 'published' : item.status !== 'draft')),
    );
  });
  constructor() {
    afterNextRender(() => void this.load());
  }
  label(status: CreatorItem['status']): string {
    return { published: 'Opublikowane', modified: 'Nieopublikowane zmiany', draft: 'Nowy szkic' }[
      status
    ];
  }
  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.items.set(await this.creator.list());
    } catch {
      this.error.set('Nie udało się pobrać miejsc.');
    } finally {
      this.loading.set(false);
    }
  }
  async create(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      const draft = await this.creator.create();
      await this.router.navigate(['/kreator', draft.id]);
    } catch {
      this.error.set('Nie udało się utworzyć szkicu.');
    } finally {
      this.busy.set(false);
    }
  }
  icon(tagId: string | null): string {
    const category =
      MARKER_CATEGORIES.find((item) => item.id === tagId) ??
      MARKER_CATEGORIES[MARKER_CATEGORIES.length - 1];
    return markerIcon(category.icon);
  }
}
