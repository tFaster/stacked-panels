import { ModuleWithProviders, NgModule } from '@angular/core';
import { STACKED_PANELS_LOGGER } from './logger/logger';

@NgModule()
export class StackedPanelsModule {
  static withConfig(config: { logger: Console }): ModuleWithProviders<StackedPanelsModule> {
    return {
      ngModule: StackedPanelsModule,
      providers: [
        {provide: STACKED_PANELS_LOGGER, useValue: config.logger}
      ]
    };
  }
}
