import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialog
      class="modal"
      [attr.aria-label]="title()"
      [attr.aria-description]="message()"
      (close)="closed.emit(dialog.returnValue === 'confirm')"
    >
      <div class="modal-box">
        <h2 class="text-xl font-semibold">{{ title() }}</h2>
        <p class="mt-4">{{ message() }}</p>
        <form method="dialog" class="modal-action">
          <button type="submit" value="cancel" class="btn" autofocus>{{ cancelLabel() }}</button>
          <button
            type="submit"
            value="confirm"
            class="btn"
            [class.btn-error]="destructive()"
            [class.btn-primary]="!destructive()"
          >
            {{ confirmLabel() }}
          </button>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="submit" value="cancel" aria-label="Zamknij okno">Zamknij</button>
      </form>
    </dialog>
  `,
})
export class ConfirmDialog {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Potwierdź');
  readonly cancelLabel = input('Anuluj');
  readonly destructive = input(false);
  readonly closed = output<boolean>();
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open(): void {
    const dialog = this.dialog().nativeElement;
    if (dialog.open) return;
    dialog.returnValue = '';
    dialog.showModal();
  }
}
