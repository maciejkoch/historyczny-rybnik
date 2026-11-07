import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NavigationStart, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Consent } from '../../privacy/consent';

@Component({
  selector: 'app-portal-menu',
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive],
  templateUrl: './portal-menu.html',
  styleUrl: './portal-menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalMenu {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly consent = inject(Consent);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly drawer = viewChild.required<ElementRef<HTMLDialogElement>>('drawer');
  private readonly dropdown = viewChild.required<ElementRef<HTMLElement>>('dropdown');
  readonly opened = signal(false);

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) this.close();
    });
    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
      this.unlockScroll();
    });
  }

  toggle(): void {
    if (this.opened()) {
      this.close();
      return;
    }
    const window = this.document.defaultView;
    if (!window) return;
    this.opened.set(true);
    if (window.matchMedia('(max-width: 1099px)').matches) {
      this.drawer().nativeElement.showModal();
      this.document.documentElement.classList.add('portal-menu-open');
    } else {
      const popup = this.dropdown().nativeElement;
      const rect = this.trigger().nativeElement.getBoundingClientRect();
      popup.style.setProperty('--menu-right', `${Math.max(12, window.innerWidth - rect.right)}px`);
      popup.showPopover();
      const height = popup.getBoundingClientRect().height;
      const top = rect.bottom + 8;
      popup.style.setProperty(
        '--menu-top',
        `${Math.max(8, Math.min(top, window.innerHeight - height - 8))}px`,
      );
      popup.querySelector<HTMLElement>('a')?.focus();
    }
  }

  close(): void {
    if (!this.opened()) return;
    this.opened.set(false);
    if (this.drawer().nativeElement.open) this.drawer().nativeElement.close();
    this.dropdown().nativeElement.hidePopover();
    this.unlockScroll();
    this.trigger().nativeElement.focus({ preventScroll: true });
  }

  settings(): void {
    this.close();
    this.consent.openSettings();
  }

  trapFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const controls = Array.from(
      this.drawer().nativeElement.querySelectorAll<HTMLElement>('button, a[href]'),
    );
    const first = controls[0];
    const last = controls[controls.length - 1];
    const active = this.document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  onPopoverToggle(event: Event): void {
    if ((event as ToggleEvent).newState === 'closed' && this.opened()) this.close();
  }

  onDropdownFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (
      next instanceof Node &&
      !this.dropdown().nativeElement.contains(next) &&
      next !== this.trigger().nativeElement
    )
      this.close();
  }

  private unlockScroll(): void {
    this.document.documentElement.classList.remove('portal-menu-open');
  }
}
