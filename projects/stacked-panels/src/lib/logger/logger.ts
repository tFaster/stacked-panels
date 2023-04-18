import { inject, InjectionToken } from '@angular/core';

export const STACKED_PANELS_LOGGER: InjectionToken<Console> = new InjectionToken<Console>('STACKED_PANELS_LOGGER');

export function injectLogger(): Console {
  return inject(STACKED_PANELS_LOGGER) || console;
}
