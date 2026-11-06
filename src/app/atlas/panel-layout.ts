import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

const MIN_WIDTH = 280;
const DEFAULT_WIDTH = 410;
const STORAGE_KEY = 'historyczny-rybnik.panel.v1';

@Directive({
  selector: '[appPanelLayout]',
  exportAs: 'panelLayout',
  host: {
    '[style.--panel-width]': 'panelWidth() + "px"',
    '[style.--separator-width]': 'isCollapsed() ? "0px" : "8px"',
    '[class.panel-collapsed]': 'isCollapsed()',
    '[class.panel-resizing]': 'resizing()',
  },
})
export class PanelLayout {
  readonly side = input<'left' | 'right'>('left');
  readonly split = input(false);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly preferredWidth = signal(DEFAULT_WIDTH);
  private readonly collapsed = signal(false);
  private readonly desktop = signal(false);
  private readonly viewportWidth = signal(1280);
  readonly resizing = signal(false);
  readonly toggled = output<boolean>();
  readonly minWidth = MIN_WIDTH;
  readonly maxWidth = computed(() =>
    Math.max(
      MIN_WIDTH,
      Math.min(
        Math.floor(this.viewportWidth() * 0.6),
        this.split() ? Math.floor((this.viewportWidth() - 336) / 2) : this.viewportWidth() - 328,
      ),
    ),
  );
  readonly expandedWidth = computed(() => this.clamp(this.preferredWidth()));
  readonly isCollapsed = computed(() => this.desktop() && this.collapsed());
  readonly panelWidth = computed(() => (this.isCollapsed() ? 56 : this.expandedWidth()));
  private drag?: {
    pointerId: number;
    startX: number;
    startWidth: number;
    previousWidth: number;
    handle: HTMLElement;
  };

  constructor() {
    afterNextRender(() => {
      const media = window.matchMedia('(min-width: 1100px)');
      const syncViewport = () => {
        if (this.drag) this.finishResize(true);
        this.viewportWidth.set(
          this.host.nativeElement.closest('.atlas-shell')?.clientWidth ?? window.innerWidth,
        );
        this.desktop.set(media.matches);
      };
      syncViewport();
      try {
        const saved: unknown = JSON.parse(localStorage.getItem(this.storageKey()) ?? 'null');
        if (saved && typeof saved === 'object' && 'width' in saved && 'collapsed' in saved) {
          if (
            typeof saved.width === 'number' &&
            Number.isFinite(saved.width) &&
            saved.width >= MIN_WIDTH &&
            saved.width <= 5000
          )
            this.preferredWidth.set(saved.width);
          if (typeof saved.collapsed === 'boolean') this.collapsed.set(saved.collapsed);
        }
      } catch {
        /* Storage is optional, including private browsing and invalid saved data. */
      }
      window.addEventListener('resize', syncViewport);
      this.destroyRef.onDestroy(() => window.removeEventListener('resize', syncViewport));
    });
    this.destroyRef.onDestroy(() => this.finishResize(true));
  }

  toggle(): void {
    if (!this.desktop()) return;
    this.finishResize(true);
    this.collapsed.update((value) => !value);
    this.save();
    this.toggled.emit(this.isCollapsed());
  }

  expand(): void {
    this.collapsed.set(false);
    this.save();
  }

  startResize(event: PointerEvent): void {
    if (
      !this.desktop() ||
      this.isCollapsed() ||
      !event.isPrimary ||
      event.button !== 0 ||
      this.drag
    )
      return;
    event.preventDefault();
    const handle = event.currentTarget as HTMLElement;
    handle.focus({ preventScroll: true });
    handle.setPointerCapture(event.pointerId);
    this.drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: this.expandedWidth(),
      previousWidth: this.preferredWidth(),
      handle,
    };
    this.resizing.set(true);
  }

  moveResize(event: PointerEvent): void {
    if (this.drag?.pointerId !== event.pointerId) return;
    const direction = this.side() === 'right' ? -1 : 1;
    this.preferredWidth.set(
      this.clamp(this.drag.startWidth + direction * (event.clientX - this.drag.startX)),
    );
  }

  stopResize(event: PointerEvent, cancel = false): void {
    if (this.drag?.pointerId === event.pointerId) this.finishResize(cancel);
  }

  resizeByKeyboard(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.drag) {
      event.preventDefault();
      this.finishResize(true);
      return;
    }
    const step = event.shiftKey ? 64 : 16;
    let next: number;
    switch (event.key) {
      case 'ArrowLeft':
        next = this.expandedWidth() + (this.side() === 'right' ? step : -step);
        break;
      case 'ArrowRight':
        next = this.expandedWidth() + (this.side() === 'right' ? -step : step);
        break;
      case 'Home':
        next = MIN_WIDTH;
        break;
      case 'End':
        next = this.maxWidth();
        break;
      case 'Enter':
        event.preventDefault();
        this.host.nativeElement
          .querySelector<HTMLElement>('[data-panel-toggle]')
          ?.focus({ preventScroll: true });
        this.toggle();
        return;
      default:
        return;
    }
    event.preventDefault();
    this.preferredWidth.set(this.clamp(next));
    this.save();
  }

  resetWidth(): void {
    this.preferredWidth.set(this.clamp(DEFAULT_WIDTH));
    this.save();
  }

  private clamp(width: number): number {
    return Math.round(Math.max(MIN_WIDTH, Math.min(this.maxWidth(), width)));
  }

  private finishResize(cancel = false): void {
    const drag = this.drag;
    if (!drag) return;
    this.drag = undefined;
    if (cancel) this.preferredWidth.set(drag.previousWidth);
    this.resizing.set(false);
    if (drag.handle.hasPointerCapture(drag.pointerId))
      drag.handle.releasePointerCapture(drag.pointerId);
    if (!cancel) this.save();
  }

  private save(): void {
    try {
      localStorage.setItem(
        this.storageKey(),
        JSON.stringify({ width: this.preferredWidth(), collapsed: this.collapsed() }),
      );
    } catch {
      /* The controls remain usable when persistent storage is unavailable. */
    }
  }

  private storageKey(): string {
    return this.side() === 'right' ? 'historyczny-rybnik.details-panel.v1' : STORAGE_KEY;
  }
}
