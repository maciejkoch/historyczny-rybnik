import { Account } from '../../places/account';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { NavigationStart, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Consent } from '../../privacy/consent';
import { PortalMenuState } from './portal-menu-state';

@Component({
  selector: 'app-portal-menu',
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive],
  templateUrl: './portal-menu.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'drawer drawer-end',
    '(document:keydown.escape)': 'menu.close()',
    '(window:resize)': 'menu.close()',
  },
})
export class PortalMenu {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly consent = inject(Consent);
  private readonly drawer = viewChild.required<ElementRef<HTMLElement>>('drawer');
  private readonly closeButton = viewChild.required<ElementRef<HTMLButtonElement>>('closeButton');
  private readonly dropdown = viewChild.required<ElementRef<HTMLElement>>('dropdown');
  readonly account = inject(Account);
  async toggleAccount(): Promise<void> {
    this.menu.close();
    await this.account.toggle();
  }
  readonly menu = inject(PortalMenuState);

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) this.menu.close(false);
    });
    afterRenderEffect(() => {
      const mode = this.menu.mode();
      const popup = this.dropdown().nativeElement;
      this.document.documentElement.classList.toggle('portal-menu-open', mode === 'drawer');
      if (mode === 'drawer') {
        this.drawer().nativeElement.scrollTop = 0;
        this.focusDrawer();
      } else if (mode === 'dropdown') {
        popup.showPopover();
        popup.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
      } else {
        popup.hidePopover();
        this.menu.restoreFocus();
      }
    });
    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
      this.document.documentElement.classList.remove('portal-menu-open');
    });
  }

  settings(): void {
    this.menu.close();
    this.consent.openSettings();
  }

  focusDrawer(): void {
    if (
      this.menu.mode() === 'drawer' &&
      !this.drawer().nativeElement.contains(this.document.activeElement)
    )
      this.closeButton().nativeElement.focus({ preventScroll: true });
  }

  trapFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const controls = Array.from(
      this.drawer().nativeElement.querySelectorAll<HTMLElement>('button, a[href]'),
    );
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && this.document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && this.document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  onPopoverToggle(event: Event): void {
    if ((event as ToggleEvent).newState === 'closed' && this.menu.mode() === 'dropdown') {
      this.menu.close();
    }
  }

  onDropdownFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (
      next instanceof Node &&
      !this.dropdown().nativeElement.contains(next) &&
      !this.menu.isTrigger(next)
    )
      this.menu.close(false);
  }
}
