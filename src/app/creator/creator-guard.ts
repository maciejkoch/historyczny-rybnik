import { effect, inject, Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Account } from '../places/account';

@Injectable({ providedIn: 'root' })
export class CreatorAccess {
  private readonly account = inject(Account);
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      if (
        this.account.authorizationReady() &&
        !this.account.admin() &&
        /^\/kreator(?:\/|\?|#|$)/.test(this.router.url)
      )
        void this.router.navigateByUrl('/');
    });
  }

  async allowed(): Promise<boolean> {
    return this.account.isAdministrator();
  }
}

export const creatorGuard: CanActivateFn = async () => {
  const access = inject(CreatorAccess);
  const router = inject(Router);
  return (await access.allowed()) ? true : router.parseUrl('/');
};
