import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideStackedPanelsConfig } from '@tfaster/stacked-panels';

const demoLogger: Console = {
  debug: window.console.debug.bind(window.console, '\x1B[1m[StackedPanels Demo Logger]\x1B[m')
} as unknown as Console

export const appConfig: ApplicationConfig = {
  providers: [
    provideStackedPanelsConfig({logger: demoLogger}),
    importProvidersFrom(
      BrowserAnimationsModule
    )
  ]
};
