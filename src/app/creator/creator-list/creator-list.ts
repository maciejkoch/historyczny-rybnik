import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Account } from '../../places/account';
import { PortalHeader } from '../../layout/portal-header/portal-header';
import { normalizeSearch } from '../../places/place';
import { Creator, CreatorItem } from '../creator';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-creator-list',
  imports: [PortalHeader, ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <header appPortalHeader></header>
    <main class="mx-auto max-w-3xl px-[1.4rem] py-10">
      <h1 class="text-3xl font-semibold">Kreator miejsc</h1>
      @if (!allowed()) {
        <p class="mt-5">Kreator jest dostępny dla zalogowanych administratorów.</p>
      } @else {
        <div class="mt-6 flex flex-wrap gap-4">
          <label class="input input-bordered flex-1"
            ><span class="sr-only">Szukaj miejsca</span
            ><input
              type="search"
              placeholder="Szukaj miejsca"
              [value]="query()"
              (input)="query.set($any($event.target).value)" /></label
          ><button #addButton class="btn btn-primary" [disabled]="busy()" (click)="create()">
            Dodaj nowe miejsce
          </button>
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
              <li class="flex items-center gap-4 py-4">
                <div class="min-w-0 flex-1">
                  <strong>{{ item.name || 'Nowy szkic' }}</strong>
                  <p class="text-sm">{{ label(item.status) }}</p>
                </div>
                <button class="btn btn-outline btn-sm" [disabled]="busy()" (click)="open(item.id)">
                  Otwórz
                </button>
                @if (item.status === 'draft') {
                  <button
                    class="btn btn-ghost btn-sm"
                    [disabled]="busy()"
                    (click)="confirmRemove(item)"
                  >
                    Usuń
                  </button>
                }
              </li>
            } @empty {
              <li class="py-5">Brak miejsc do wyświetlenia.</li>
            }
          </ul>
        }
      }
    </main>
    <app-confirm-dialog
      title="Usuń szkic"
      [message]="'Czy na pewno chcesz usunąć szkic „' + (selected()?.name || 'Nowy szkic') + '”?'"
      confirmLabel="Usuń szkic"
      [destructive]="true"
      (closed)="onConfirmation($event)"
    />`,
})
export class CreatorList {
  readonly account = inject(Account);
  readonly creator = inject(Creator);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  readonly allowed = computed(() => this.creator.local || this.account.admin());
  readonly query = signal('');
  readonly items = signal<CreatorItem[]>([]);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly filtered = computed(() => {
    const q = normalizeSearch(this.query());
    return this.items().filter((item) => normalizeSearch(item.name).includes(q));
  });
  constructor() {
    effect(() => {
      if (this.allowed()) untracked(() => void this.load());
      else this.items.set([]);
    });
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
  async open(id: string): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      const draft = await this.creator.open(id);
      await this.router.navigate(['/kreator', draft.id]);
    } catch {
      this.error.set('Nie udało się otworzyć szkicu.');
    } finally {
      this.busy.set(false);
    }
  }
  readonly selected = signal<CreatorItem | null>(null);
  private readonly confirmation = viewChild.required(ConfirmDialog);
  private readonly addButton = viewChild<ElementRef<HTMLButtonElement>>('addButton');
  confirmRemove(item: CreatorItem): void {
    this.selected.set(item);
    this.confirmation().open();
  }
  async onConfirmation(confirmed: boolean): Promise<void> {
    const item = this.selected();
    this.selected.set(null);
    if (!confirmed || !item) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.creator.remove(item.id);
      await this.load();
    } catch {
      this.error.set('Nie udało się usunąć szkicu.');
    } finally {
      this.busy.set(false);
      afterNextRender(() => this.addButton()?.nativeElement.focus(), { injector: this.injector });
    }
  }
}
