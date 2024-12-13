import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders, Provider } from '@angular/core';

export const STACKED_PANELS_LOGGER: InjectionToken<Console> = new InjectionToken<Console>('STACKED_PANELS_LOGGER');

export function injectLogger(): Console {
  return inject(STACKED_PANELS_LOGGER, {optional: true}) || console;
}

export function provideStackedPanelsConfig(config: {logger: Console}): EnvironmentProviders {
  const providers: Provider[] = [
    {provide: STACKED_PANELS_LOGGER, useValue: config.logger}
  ];
  return makeEnvironmentProviders(providers);
}
