import { ModuleWithProviders, NgModule } from '@angular/core';
import { StackedPanelsComponent } from './stacked-panels.component';
import { StackedPanelComponent } from './stacked-panel/stacked-panel.component';
import { CommonModule } from '@angular/common';
import { STACKED_PANELS_LOGGER } from './logger/logger';

@NgModule({
  declarations: [
    StackedPanelComponent,
    StackedPanelsComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    StackedPanelsComponent
  ]
})
export class StackedPanelsModule {
  static withConfig(config: {logger: Console}): ModuleWithProviders<StackedPanelsModule> {
    return {
      ngModule: StackedPanelsModule,
      providers: [
        {provide: STACKED_PANELS_LOGGER, useValue: config.logger}
      ]
    };
  }
}
