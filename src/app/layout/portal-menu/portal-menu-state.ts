import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PortalMenuState {
  private readonly document = inject(DOCUMENT);
  private readonly currentMode = signal<'drawer' | 'dropdown' | null>(null);
  private trigger: HTMLButtonElement | null = null;
  private returnFocus = false;
  readonly mode = this.currentMode.asReadonly();

  toggle(trigger: HTMLButtonElement): void {
    if (this.mode()) {
      this.close();
      return;
    }
    const window = this.document.defaultView;
    if (!window) return;
    this.trigger = trigger;
    this.currentMode.set(window.matchMedia('(max-width: 1099px)').matches ? 'drawer' : 'dropdown');
  }

  close(returnFocus = true): void {
    if (!this.mode()) return;
    this.returnFocus = returnFocus;
    this.currentMode.set(null);
  }

  restoreFocus(): void {
    if (this.returnFocus && this.trigger?.isConnected) this.trigger.focus({ preventScroll: true });
    this.returnFocus = false;
  }

  isTrigger(node: Node): boolean {
    return node === this.trigger;
  }
}
