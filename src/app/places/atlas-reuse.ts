import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, BaseRouteReuseStrategy } from '@angular/router';
import { Atlas } from '../atlas/atlas';
@Injectable()
export class AtlasReuse extends BaseRouteReuseStrategy {
  override shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    current: ActivatedRouteSnapshot,
  ): boolean {
    return (
      (future.component === Atlas && current.component === Atlas) ||
      super.shouldReuseRoute(future, current)
    );
  }
}
