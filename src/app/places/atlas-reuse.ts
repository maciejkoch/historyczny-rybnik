import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, BaseRouteReuseStrategy } from '@angular/router';
@Injectable()
export class AtlasReuse extends BaseRouteReuseStrategy {
  override shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    current: ActivatedRouteSnapshot,
  ): boolean {
    return (
      (future.data['atlas'] === true && current.data['atlas'] === true) ||
      super.shouldReuseRoute(future, current)
    );
  }
}
